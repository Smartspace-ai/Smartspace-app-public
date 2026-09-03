import Skeleton from '@mui/material/Skeleton';
import { MessageSquare, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useUserId } from '@/platform/auth/session';
import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import type { Comment } from '@/domains/comments';
import { useAddComment } from '@/domains/comments/mutations';
import { useComments } from '@/domains/comments/queries';
import { useThreadUsers } from '@/domains/thread-users';
import { fetchTaggableUsers } from '@/domains/workspaces';

import { ScrollArea } from '@/shared/ui/mui-compat/scroll-area';
import { Sidebar, SidebarTrigger } from '@/shared/ui/mui-compat/sidebar';
import { useIsDraftThreadId } from '@/shared/utils/threadId';

import type { MarkdownEditorHandle } from '@smartspace/chat-ui';
import {
  MarkdownEditor,
  parseDateTime,
  useTaggableWorkspaceUsers,
} from '@smartspace/chat-ui';

import { renderContentWithMentions } from './renderContentWithMentions';

const MAX_COMMENT_LENGTH = 350;

function CommentSkeleton({ mine }: { mine?: boolean }) {
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div
        className={`w-[88%] rounded-2xl px-4 py-2.5 ${
          mine ? 'bg-primary/20' : 'border border-border bg-secondary'
        }`}
      >
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-1.5 h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-1 h-3 w-28" />
    </div>
  );
}

