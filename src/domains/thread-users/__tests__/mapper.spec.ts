import { describe, expect, it } from 'vitest';

import { mapThreadUserDtoToModel } from '@/domains/thread-users/mapper';

import { makeThreadUser } from '@/test/factories';

describe('thread-users mapper', () => {
  it('maps all fields from dto to model', () => {
    const dto = makeThreadUser({
      id: 'tu1',
      userId: 'u1',
      displayName: 'Alice',
      emailAddress: 'alice@example.com',
    });
    const model = mapThreadUserDtoToModel(dto);

    expect(model.id).toBe('tu1');
    expect(model.userId).toBe('u1');
    expect(model.displayName).toBe('Alice');
    expect(model.emailAddress).toBe('alice@example.com');
  });

  it('maps null emailAddress to null', () => {
    const dto = makeThreadUser({ emailAddress: null });
    const model = mapThreadUserDtoToModel(dto);

    expect(model.emailAddress).toBeNull();
  });

  it('maps undefined emailAddress to null', () => {
    const dto = makeThreadUser({ emailAddress: undefined });
    const model = mapThreadUserDtoToModel(dto);

    expect(model.emailAddress).toBeNull();
  });
});
