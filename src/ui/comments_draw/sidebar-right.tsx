import { Send } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { ArrowBigUp, MessageSquare } from 'lucide-react';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { Comment } from '@/domains/comments';
import { useAddComment } from '@/domains/comments/mutations';
import { useComments } from '@/domains/comments/queries';
import type { MentionUser } from '@/domains/workspaces';
import { useTaggableWorkspaceUsers } from '@/domains/workspaces/queries';

import { MentionInput } from '@/ui/comments_draw/mention-input';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Avatar, AvatarFallback } from '@/shared/ui/mui-compat/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/shared/ui/mui-compat/breadcrumb';
import { Button as UIButton } from '@/shared/ui/mui-compat/button';
import { ScrollArea } from '@/shared/ui/mui-compat/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/shared/ui/mui-compat/sidebar';

 




import { Skeleton } from '../../shared/ui/shadcn/skeleton';
import { getInitials } from '../../shared/utils/initials';
import { parseDateTime } from '../../shared/utils/parseDateTime';


const MAX_COMMENT_LENGTH = 350;

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderContentWithMentions(text: string, users?: Array<{ displayName?: string | null }>) {
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
        <span key={key++} className="text-primary">
          {match[0]}
        </span>,
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

  // Fallback: highlight @ followed by one or more words (supports First or First Last)
  const fallback = /@[A-Za-z0-9._-]+(?:\s+[A-Za-z0-9._-]+)*/g;
  return renderWithPattern(fallback);
}

export function SidebarRight() {
  const { workspaceId, threadId } = useRouteIds();
  const { data: comments, isLoading, isError: commentsError } = useComments(threadId);
  const { mutate: addComment, isPending: isAddingComment } = useAddComment(threadId);
  const { data: taggableUsers, isLoading: usersLoading, isError: usersError } = useTaggableWorkspaceUsers(workspaceId);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [threadComment, setThreadComment] = useState({ plain: '', withMentions: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [mentionList, setMentionList] = useState<MentionUser[]>([]);
  const isMobile = useIsMobile();

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!threadComment.plain.trim()) return;

    if (threadComment.plain.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comments are limited to ${MAX_COMMENT_LENGTH} characters`);
      return;
    }

    try {
      await addComment({ threadId, content: threadComment.plain, mentionedUsers: mentionList });
      setThreadComment({ plain: '', withMentions: '' });
      setSearchTerm('');
      setMentionList([]);
    } catch {
      // Error handled in hook
    }
  };

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const filteredUsers = useMemo(() => {
    return taggableUsers?.filter((user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [taggableUsers, searchTerm]);

  return (
    <Sidebar
      side="right"
      className="ss-sidebar__right border-l bg-background shadow-md"
      style={{ '--sidebar-width-mobile': '60vw' } as CSSProperties}
    >
      <div className="bg-background flex flex-col h-full min-h-0">
        <SidebarHeader className="h-[55px] shrink-0 flex justify-between border-b px-3">
          <div className="flex flex-1 items-center gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1 flex items-center gap-2">
                    Comments
                    <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium">
                      {comments?.length ?? 0}
                    </div>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 p-4">
              {commentsError ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
                    Failed to load comments
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col space-y-4 p-4">
                  {Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="rounded-lg border p-3 animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                      </div>
                    ))}
                </div>
              ) : comments?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Add comments here</h3>
                </div>
              ) : (
                comments?.map((comment: Comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border bg-card p-3 transition-all shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(comment.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{comment.createdBy}</p>
                        <p className="text-xs text-muted-foreground">
                          {parseDateTime(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed flex flex-wrap gap-1">
                      {renderContentWithMentions(comment.content, comment.mentionedUsers)}
                    </p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </ScrollArea>
        </SidebarContent>

        {/* Allow the pinned dropdown to overflow past the footer if needed */}
        <SidebarFooter className="border-t p-4 bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.05)] shrink-0 overflow-visible">
          <form onSubmit={handleAddComment}>
            {isMobile ? (
              // Allow the local wrapper to show the absolute dropdown
              <div className="relative overflow-visible">
                <MentionInput
                  value={threadComment}
                  onChange={setThreadComment}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  users={filteredUsers || []}
                  usersLoading={usersLoading}
                  usersError={usersError}
                  mentionList={mentionList}
                  setMentionList={setMentionList}
                  minRows={3}
                  maxRows={6}
                  showFullscreenToggle={false}
                  placeholder="Type a comment..."
                  inputSx={{
                    '& .MuiInputBase-root': {
                      pr: 10,
                    },
                    '& textarea': {
                      lineHeight: 1.4,
                      maxHeight: 144,
                      overflowY: 'auto',
                    },
                  }}
                />

                <div className="absolute bottom-1 right-11 text-xs text-muted-foreground select-none bg-background/80 px-1 rounded">
                  {threadComment.plain.length}/{MAX_COMMENT_LENGTH}
                </div>

                {/* Primary colored circular submit button */}
                <UIButton
                  type="submit"
                  variant="default"
                  size="icon"
                  className={`h-9 w-9 rounded-full absolute bottom-1.5 right-1.5 
                    bg-primary hover:bg-primary/90 text-primary-foreground 
                    ${threadComment.plain.trim().length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={threadComment.plain.trim().length === 0 || isAddingComment}
                  aria-label="Post comment"
                >
                  <ArrowBigUp className="h-5 w-5" strokeWidth={2.5} />
                </UIButton>
              </div>
            ) : (
              <>
                <div className="relative overflow-visible">
                  <MentionInput
                    value={threadComment}
                    onChange={setThreadComment}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    users={filteredUsers || []}
                    usersLoading={usersLoading}
                    usersError={usersError}
                    mentionList={mentionList}
                    setMentionList={setMentionList}
                    minRows={5}
                    showFullscreenToggle={false}
                    placeholder="Type a comment..."
                  />
                  <Typography color="textSecondary" textAlign="right" fontSize={12} marginTop={1}>
                    {threadComment.plain.length}/{MAX_COMMENT_LENGTH}
                  </Typography>
                </div>

                {/* Proper loading button for MUI */}
                <UIButton
                  type="submit"
                  variant="default"
                  className="self-end"
                  disabled={threadComment.plain.trim().length === 0 || isAddingComment}
                >
                  {isAddingComment ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Posting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Post
                    </div>
                  )}
                </UIButton>
              </>
            )}
          </form>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default SidebarRight;