export function SidebarRight() {
  const { threadId, workspaceId } = useRouteIds();
  const currentUserId = useUserId();
  // Reactive draft flag — a plain isDraftThreadId() read would never re-render
  // when the thread list's effect unmarks the draft, leaving the comment box
  // stuck disabled on a new thread.
  const isDraft = useIsDraftThreadId(threadId);
  const {
    data: rawComments,
    isLoading,
    isError: commentsError,
  } = useComments(threadId);
  // Empty-content comments are produced server-side as side effects of
  // membership changes; hide them from the comments feed.
  const comments = useMemo(
    () => rawComments?.filter((c) => c.content && c.content.trim() !== ''),
    [rawComments]
  );
  const { mutateAsync: addCommentAsync, isPending: isAddingComment } =
    useAddComment(threadId);
  // Live comment pushes may omit the resolved display name. Fall back to
  // the thread's participant list to resolve it locally — and to the
  // broader workspace user list behind that. Mentioning someone is what
  // adds them to the thread server-side (their membership row is inserted
  // at post time), so at the moment a live push about that mention lands,
  // other viewers' cached thread-participant list doesn't have them yet;
  // the workspace-wide list (already fetched for the mention picker) does.
  const { data: threadUsers, isLoading: isThreadUsersLoading } =
    useThreadUsers(threadId);
  const { data: workspaceUsers, isLoading: isWorkspaceUsersLoading } =
    useTaggableWorkspaceUsers(workspaceId);
  const displayNameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    (workspaceUsers ?? []).forEach((u) => {
      if (u.displayName) map.set(u.userId, u.displayName);
    });
    // Thread participants layered on top: same data for anyone already in
    // both lists, and authoritative for anyone the workspace list omits.
    (threadUsers ?? []).forEach((u) => {
      if (u.displayName) map.set(u.userId, u.displayName);
    });
    return map;
  }, [threadUsers, workspaceUsers]);
  // Wait for both participant lists too, not just the comments — otherwise
  // a comment needing the fallback above can flash with a blank/truncated
  // name for the brief moment before they've loaded.
  const isCommentsReady =
    !isLoading && !isThreadUsersLoading && !isWorkspaceUsersLoading;
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const [threadComment, setThreadComment] = useState({
    plain: '',
    withMentions: '',
  });

  const submitComment = async () => {
    if (isAddingComment || isDraft) return;
    const content = editorRef.current?.getPlainText?.() ?? threadComment.plain;
    const mentionedUsers = editorRef.current?.getMentionedUsers?.() ?? [];
    if (!content.trim()) return;

    if (content.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comments are limited to ${MAX_COMMENT_LENGTH} characters`);
      return;
    }

    try {
      await addCommentAsync({ threadId, content, mentionedUsers });
      setThreadComment({ plain: '', withMentions: '' });
      editorRef.current?.clear?.();
    } catch {
      // Error handled in hook
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitComment();
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter posts. Plain Enter inserts a newline (or selects a
    // mention candidate when the mention popup is open — the editor intercepts
    // that case before this handler runs).
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void submitComment();
    }
  };

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const postDisabled =
    threadComment.plain.trim().length === 0 || isAddingComment || isDraft;

  return (
    // `border-border` rather than a bare `border-l`, which would fall back to
    // Tailwind's default grey and show as a light hairline in dark mode.
    <Sidebar
      side="right"
      className="ss-sidebar__right border-l border-border bg-background"
    >
      {/* `text-foreground`: the Sidebar primitive stamps `text-sidebar-foreground`
          (the always-dark rail's near-white) on both rails; this panel repaints
          itself `bg-background`, so it must reclaim the matching text colour or
          light mode renders white-on-white (the comment box inherits it). */}
      <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pt-5 pb-4">
          <h2 className="truncate text-xl font-bold text-primary">Comments</h2>
          <SidebarTrigger
            side="right"
            icon={<X className="h-4 w-4 text-muted-foreground" />}
            className="h-auto w-auto rounded-full p-1.5 transition-colors hover:bg-secondary"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
          <div className="flex h-full flex-col rounded-2xl border-2 border-primary p-4">
            <h3 className="mb-4 shrink-0 text-sm font-semibold text-foreground">
              Thread comments
            </h3>

            <ScrollArea className="mb-4 min-h-0 flex-1">
              <div className="space-y-3">
                {commentsError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Failed to load comments
                  </div>
                ) : !isCommentsReady ? (
                  <>
                    <CommentSkeleton />
                    <CommentSkeleton mine />
                    <CommentSkeleton />
                  </>
                ) : comments?.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 rounded-full bg-secondary p-3">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No comments yet
                    </p>
                  </div>
                ) : (
                  comments?.map((comment: Comment) => {
                    const isMine = comment.createdByUserId === currentUserId;
                    const senderName =
                      comment.createdBy ||
                      displayNameByUserId.get(comment.createdByUserId) ||
                      '';
                    // Same fallback for mentioned users' names.
                    const resolvedMentionedUsers = comment.mentionedUsers.map(
                      (u) => ({
                        ...u,
                        displayName:
                          u.displayName || displayNameByUserId.get(u.id) || '',
                      })
                    );
                    return (
                      <div
                        key={comment.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[88%] break-words rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? 'rounded-br-md bg-primary text-primary-foreground'
                              : 'rounded-bl-md border border-border bg-secondary text-foreground'
                          }`}
                        >
                          <p
                            className={`truncate text-[13px] font-semibold ${
                              isMine ? '' : 'text-primary'
                            }`}
                            title={senderName}
                          >
                            {senderName}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px]">
                            {renderContentWithMentions(
                              comment.content,
                              resolvedMentionedUsers
                            )}
                          </p>
                        </div>
                        <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                          {parseDateTime(comment.createdAt, 'D MMM, h:mm a')}
                        </p>
                      </div>
                    );
                  })
                )}
                {/* Spacer so scroll-to-bottom keeps padding below the last comment */}
                <div ref={commentsEndRef} className="h-1" />
              </div>
            </ScrollArea>

            <form onSubmit={handleAddComment} className="shrink-0">
              <div className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm transition-colors focus-within:ring-1 focus-within:ring-ring">
                <MarkdownEditor
                  ref={editorRef}
                  value={threadComment.plain}
                  onChange={(md) => {
                    const plain = editorRef.current?.getPlainText?.() ?? md;
                    setThreadComment({ plain, withMentions: md });
                  }}
                  enableMentions
                  fetchMentionUsers={async (wsId) => {
                    const users = await fetchTaggableUsers(wsId);
                    return users.map((u) => ({
                      id: u.id,
                      displayName: u.displayName,
                    }));
                  }}
                  disabled={isAddingComment || isDraft}
                  workspaceId={workspaceId}
                  threadId={threadId}
                  className="md-editor--bare text-sm"
                  minHeight={55}
                  placeholder="Write a comment…"
                  onKeyDown={handleEditorKeyDown}
                />
              </div>
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {threadComment.plain.length}/{MAX_COMMENT_LENGTH}
              </p>

              <button
                type="submit"
                disabled={postDisabled}
                className="chat-send mt-2 flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-40"
              >
                {isAddingComment ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isAddingComment ? 'Posting…' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default SidebarRight;
