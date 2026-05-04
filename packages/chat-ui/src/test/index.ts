// Test-only helpers for `@smartspace/chat-ui` consumers.
//
// Imported as: import { buildChatHarness } from '@smartspace/chat-ui/test'
//
// Kept on a separate subpath so production runtime code can't accidentally
// pull in fakes / harnesses. Tree-shaking would drop them anyway, but the
// subpath makes intent explicit.

export {};
