import '@/test/factories/setup';

import { faker } from '@faker-js/faker';
import { ChatZod } from '@smartspace/api-client';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { fake } from 'zod-schema-faker/v4';

import { parseOrThrow } from '@/platform/validation';

import {
  mapCommentDtoToModel,
  mapCommentsDtoToModels,
} from '@/domains/comments/mapper';
import { coerceFileUploadResponse } from '@/domains/files/service';
import { mapFlowRunVariablesDtoToModel } from '@/domains/flowruns/mapper';
import {
  coerceMessageDto,
  coerceMessageValueDto,
} from '@/domains/messages/service';
import {
  mapModelDtoToModel,
  mapModelsEnvelopeDtoToModels,
} from '@/domains/models/mapper';
import { mapNotificationsEnvelopeDto } from '@/domains/notifications/mapper';
import { mapThreadUserDtoToModel } from '@/domains/thread-users/mapper';

import {
  mapFileInfoDtoToModel,
  mapMentionUserDtoToModel,
  mapMessageDtoToModel,
  mapMessageErrorDtoToModel,
  mapMessagesDtoToModels,
  mapMessageValueDtoToModel,
  mapThreadDtoToModel,
  mapThreadsResponseDtoToModel,
  mapWorkspaceDtoToModel,
  mapWorkspacesDtoToModels,
} from '@smartspace/chat-ui';

/**
 * Spec-conformance fuzz suite.
 *
 * Invariant: ANY response that conforms to the SDK's generated Zod schema for
 * an endpoint must survive the local parse + mapper pipeline for that
 * endpoint. The generated schemas are the contract the backend publishes;
 * the local pipeline (parseOrThrow / coercion helpers / mappers) must accept
 * everything that contract permits. When the SDK is bumped, this suite is
 * what catches "the spec widened but our pipeline didn't".
 *
 * Mechanism: for each domain pipeline we fake payloads straight from the
 * generated response schema (deterministically seeded so failures reproduce),
 * plus two classes of targeted variants:
 *   - a "minimal" payload with every optional/nullish field absent, and
 *   - forced enum branches for fields the mappers branch on.
 * The payload is then pushed through the real pipeline exactly as the
 * service does it — same parse call, same coercion helpers, same mappers.
 *
 * Pipelines intentionally not covered (no generated response schema is
 * parsed locally):
 *   - users domain — only consumes the profile-photo endpoint, whose
 *     response is a binary `z.instanceof(File)`; nothing to parse/map.
 *   - void endpoints (thread delete/rename/pin, add thread user,
 *     notification mark-read/mark-all-read) — no response body consumed.
 *   - file download / SAS URI helpers — blob and ad-hoc `{ uri }` responses
 *     fetched outside the SDK client, no generated schema involved.
 */

const SEED_BASE = 20260612;
const RUNS = 25;

// ---------------------------------------------------------------------------
// Optional-stripping walker
// ---------------------------------------------------------------------------

/** Minimal structural view of a Zod schema — enough to walk it. */
interface SchemaNode {
  safeParse: (value: unknown) => { success: boolean; error?: Error };
  unwrap?: () => SchemaNode;
  shape?: Record<string, SchemaNode>;
  element?: SchemaNode;
  valueType?: SchemaNode;
  _zod?: { def?: { type?: string } };
}

const defType = (schema: SchemaNode): string => schema._zod?.def?.type ?? '';

/**
 * Unwraps `.optional()` / `.nullable()` / `.nullish()` wrappers only. Beware:
 * Zod v4 also puts `.unwrap()` on arrays (returning the element schema), so a
 * blanket unwrap loop would silently turn arrays into their element type.
 */
const unwrapWrappers = (schema: SchemaNode): SchemaNode => {
  let current = schema;
  while (
    (defType(current) === 'optional' || defType(current) === 'nullable') &&
    typeof current.unwrap === 'function'
  ) {
    current = current.unwrap();
  }
  return current;
};

/**
 * Deep-copies `value`, omitting every object property whose schema accepts
 * `undefined` (i.e. `.optional()` / `.nullish()` / `z.any()` fields). The
 * result is still spec-conformant — it is the leanest payload the contract
 * allows, which is exactly the shape most likely to trip `dto.x.map(...)`
 * style mapper bugs.
 */
function withoutOptionals(schema: SchemaNode, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const core = unwrapWrappers(schema);

  if (defType(core) === 'array' && core.element && Array.isArray(value)) {
    const element = core.element;
    return value.map((item) => withoutOptionals(element, item));
  }

  if (
    defType(core) === 'object' &&
    core.shape &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const result: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(core.shape)) {
      if (propSchema.safeParse(undefined).success) continue;
      result[key] = withoutOptionals(
        propSchema,
        (value as Record<string, unknown>)[key]
      );
    }
    return result;
  }

  if (
    defType(core) === 'record' &&
    core.valueType &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const valueType = core.valueType;
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>
    )) {
      result[key] = withoutOptionals(valueType, entry);
    }
    return result;
  }

  return value;
}

