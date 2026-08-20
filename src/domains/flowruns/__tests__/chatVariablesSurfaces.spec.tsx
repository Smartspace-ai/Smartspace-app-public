import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  createFakeChatService,
  renderWithChat,
} from '@/test/chatProviderHarness';
import { ChatVariablesForm, type Workspace } from '@smartspace/chat-ui';

/**
 * The variables form renders on three surfaces — the composer's action bar, the
 * overflow panel, and (for a question asked mid-conversation) a full-scale form.
 * These lock in what each surface is: how many variables stay in the bar, what
 * shape they take there versus in the panel, and that an edit on either surface
 * still saves.
 *
 * NOTE: `@smartspace/chat-ui` resolves to the package's built `dist`, so run
 * `pnpm --filter @smartspace/chat-ui build` after editing its source or this
 * asserts against the previous build. CI is safe — install runs `prepare`.
 */

const THREAD_ID = '2b0f6a9e-8c58-4f0e-9d1e-7d4c2f0a1b33';
const LONG_OPTION = 'Starter 25 (Up to 25 people in one team)';

type Vars = NonNullable<Workspace['variables']>;

const workspaceWith = (variables: Vars) =>
  ({
    id: 'a2f9c1d4-3e77-4a51-9b2c-6d8e0f5a7b19',
    name: 'Ops',
    tags: [],
    showSources: false,
    dataSpaces: [],
    favorited: false,
    summary: '',
    firstPrompt: '',
    variables,
    supportsFiles: false,
    avatarName: 'Ops',
  } as unknown as Workspace);

const write = (schema: unknown) =>
  ({ access: 'Write', schema } as Vars[string]);

const THREE_VARS: Vars = {
  'Web search': write({ type: 'boolean', title: 'Web search' }),
  'Max results': write({ type: 'number', title: 'Max results' }),
  Tone: write({ type: 'string', title: 'Tone' }),
};

const SEVEN_VARS: Vars = {
  Model: write({ type: 'string', title: 'ModelId' }),
  'Web search': write({ type: 'boolean', title: 'Web search' }),
  Streaming: write({ type: 'boolean', title: 'Streaming' }),
  'Max results': write({ type: 'number', title: 'Max results' }),
  Tone: write({ type: 'string', title: 'Tone' }),
  Notes: write({ type: 'string', title: 'Notes' }),
  License: write({
    type: 'string',
    title: 'License',
    oneOf: [
      { const: 'starter25', title: LONG_OPTION },
      { const: 'growth100', title: 'Growth 100' },
    ],
  }),
};

const renderForm = (
  variables: Vars,
  serverValues: Record<string, unknown> = {}
) => {
  const updateFlowRunVariable = vi.fn(async () => undefined);
  const rendered = renderWithChat(
    <ChatVariablesForm
      workspace={workspaceWith(variables)}
      threadId={THREAD_ID}
      setVariables={() => undefined}
    />,
    {
      threadId: THREAD_ID,
      service: createFakeChatService({
        fetchFlowRunVariables: async () => serverValues,
        updateFlowRunVariable,
        fetchModels: async () => ({
          data: [{ id: 'm5', name: 'claude-opus-5', displayName: 'Opus 5' }],
          total: 1,
        }),
      }),
    }
  );
  return { ...rendered, updateFlowRunVariable };
};

const overflowTrigger = () =>
  screen.queryByRole('button', { expanded: false, name: /^Variables \(/ });

describe('variables form surfaces', () => {
  it('keeps a short set of variables in the action bar', async () => {
    renderForm(THREE_VARS, { 'Web search': true, 'Max results': 10, Tone: '' });

    // The toggle is the bar's own shape: a pressed-state pill, not a switch.
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Web search' })
          .getAttribute('aria-pressed')
      ).toBe('true')
    );
    expect(screen.queryByRole('switch')).toBeNull();
    expect(
      (screen.getByLabelText('Max results') as HTMLInputElement).value
    ).toBe('10');
    // Nothing overflowed, so there is no pill to open.
    expect(overflowTrigger()).toBeNull();
  });

  it('moves everything but the model behind one pill once the bar is crowded', async () => {
    renderForm(SEVEN_VARS, { License: 'starter25' });

    // Seven variables: the model stays inline, the other six move.
    const trigger = await screen.findByRole('button', {
      name: 'Variables (6)',
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Model' })).toBeTruthy();
    // The moved ones are not on the bar.
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('opens the panel as a settings list and closes on Escape', async () => {
    renderForm(SEVEN_VARS, { License: 'starter25', 'Web search': true });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Variables (6)' })
    );

    const panel = await screen.findByRole('dialog', {
      name: 'Workspace variables',
    });
    // In the panel a boolean is a switch row, not a pill.
    const toggles = within(panel).getAllByRole('switch');
    expect(toggles).toHaveLength(2);
    expect(toggles[0].getAttribute('aria-checked')).toBe('true');
    // …and the select shows its current value, clamped to one line so a long
    // option ends in an ellipsis rather than being cut mid-word.
    const select = within(panel).getByRole('button', { name: 'License' });
    expect(select.textContent).toContain(LONG_OPTION);
    expect(select.querySelector('.truncate')).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Workspace variables' })
      ).toBeNull()
    );
  });

  it('saves an edit made in the panel', async () => {
    const { updateFlowRunVariable } = renderForm(SEVEN_VARS, {
      'Web search': false,
      Streaming: false,
    });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Variables (6)' })
    );
    const panel = await screen.findByRole('dialog', {
      name: 'Workspace variables',
    });
    fireEvent.click(within(panel).getByRole('switch', { name: 'Web search' }));

    await waitFor(() =>
      expect(updateFlowRunVariable).toHaveBeenCalledWith({
        flowRunId: THREAD_ID,
        name: 'Web search',
        value: true,
      })
    );
  });

  it('picks a value from the select and saves it', async () => {
    const { updateFlowRunVariable } = renderForm(SEVEN_VARS, {
      License: 'starter25',
    });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Variables (6)' })
    );
    const panel = await screen.findByRole('dialog', {
      name: 'Workspace variables',
    });
    fireEvent.click(within(panel).getByRole('button', { name: 'License' }));

    const list = await screen.findByRole('listbox', { name: 'License' });
    fireEvent.click(within(list).getByRole('option', { name: 'Growth 100' }));

    await waitFor(() =>
      expect(updateFlowRunVariable).toHaveBeenCalledWith({
        flowRunId: THREAD_ID,
        name: 'License',
        value: 'growth100',
      })
    );
  });

  it('renders nothing when the workspace has no variables', async () => {
    const { container } = renderForm({});
    await waitFor(() => expect(container.textContent).toBe(''));
  });
});
