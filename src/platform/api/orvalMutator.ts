import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { api } from './apiClient';

export const apiMutator = <T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => api.request<T>(config);
