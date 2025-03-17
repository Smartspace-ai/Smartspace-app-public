'use client';

import type React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Sample comments data
const sampleComments = [
  {
    id: 1,
    user: {
      name: 'John Doe',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'JD',
    },
    content:
      'This project is coming along nicely. I think we should be able to meet the deadline.',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    user: {
      name: 'Jane Smith',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'JS',
    },
    content:
      "I've added some new design assets to the shared folder. Please take a look when you get a chance.",
    timestamp: 'Yesterday',
  },
  {
    id: 3,
    user: {
      name: 'Alex Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'AJ',
    },
    content: 'Can we schedule a quick call to discuss the upcoming milestones?',
    timestamp: '3 days ago',
  },
  {
    id: 4,
    user: {
      name: 'Maria Garcia',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'MG',
    },
    content:
      "The new API documentation looks great! I've shared it with the frontend team.",
    timestamp: '1 week ago',
  },
  {
    id: 5,
    user: {
      name: 'Robert Chen',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'RC',
    },
    content:
      "I'm having trouble with the authentication flow. Could someone help me debug this issue?",
    timestamp: '1 week ago',
  },
  {
    id: 6,
    user: {
      name: 'Sarah Williams',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'SW',
    },
    content:
      'Just pushed a fix for the navigation bug. Please test it on your end.',
    timestamp: '2 weeks ago',
  },
  {
    id: 7,
    user: {
      name: 'David Kim',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'DK',
    },
    content:
      "The client loved our presentation! They're excited to move forward with the project.",
    timestamp: '2 weeks ago',
  },
  {
    id: 8,
    user: {
      name: 'Emily Johnson',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'EJ',
    },
    content:
      "I've updated the project timeline to reflect the new requirements.",
    timestamp: '3 weeks ago',
  },
];

// Generate more comments for testing
const generateMoreComments = (count: number) => {
  const additionalComments = [];
  for (let i = 0; i < count; i++) {
    const baseComment = sampleComments[i % sampleComments.length];
    additionalComments.push({
      ...baseComment,
      id: sampleComments.length + i + 1,
      content: `${baseComment.content} (${i + 1})`,
      timestamp: `${i + 1} ${i < 1 ? 'hour' : 'hours'} ago`,
    });
  }
  return additionalComments;
};

const allComments = [...sampleComments, ...generateMoreComments(20)];

function SidebarRight() {
  const [comments, setComments] = useState(allComments);
  const [newComment, setNewComment] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX_CHAR_LIMIT = 350;

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update character count when comment changes
  useEffect(() => {
    setCharCount(newComment.length);
  }, [newComment]);

  // Focus input when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    if (newComment.length > MAX_CHAR_LIMIT) {
      toast.error(`Comments are limited to ${MAX_CHAR_LIMIT} characters`);
      return;
    }

    const newCommentObj = {
      id: comments.length + 1,
      user: {
        name: 'You',
        avatar: '/placeholder.svg?height=40&width=40',
        initials: 'YO',
      },
      content: newComment,
      timestamp: 'Just now',
    };

    setComments([newCommentObj, ...comments]);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <Sidebar side="right" className="border-l">
      <SidebarHeader className="h-14 shrink-0 flex justify-between border-b px-3">
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
        <div className="space-y-3 p-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border p-3 transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.user.avatar}
                    alt={comment.user.name}
                  />
                  <AvatarFallback>{comment.user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {comment.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {comment.timestamp}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{comment.content}</p>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col rounded-lg border bg-background">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className="min-h-[60px] max-h-[200px] w-full resize-none rounded-t-lg border-0 bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-0"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2">
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
              onClick={handleSubmitComment}
              size="sm"
              className={`gap-2 ${
                !newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={
                !newComment.trim() || newComment.length > MAX_CHAR_LIMIT
              }
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default SidebarRight;
