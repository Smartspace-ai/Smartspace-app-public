'use client';

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

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useWorkspaceThreadComments } from '../../../hooks/use-workspace-thread-comments';
import { MessageComment } from '../../../models/message-comment';

export function SidebarRight() {
  const { comments, isLoading, addComment, isAddingComment } =
    useWorkspaceThreadComments();
  const [newComment, setNewComment] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX_CHAR_LIMIT = 350;

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update character count when comment changes
  useEffect(() => {
    setCharCount(newComment.length);
  }, [newComment]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHAR_LIMIT) {
      setNewComment(value);
    } else {
      toast.error(`Comments are limited to ${MAX_CHAR_LIMIT} characters`);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    if (newComment.length > MAX_CHAR_LIMIT) {
      toast.error(`Comments are limited to ${MAX_CHAR_LIMIT} characters`);
      return;
    }

    addComment(newComment);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
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

  return (
    <Sidebar side="right" className="border-l">
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
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Loading comments...
                </p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">No comments yet</p>
              </div>
            ) : (
              comments.map((comment: MessageComment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border p-3 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.createdBy
                          ? comment.createdBy.substring(0, 2).toUpperCase()
                          : 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {comment.createdBy}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.05)] h-55">
        <div className="flex flex-col rounded-lg border bg-background">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="min-h-[60px] max-h-[200px] w-full resize-none rounded-t-lg border-0 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-0"
            rows={1}
          />

          <div className="flex items-center justify-between px-4 py-2 bg-background">
            <div className="flex items-center">
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
            </div>

            <Button
              variant="default"
              size="sm"
              className={`text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 h-7 ${
                !newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={
                !newComment.trim() || newComment.length > MAX_CHAR_LIMIT
              }
            >
              <span>Send</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default SidebarRight;
