import { describe, expect, it } from 'vitest';

import type { Model } from '@/domains/models/model';
import { getModelIcon } from '@/domains/models/model-icon';

const makeModel = (overrides: Partial<Model> = {}): Model => ({
  id: 'id',
  name: 'n',
  displayName: 'n',
  deploymentStatus: 's',
  modelDeploymentProviderType: '',
  modelPublisher: null,
  createdByUserId: 'u',
  createdAt: new Date(0),
  properties: [],
  virtualMachineUrl: null,
  ...overrides,
});

describe('getModelIcon', () => {
  it('returns null when model is null or undefined', () => {
    expect(getModelIcon(null)).toBeNull();
    expect(getModelIcon(undefined)).toBeNull();
  });

  it('returns an icon url when the publisher matches', () => {
    const icon = getModelIcon(makeModel({ modelPublisher: 'OpenAI' }));
    expect(icon).toBeTruthy();
    expect(typeof icon).toBe('string');
  });

  it('is case-insensitive on publisher', () => {
    const upper = getModelIcon(makeModel({ modelPublisher: 'META' }));
    const lower = getModelIcon(makeModel({ modelPublisher: 'meta' }));
    expect(upper).toBe(lower);
    expect(upper).toBeTruthy();
  });

  it('falls back to the foundry icon when publisher is unknown', () => {
    const fallback = getModelIcon(
      makeModel({
        modelPublisher: 'SomeNewPublisher',
        modelDeploymentProviderType: 'AzureOpenAi',
      })
    );
    const direct = getModelIcon(
      makeModel({ modelDeploymentProviderType: 'AzureOpenAi' })
    );
    expect(fallback).toBe(direct);
    expect(fallback).toBeTruthy();
  });

  it('falls back to the foundry icon when publisher is null', () => {
    const icon = getModelIcon(
      makeModel({
        modelPublisher: null,
        modelDeploymentProviderType: 'VertexAi',
      })
    );
    expect(icon).toBeTruthy();
  });

  it('returns null when neither publisher nor foundry match', () => {
    const icon = getModelIcon(
      makeModel({
        modelPublisher: 'unknown',
        modelDeploymentProviderType: 'nothing',
      })
    );
    expect(icon).toBeNull();
  });

  it('treats empty-string publisher as missing and falls back', () => {
    const icon = getModelIcon(
      makeModel({
        modelPublisher: '',
        modelDeploymentProviderType: 'OpenAi',
      })
    );
    expect(icon).toBeTruthy();
  });
});
