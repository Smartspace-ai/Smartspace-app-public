// Re-export the SDK's shared axios instance so that raw `api.get/post/…` calls
// (via src/platform/request.ts) go through the same configured instance as
// ChatApi methods. The interceptors (auth, primitive-body serialisation) are
// attached once by configureApiClient() in src/main.tsx.
import { AXIOS_INSTANCE } from '@smartspace/api-client';

export { AXIOS_INSTANCE as api };
