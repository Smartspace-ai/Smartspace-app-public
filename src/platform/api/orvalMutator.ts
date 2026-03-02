import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { api } from './apiClient';

export const apiMutator = <T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  // Axios only auto-stringifies objects for application/json. Orval generates
  // application/*+json for some endpoints, so primitive body values (boolean,
  // number) slip through un-serialised. Stringify them explicitly.
  if (
    config.data !== undefined &&
    config.data !== null &&
    typeof config.data !== 'object' &&
    typeof config.data !== 'string'
  ) {
    return api.request<T>({ ...config, data: JSON.stringify(config.data) });
  }
  return api.request<T>(config);
};
