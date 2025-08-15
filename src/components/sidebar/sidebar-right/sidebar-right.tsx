import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

import { MentionInput } from '@/components/mention-input/mention-input';
import { MentionUser } from '@/models/mention-user';
import { Send } from '@mui/icons-material';
import { Button, SvgIcon, Typography } from '@mui/material';
import { MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTaggableWorkspaceUsers, useWorkspaceThreadComments } from '../../../hooks/use-workspace-thread-comments';
import { MessageComment } from '../../../models/message-comment';
import { getInitials } from '../../../utils/initials';
import { parseDateTime } from '../../../utils/parse-date-time';
import { Skeleton } from '../../ui/skeleton';

const MAX_COMMENT_LENGTH = 350;

export function SidebarRight({ threadId }: { threadId: string | undefined }) {
  const { comments, isLoading, addComment, isAddingComment } = useWorkspaceThreadComments(threadId);
  const { users: taggableUsers } = useTaggableWorkspaceUsers();
  const MAX_CHAR_LIMIT = 350;
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [threadComment, setThreadComment] = useState({plain: '', withMentions: ''});
  const [searchTerm, setSearchTerm] = useState('');
  const [mentionList, setMentionList] = useState<MentionUser[]>([]);

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!threadComment.plain.trim()) return;

    if (threadComment.plain.length > MAX_CHAR_LIMIT) {
      toast.error(`Comments are limited to ${MAX_CHAR_LIMIT} characters`);
      return;
    }

    try {
      await addComment(threadComment.plain, mentionList);
      setThreadComment({plain: '', withMentions: ''});
      setSearchTerm('');
      setMentionList([]);
      toast.success('Comment added');
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
    return taggableUsers.filter((user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [taggableUsers, searchTerm]);
  
  return (
    <Sidebar side="right" className="ss-sidebar__right border-l bg-background shadow-md">
      <div className="bg-background flex flex-col h-full">
        <SidebarHeader className="h-[55px] shrink-0 flex justify-between border-b px-3">
          <div className="flex flex-1 items-center gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1 flex items-center gap-2">
                    Comments
                    <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium">
                      {comments.length}
                    </div>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              {isLoading ? (
                <div className="flex flex-col space-y-4 p-4">
                  {Array(3).fill(0).map((_, index) => (
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
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No comments yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-xs">
                    Be the first to add a comment to this thread.
                  </p>
                </div>
              ) : (
                comments.map((comment: MessageComment) => (
                  <div key={comment.id} className="rounded-lg border bg-card p-3 transition-all shadow-md hover:shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getInitials(comment.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{comment.createdBy}</p>
                        <p className="text-xs text-muted-foreground">{parseDateTime(comment.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed flex flex-wrap gap-1">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="border-t p-4 bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.05)] h-55">
          <form onSubmit={handleAddComment}>
            <div>
              <MentionInput
                value={threadComment}
                onChange={setThreadComment}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                users={filteredUsers || []}
                mentionList={mentionList}
                setMentionList={setMentionList}
              />
              <Typography
                color="textSecondary"
                textAlign="right"
                fontSize={12}
                marginTop={1}
              >
                {threadComment.plain.length}/{MAX_COMMENT_LENGTH}
              </Typography>
            </div>
            <Button
              loading={isAddingComment}
              loadingIndicator="Loading…"
              color="primary"
              sx={{ alignSelf: 'end' }}
              disabled={threadComment.plain.trim().length === 0}
              variant="contained"
              type="submit"
              startIcon={
                <SvgIcon fontSize="small">
                  <Send />
                </SvgIcon>
              }
            >
              Post
            </Button>
          </form>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default SidebarRight;