import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearPendingThreadUsers,
  getPendingThreadUsers,
  setPendingThreadUsers,
  subscribePendingThreadUsers,
} from '@/domains/thread-users/pendingThreadUsers';

afterEach(() => {
  clearPendingThreadUsers('t1');
  clearPendingThreadUsers('t2');
});

describe('getPendingThreadUsers', () => {
  it('returns empty array for an unknown threadId', () => {
    expect(getPendingThreadUsers('nonexistent')).toEqual([]);
  });

  it('returns stored userIds', () => {
    setPendingThreadUsers('t1', ['u1', 'u2']);
    expect(getPendingThreadUsers('t1')).toEqual(['u1', 'u2']);
  });
});

describe('setPendingThreadUsers', () => {
  it('stores user IDs for a thread', () => {
    setPendingThreadUsers('t1', ['u1', 'u2', 'u3']);
    expect(getPendingThreadUsers('t1')).toHaveLength(3);
  });

  it('deduplicates user IDs via the internal Set', () => {
    setPendingThreadUsers('t1', ['u1', 'u1', 'u2']);
    expect(getPendingThreadUsers('t1')).toHaveLength(2);
  });

  it('deletes the entry when given an empty array', () => {
    setPendingThreadUsers('t1', ['u1']);
    setPendingThreadUsers('t1', []);
    expect(getPendingThreadUsers('t1')).toEqual([]);
  });

  it('does not affect other threads', () => {
    setPendingThreadUsers('t1', ['u1']);
    setPendingThreadUsers('t2', ['u2']);
    expect(getPendingThreadUsers('t1')).toEqual(['u1']);
    expect(getPendingThreadUsers('t2')).toEqual(['u2']);
  });
});

describe('clearPendingThreadUsers', () => {
  it('removes all pending users for a thread', () => {
    setPendingThreadUsers('t1', ['u1', 'u2']);
    clearPendingThreadUsers('t1');
    expect(getPendingThreadUsers('t1')).toEqual([]);
  });

  it('is a no-op for a thread with no pending users', () => {
    expect(() => clearPendingThreadUsers('nonexistent')).not.toThrow();
  });

  it('does not affect other threads', () => {
    setPendingThreadUsers('t1', ['u1']);
    setPendingThreadUsers('t2', ['u2']);
    clearPendingThreadUsers('t1');
    expect(getPendingThreadUsers('t2')).toEqual(['u2']);
  });
});

describe('subscribePendingThreadUsers', () => {
  it('calls the listener when users are set', () => {
    const listener = vi.fn();
    const unsub = subscribePendingThreadUsers(listener);
    setPendingThreadUsers('t1', ['u1']);
    expect(listener).toHaveBeenCalledOnce();
    unsub();
  });

  it('calls the listener when users are cleared (key existed)', () => {
    setPendingThreadUsers('t1', ['u1']);
    const listener = vi.fn();
    const unsub = subscribePendingThreadUsers(listener);
    clearPendingThreadUsers('t1');
    expect(listener).toHaveBeenCalledOnce();
    unsub();
  });

  it('does not call the listener when clearPendingThreadUsers finds nothing', () => {
    const listener = vi.fn();
    const unsub = subscribePendingThreadUsers(listener);
    clearPendingThreadUsers('nonexistent');
    expect(listener).not.toHaveBeenCalled();
    unsub();
  });

  it('does not call the listener after unsubscribing', () => {
    const listener = vi.fn();
    const unsub = subscribePendingThreadUsers(listener);
    unsub();
    setPendingThreadUsers('t1', ['u1']);
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple independent listeners', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribePendingThreadUsers(a);
    const unsubB = subscribePendingThreadUsers(b);
    setPendingThreadUsers('t1', ['u1']);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    unsubA();
    unsubB();
  });
});