// ---------------------------------------------------------------------------
// Case harness
// ---------------------------------------------------------------------------

interface ConformanceCase {
  name: string;
  generate: (seed: number) => unknown;
  minimal: () => unknown;
  run: (payload: unknown) => unknown;
  variants: Array<{ name: string; payload: () => unknown }>;
}

function conformanceCase<S extends z.ZodType>(options: {
  name: string;
  schema: S;
  run: (payload: z.infer<S>) => unknown;
  variants?: Array<{ name: string; payload: () => z.infer<S> }>;
}): ConformanceCase {
  const { name, schema, run, variants = [] } = options;
  return {
    name,
    generate: (seed) => {
      faker.seed(seed);
      return fake(schema);
    },
    minimal: () => {
      faker.seed(SEED_BASE);
      const payload = fake(schema);
      const stripped = withoutOptionals(
        schema as unknown as SchemaNode,
        payload
      );
      const check = schema.safeParse(stripped);
      if (!check.success) {
        throw new Error(
          `[${name}] optional-stripping produced a non-conformant payload — ` +
            `walker bug, not a pipeline gap: ${check.error.message}`
        );
      }
      return stripped;
    },
    run: run as (payload: unknown) => unknown,
    variants,
  };
}

function runOrExplain(
  conformance: ConformanceCase,
  payload: unknown,
  context: string
): void {
  try {
    conformance.run(payload);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(
      `[${conformance.name}] local pipeline rejected a spec-conformant payload (${context}).\n` +
        `Error: ${detail}\n` +
        `Payload: ${JSON.stringify(payload)?.slice(0, 4000)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Schema handles shared by cases and enum variants
// ---------------------------------------------------------------------------

const notificationItemSchema =
  ChatZod.notificationGetResponse.shape.data.element;
const messageItemSchema =
  ChatZod.messageThreadsThreadMessagesIdMessagesResponse.shape.data.element;
const messageValueSchema = messageItemSchema.shape.values.element;
const messageErrorSchema = messageItemSchema.shape.errors.element;
const modelListItemSchema = ChatZod.modelsGetModelsResponse.shape.data.element;
const workspaceVariableSchema =
  ChatZod.workSpacesGetIdResponse.shape.variables.valueType;

const THREAD_ID = '00000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// Cases — one per domain pipeline, mirroring the service code exactly
// ---------------------------------------------------------------------------

const cases: ConformanceCase[] = [
  // threads — fetchThreads
  conformanceCase({
    name: 'threads: list (workSpacesThreadResponse)',
    schema: ChatZod.workSpacesThreadResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.workSpacesThreadResponse, payload);
      return mapThreadsResponseDtoToModel(parsed);
    },
  }),

  // threads — fetchThread
  conformanceCase({
    name: 'threads: detail (messageThreadsGetMessageThread...Response)',
    schema:
      ChatZod.messageThreadsGetMessageThreadWorkspacesWorkspaceIdMessagethreadsIdResponse,
    run: (payload) => {
      const parsed = parseOrThrow(
        ChatZod.messageThreadsGetMessageThreadWorkspacesWorkspaceIdMessagethreadsIdResponse,
        payload
      );
      return mapThreadDtoToModel(parsed);
    },
  }),

  // threads — createThread. The service maps `parsed.data[0]` and throws a
  // deliberate domain error when the array is empty; mapping every element
  // covers the parse+map invariant without re-testing that guard.
  conformanceCase({
    name: 'threads: create (messageThreadsCreateMessageThreadResponse)',
    schema: ChatZod.messageThreadsCreateMessageThreadResponse,
    run: (payload) => {
      const parsed = parseOrThrow(
        ChatZod.messageThreadsCreateMessageThreadResponse,
        payload
      );
      return parsed.data.map(mapThreadDtoToModel);
    },
  }),

  // messages — fetchMessages
  conformanceCase({
    name: 'messages: list (messageThreadsThreadMessagesIdMessagesResponse)',
    schema: ChatZod.messageThreadsThreadMessagesIdMessagesResponse,
    run: (payload) => {
      const parsed = parseOrThrow(
        ChatZod.messageThreadsThreadMessagesIdMessagesResponse,
        payload
      );
      return mapMessagesDtoToModels(parsed.data);
    },
    variants: messageValueSchema.shape.type.options.map((option) => ({
      name: `values[0].type=${option}`,
      payload: () => {
        faker.seed(SEED_BASE);
        const payload = fake(
          ChatZod.messageThreadsThreadMessagesIdMessagesResponse
        );
        payload.data = [
          {
            ...fake(messageItemSchema),
            values: [{ ...fake(messageValueSchema), type: option }],
          },
        ];
        return payload;
      },
    })),
  }),

  // messages — streamThreadMessages snapshot/message frames and postMessage
  // both run coerceMessageDto + element-schema parse + mapMessageDtoToModel.
  conformanceCase({
    name: 'messages: SSE message frame (message element schema)',
    schema: messageItemSchema,
    run: (payload) => {
      const raw = payload as unknown as Record<string, unknown>;
      coerceMessageDto(raw);
      return mapMessageDtoToModel(messageItemSchema.parse(raw));
    },
  }),

  // messages — streamThreadMessages delta frames: outputs and errors are
  // parsed per element with the value/error schemas.
  conformanceCase({
    name: 'messages: SSE delta output (value element schema)',
    schema: messageValueSchema,
    run: (payload) => {
      const raw = payload as unknown as Record<string, unknown>;
      coerceMessageValueDto(raw);
      return mapMessageValueDtoToModel(messageValueSchema.parse(raw));
    },
  }),
  conformanceCase({
    name: 'messages: SSE delta error (error element schema)',
    schema: messageErrorSchema,
    run: (payload) =>
      mapMessageErrorDtoToModel(messageErrorSchema.parse(payload)),
  }),

  // comments — fetchComments. The service deliberately skips parseOrThrow
  // (the live API sends mentionedUsers shapes the generated schema rejects)
  // and feeds the raw payload to the mapper, so the mapper alone is the
  // pipeline under test here.
  conformanceCase({
    name: 'comments: list (messageThreadsGetCommentsResponse)',
    schema: ChatZod.messageThreadsGetCommentsResponse,
    run: (payload) => mapCommentsDtoToModels(payload.data),
  }),

  // comments — addComment
  conformanceCase({
    name: 'comments: create (messageThreadsPostCommentResponse)',
    schema: ChatZod.messageThreadsPostCommentResponse,
    run: (payload) =>
      mapCommentDtoToModel({ ...payload, messageThreadId: THREAD_ID }),
  }),

  // models — fetchModels
  conformanceCase({
    name: 'models: list (modelsGetModelsResponse)',
    schema: ChatZod.modelsGetModelsResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.modelsGetModelsResponse, payload);
      return mapModelsEnvelopeDtoToModels(parsed);
    },
    variants: [
      ...modelListItemSchema.shape.deploymentStatus
        .unwrap()
        .options.map((option) => ({
          name: `deploymentStatus=${option}`,
          payload: () => {
            faker.seed(SEED_BASE);
            const payload = fake(ChatZod.modelsGetModelsResponse);
            payload.data = [
              { ...fake(modelListItemSchema), deploymentStatus: option },
            ];
            return payload;
          },
        })),
      ...modelListItemSchema.shape.modelDeploymentProviderType
        .unwrap()
        .options.map((option) => ({
          name: `modelDeploymentProviderType=${option}`,
          payload: () => {
            faker.seed(SEED_BASE);
            const payload = fake(ChatZod.modelsGetModelsResponse);
            payload.data = [
              {
                ...fake(modelListItemSchema),
                modelDeploymentProviderType: option,
              },
            ];
            return payload;
          },
        })),
      ...modelListItemSchema.shape.properties.element.shape.type.options.map(
        (option) => ({
          name: `properties[0].type=${option}`,
          payload: () => {
            faker.seed(SEED_BASE);
            const payload = fake(ChatZod.modelsGetModelsResponse);
            payload.data = [
              {
                ...fake(modelListItemSchema),
                properties: [
                  {
                    ...fake(modelListItemSchema.shape.properties.element),
                    type: option,
                  },
                ],
              },
            ];
            return payload;
          },
        })
      ),
    ],
  }),

  // models — fetchModel
  conformanceCase({
    name: 'models: detail (modelsGetModelResponse)',
    schema: ChatZod.modelsGetModelResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.modelsGetModelResponse, payload);
      return mapModelDtoToModel(parsed);
    },
  }),

  // notifications — fetchNotifications
  conformanceCase({
    name: 'notifications: list (notificationGetResponse)',
    schema: ChatZod.notificationGetResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.notificationGetResponse, payload);
      return mapNotificationsEnvelopeDto(parsed);
    },
    variants: notificationItemSchema.shape.notificationType.options.map(
      (option) => ({
        name: `notificationType=${option}`,
        payload: () => {
          faker.seed(SEED_BASE);
          const payload = fake(ChatZod.notificationGetResponse);
          payload.data = [
            { ...fake(notificationItemSchema), notificationType: option },
          ];
          return payload;
        },
      })
    ),
  }),

  // thread-users — fetchThreadUsers
  conformanceCase({
    name: 'thread-users: list (messageThreadsGetThreadUsersResponse)',
    schema: ChatZod.messageThreadsGetThreadUsersResponse,
    run: (payload) => {
      const parsed = parseOrThrow(
        ChatZod.messageThreadsGetThreadUsersResponse,
        payload
      );
      return parsed.map(mapThreadUserDtoToModel);
    },
  }),

  // files — getFileInfo
  conformanceCase({
    name: 'files: info (filesGetFileInfoResponse)',
    schema: ChatZod.filesGetFileInfoResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.filesGetFileInfoResponse, payload);
      return mapFileInfoDtoToModel(parsed);
    },
  }),

  // files — uploadFiles. The service maps `parsed[0]` of a one-item-per-file
  // response; mapping every element covers the parse+map invariant.
  conformanceCase({
    name: 'files: upload (filesUploadFilesResponse)',
    schema: ChatZod.filesUploadFilesResponse,
    run: (payload) => {
      const parsed = parseOrThrow(
        ChatZod.filesUploadFilesResponse,
        coerceFileUploadResponse(payload)
      );
      return parsed.map(mapFileInfoDtoToModel);
    },
  }),

  // flowruns — fetchFlowRunVariables
  conformanceCase({
    name: 'flowruns: variables (flowRunsGetVariablesResponse)',
    schema: ChatZod.flowRunsGetVariablesResponse,
    run: (payload) => {
      const parsed = parseOrThrow(
        ChatZod.flowRunsGetVariablesResponse,
        payload
      );
      return mapFlowRunVariablesDtoToModel(parsed);
    },
  }),

  // workspaces — fetchWorkspaces
  conformanceCase({
    name: 'workspaces: list (workSpacesGetGetResponse)',
    schema: ChatZod.workSpacesGetGetResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.workSpacesGetGetResponse, payload);
      return mapWorkspacesDtoToModels(parsed.data);
    },
  }),

  // workspaces — fetchWorkspace
  conformanceCase({
    name: 'workspaces: detail (workSpacesGetIdResponse)',
    schema: ChatZod.workSpacesGetIdResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.workSpacesGetIdResponse, payload);
      return mapWorkspaceDtoToModel(parsed);
    },
    variants: workspaceVariableSchema.shape.access.options.map((option) => ({
      name: `variables.access=${option}`,
      payload: () => {
        faker.seed(SEED_BASE);
        const payload = fake(ChatZod.workSpacesGetIdResponse);
        payload.variables = {
          conformance: { ...fake(workspaceVariableSchema), access: option },
        };
        return payload;
      },
    })),
  }),

  // workspaces — fetchTaggableUsers
  conformanceCase({
    name: 'workspaces: taggable users (workSpacesGetUsersResponse)',
    schema: ChatZod.workSpacesGetUsersResponse,
    run: (payload) => {
      const parsed = parseOrThrow(ChatZod.workSpacesGetUsersResponse, payload);
      return parsed.map(mapMentionUserDtoToModel);
    },
  }),
];

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('harness self-checks', () => {
  it('withoutOptionals strips optional fields and keeps required ones', () => {
    const schema = ChatZod.workSpacesThreadResponse;
    faker.seed(SEED_BASE);
    const payload = fake(schema);
    // Guarantee at least one item so the assertion is not vacuous.
    payload.data = [fake(schema.shape.data.element)];

    const stripped = withoutOptionals(
      schema as unknown as SchemaNode,
      payload
    ) as { data: Array<Record<string, unknown>> };

    // nullish fields must be absent, required fields must survive.
    expect(stripped.data[0]).not.toHaveProperty('name');
    expect(stripped.data[0]).not.toHaveProperty('createdBy');
    expect(stripped.data[0]).not.toHaveProperty('lastUpdated');
    expect(stripped.data[0]).toHaveProperty('id');
    expect(stripped.data[0]).toHaveProperty('workSpaceId');
    expect(stripped).toHaveProperty('total');
  });
});

describe('spec conformance fuzz', () => {
  for (const conformance of cases) {
    describe(conformance.name, () => {
      it(`survives ${RUNS} seeded spec-conformant payloads`, () => {
        for (let i = 0; i < RUNS; i++) {
          const seed = SEED_BASE + i;
          runOrExplain(conformance, conformance.generate(seed), `seed ${seed}`);
        }
      });

      it('survives a payload with every optional field absent', () => {
        runOrExplain(conformance, conformance.minimal(), 'minimal payload');
      });

      for (const variant of conformance.variants) {
        it(`survives forced branch ${variant.name}`, () => {
          runOrExplain(
            conformance,
            variant.payload(),
            `variant ${variant.name}`
          );
        });
      }
    });
  }
});
