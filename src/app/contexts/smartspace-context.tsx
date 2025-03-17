import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// Define the Thread type
export type Thread = {
  id: number;
  title: string;
  avatar: string;
  replies: number;
  lastActivity: string;
  isFavorite: boolean;
};

// Define the Message type
export type Message = {
  id: number;
  sender: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
};

// Define the Comment type
export type Comment = {
  id: number;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  content: string;
  timestamp: string;
};

// Define the context type
type SmartSpaceContextType = {
  activeThread: Thread | null;
  setActiveThread: (thread: Thread) => void;
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  addMessage: (content: string) => void;
  addComment: (content: string) => void;
};

// Create the context with a proper default value
const SmartSpaceContext = createContext<SmartSpaceContextType | null>(null);

// Sample data
const initialThreads: Thread[] = [
  {
    id: 1,
    title: 'Design System Updates for Q3',
    avatar: '/placeholder.svg?height=32&width=32',
    replies: 12,
    lastActivity: '2 hours ago',
    isFavorite: true,
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    sender: {
      name: 'John Doe',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content: "Hey team, I've just pushed the latest updates to the repository.",
    timestamp: '10:32 AM',
    isCurrentUser: false,
  },
];

const initialComments: Comment[] = [
  {
    id: 1,
    user: {
      name: 'John Doe',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'JD',
    },
    content: 'This project is coming along nicely.',
    timestamp: '2 hours ago',
  },
];

// Provider component
export const SmartSpaceContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeThread, setActiveThread] = useState<Thread | null>(
    initialThreads[0]
  );
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  // Function to add a new message (memoized)
  const addMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      const newMessage: Message = {
        id: messages.length + 1,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isCurrentUser: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Update thread replies count
      if (activeThread) {
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === activeThread.id
              ? {
                  ...thread,
                  replies: thread.replies + 1,
                  lastActivity: 'Just now',
                }
              : thread
          )
        );
      }
    },
    [activeThread, messages.length]
  );

  // Function to add a new comment (memoized)
  const addComment = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      const newComment: Comment = {
        id: comments.length + 1,
        user: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'YO',
        },
        content,
        timestamp: 'Just now',
      };

      setComments((prev) => [newComment, ...prev]);
    },
    [comments.length]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      activeThread,
      setActiveThread,
      threads,
      setThreads,
      messages,
      setMessages,
      comments,
      setComments,
      addMessage,
      addComment,
    }),
    [activeThread, threads, messages, comments, addMessage, addComment]
  );

  return (
    <SmartSpaceContext.Provider value={contextValue}>
      {children}
    </SmartSpaceContext.Provider>
  );
};

// Custom hook to use the context
export const useSmartSpaceChat = (): SmartSpaceContextType => {
  const context = useContext(SmartSpaceContext);
  if (!context) {
    throw new Error(
      'useSmartSpaceChat must be used within a SmartSpaceContextProvider'
    );
  }
  return context;
};
