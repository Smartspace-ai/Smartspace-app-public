import { describe, expect, it } from 'vitest';

import { Route } from '../login';

const validateSearch = Route.options.validateSearch as (
  search: Record<string, unknown>
) => { redirect?: string };

describe('login route search', () => {
  it('keeps a string redirect', () => {
    expect(validateSearch({ redirect: '/workspace/ws-1' })).toEqual({
      redirect: '/workspace/ws-1',
    });
  });

  it('leaves redirect out when the URL has none', () => {
    expect(validateSearch({})).toEqual({});
  });

  it('drops a non-string redirect', () => {
    // The router parses `?redirect=123` to a number. Breaks if a bad value
    // throws: the user gets the error page instead of the sign-in screen.
    // The key must stay present: the router lays this result over the raw
    // search, so a missing key would let the raw value through.
    expect(validateSearch({ redirect: 123 })).toHaveProperty(
      'redirect',
      undefined
    );
  });
});
