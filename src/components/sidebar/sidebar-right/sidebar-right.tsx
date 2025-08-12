import type React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

import { MentionUser } from '@/models/mention-user';
import { MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTaggableWorkspaceUsers, useWorkspaceThreadComments } from '../../../hooks/use-workspace-thread-comments';
import { MessageComment } from '../../../models/message-comment';
import { getInitials } from '../../../utils/initials';
import { Skeleton } from '../../ui/skeleton';

export function SidebarRight({ threadId }: { threadId: string | undefined }) {
  const { comments, isLoading, addComment } = useWorkspaceThreadComments(threadId);
  const { users: taggableUsers } = useTaggableWorkspaceUsers();

  const [newComment, setNewComment] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX_CHAR_LIMIT = 350;

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<MentionUser[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);

  useEffect(() => {
    setCharCount(newComment.length);
  }, [newComment]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    const match = value.match(/@([\w\s]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const filtered = taggableUsers.filter((user: MentionUser) =>
        user.displayName && user.displayName.toLowerCase().includes(query)
      );
      setMentionQuery(query);
      setFilteredUsers(filtered);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (user: MentionUser) => {
    const before = newComment.slice(0, newComment.lastIndexOf('@'));
    const after = newComment.slice(newComment.length);
    const updated = `${before}@${user.displayName} ${after}`;
    setNewComment(updated);
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const getMentionedUsers = (content: string): MentionUser[] => {
    const seen = new Set<string>();
    return taggableUsers.filter((user) => {
      const mention = `@${user.displayName}`;
      const found = content.includes(mention);
      if (found && !seen.has(user.id)) {
        seen.add(user.id);
        return true;
      }
      return false;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedUser = filteredUsers[mentionIndex];
        insertMention(selectedUser);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (newComment.length > MAX_CHAR_LIMIT) {
      toast.error(`Comments are limited to ${MAX_CHAR_LIMIT} characters`);
      return;
    }

    try {
      const mentioned = getMentionedUsers(newComment);
      await addComment(newComment, mentioned);
      setNewComment('');
      toast.success('Comment added');
    } catch {
      // Error handled in hook
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  
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
                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
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
          <div className="flex flex-col rounded-lg border bg-background relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className="min-h-[60px] max-h-[200px] w-full resize-none rounded-t-lg border-0 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-0"
              rows={1}
            />
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute z-50 mt-1 left-4 bottom-16 w-[250px] max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={`px-3 py-2 text-sm cursor-pointer rounded-md ${
                      index === mentionIndex
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(user);
                    }}
                  >
                    {user.displayName}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-2 bg-background">
              <span
                className={`text-xs ${
                  charCount > MAX_CHAR_LIMIT * 0.8
                    ? charCount > MAX_CHAR_LIMIT
                      ? 'text-red-500'
                      : 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {charCount}/{MAX_CHAR_LIMIT}
              </span>
              <Button
                onClick={handleAddComment}
                variant="default"
                size="sm"
                className={`text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 h-7 ${
                  !newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!newComment.trim() || newComment.length > MAX_CHAR_LIMIT}
              >
                Send
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default SidebarRight;