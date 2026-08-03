import Skeleton from '@mui/material/Skeleton';
import { MessageSquare, Send, X } from 'lucide-react';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import type { Comment } from '@/domains/comments';
import { useAddComment } from '@/domains/comments/mutations';
import { useComments } from '@/domains/comments/queries';
import { fetchTaggableUsers } from '@/domains/workspaces';

import { ScrollArea } from '@/shared/ui/mui-compat/scroll-area';
import { Sidebar, SidebarTrigger } from '@/shared/ui/mui-compat/sidebar';
import { isDraftThreadId } from '@/shared/utils/threadId';

import type { MarkdownEditorHandle } from '@smartspace/chat-ui';
import { MarkdownEditor, parseDateTime } from '@smartspace/chat-ui';

const MAX_COMMENT_LENGTH = 350;

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderContentWithMentions(
  text: string,
  users?: Array<{ displayName?: string | null }>
) {
  const renderWithPattern = (pattern: RegExp) => {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIndex) {
        nodes.push(<span key={key++}>{text.slice(lastIndex, start)}</span>);
      }
      nodes.push(
        <span key={key++} className="font-medium text-primary">
          {match[0]}
        </span>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) {
      nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }
    return nodes;
  };

  const names = (users || [])
    .map((u) => u.displayName)
    .filter((n): n is string => Boolean(n))
    .sort((a, b) => b.length - a.length);

  if (names.length > 0) {
    const union = names.map((n) => `@${escapeRegExp(n)}`).join('|');
    const pattern = new RegExp(`(?:${union})`, 'g');
    return renderWithPattern(pattern);
  }

  // Fallback: highlight @ followed by one or two words (supports First or First Last)
  const fallback = /@[A-Za-z0-9._-]+(?:\s+[A-Za-z0-9._-]+)?/g;
  return renderWithPattern(fallback);
}

function CommentSkeleton() {
  return (
    <div className="flex flex-col items-start">
      <div className="w-[88%] rounded-2xl rounded-bl-md border border-border bg-secondary px-4 py-2.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-1.5 h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-1 h-3 w-32" />
    </div>
  );
}

export function SidebarRight() {
  const { threadId, workspaceId } = useRouteIds();
  const isDraft = isDraftThreadId(threadId);
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
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const [threadComment, setThreadComment] = useState({
    plain: '',
    withMentions: '',
  });

  const submitComment = async () => {
    if (isAddingComment) return;
    if (isDraft) return;
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
    // mention candidate when the mention popup is open — the editor
    // intercepts that case before this handler runs).
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void submitComment();
    }
  };

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const postDisabled =
    threadComment.plain.trim().length === 0 || isAddingComment || isDraft;

  return (
    <Sidebar
      side="right"
      className="ss-sidebar__right border-l bg-background"
      style={{ '--sidebar-width-mobile': '60vw' } as CSSProperties}
    >
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-xl font-bold text-primary">Comments</h2>
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
                ) : isLoading ? (
                  <>
                    <CommentSkeleton />
                    <CommentSkeleton />
                    <CommentSkeleton />
                  </>
                ) : comments?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 rounded-full bg-secondary p-3">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Add comments here
                    </p>
                  </div>
                ) : (
                  comments?.map((comment: Comment) => (
                    <div key={comment.id} className="flex flex-col items-start">
                      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-border bg-secondary px-4 py-2.5 text-foreground">
                        <p className="text-[13px] font-semibold text-primary">
                          {comment.createdBy}
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-1 text-[13px]">
                          {renderContentWithMentions(
                            comment.content,
                            comment.mentionedUsers
                          )}
                        </p>
                      </div>
                      <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                        {parseDateTime(
                          comment.createdAt,
                          'Do MMMM YYYY, hh:mm:ss a'
                        )}
                      </p>
                    </div>
                  ))
                )}
                {/* Spacer so scroll-to-bottom keeps some padding below the last comment */}
                <div ref={commentsEndRef} className="h-1" />
              </div>
            </ScrollArea>

            <form onSubmit={handleAddComment} className="shrink-0">
              <div className="relative">
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
                    placeholder="Write a comment… (type @ to mention)"
                    onKeyDown={handleEditorKeyDown}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] text-muted-foreground">
                  {threadComment.plain.length}/{MAX_COMMENT_LENGTH}
                </p>
              </div>

              <button
                type="submit"
                disabled={postDisabled}
                className="mt-2 flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
              >
                {isAddingComment ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isAddingComment ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default SidebarRight;
