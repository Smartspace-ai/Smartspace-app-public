// src/ui/layout/SidebarUserHeader.tsx
import { useTeams } from '@/app/providers';

import { Logo } from '@/assets/logo';

/**
 * Brand row at the top of the left rail.
 *
 * The account menu used to live here beside the logo; the design moves it into
 * the chat header (see `ui/header/chat-header.tsx`) and gives the wordmark the
 * rail's full width.
 */
export default function SidebarUserHeader() {
  const { isInTeams } = useTeams();

  if (isInTeams) return null;

  return (
    // Plain div rather than `SidebarHeader`: its default `p-2` is emitted by
    // both stylesheets in play and beats the padding passed here.
    <div className="px-5 pt-5 pb-4">
      {/* Scale by width, not height — the wordmark is wider than the 300px rail
          at its natural size, and an over-constrained <svg> crops rather than
          shrinks. `ss-logo` lets the rail's stylesheet knock it back to white.
          `max-w` pins it so it can't balloon inside the wider overlay rail on
          mobile. */}
      <Logo className="ss-logo h-auto max-h-7 w-full max-w-[180px]" />
    </div>
  );
}
