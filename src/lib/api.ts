// Types
export type Workspace = {
  id: number;
  name: string;
  color: string;
};

export type Thread = {
  id: number;
  workspaceId: number;
  title: string;
  avatar: string;
  replies: number;
  lastActivity: string;
  isFavorite: boolean;
};

export type Message = {
  id: number;
  threadId: number;
  sender: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
};

export type Comment = {
  id: number;
  threadId: number; // Added threadId to associate comments with threads
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  content: string;
  timestamp: string;
};

// API functions
// Fix the fetchWorkspaces function to ensure it always returns data
export async function fetchWorkspaces(): Promise<Workspace[]> {
  try {
    // Skip trying to fetch the JSON file and use hardcoded workspaces
    console.log('Using hardcoded workspaces');
    return [
      { id: 1, name: 'Product Development', color: 'bg-[#7C3AED]' },
      { id: 2, name: 'Engineering Team', color: 'bg-blue-500' },
      { id: 3, name: 'Design Studio', color: 'bg-green-500' },
      { id: 4, name: 'Marketing & Growth', color: 'bg-yellow-500' },
    ];

    /* Commenting out the problematic fetch
      // In a real app, this would be an API call
      const response = await fetch("/data/workspaces.json")
  
      if (!response.ok) {
        console.error("Failed to fetch workspaces from JSON, using fallback data")
        // Return fallback data if the fetch fails
        return [
          { id: 1, name: "Product Development", color: "bg-[#7C3AED]" },
          { id: 2, name: "Engineering Team", color: "bg-blue-500" },
          { id: 3, name: "Design Studio", color: "bg-green-500" },
          { id: 4, name: "Marketing & Growth", color: "bg-yellow-500" },
        ]
      }
  
      return response.json()
      */
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    // Return fallback data if there's an error
    return [
      { id: 1, name: 'Product Development', color: 'bg-[#7C3AED]' },
      { id: 2, name: 'Engineering Team', color: 'bg-blue-500' },
      { id: 3, name: 'Design Studio', color: 'bg-green-500' },
      { id: 4, name: 'Marketing & Growth', color: 'bg-yellow-500' },
    ];
  }
}

// Fix the fetchThreads function to ensure it always returns data
export async function fetchThreads(workspaceId?: number): Promise<Thread[]> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Skip trying to fetch the JSON file and use generated threads
    console.log(`Generating threads for workspace ID: ${workspaceId}`);
    const fallbackThreads = generateFallbackThreads();
    return workspaceId
      ? fallbackThreads.filter((thread) => thread.workspaceId === workspaceId)
      : fallbackThreads;

    /* Commenting out the problematic fetch
      // Try to fetch from JSON file
      const response = await fetch("/data/threads.json")
  
      if (!response.ok) {
        console.error("Failed to fetch threads from JSON, using fallback data")
        // Return fallback data for the specified workspace
        const fallbackThreads = generateFallbackThreads()
        return workspaceId ? fallbackThreads.filter((thread) => thread.workspaceId === workspaceId) : fallbackThreads
      }
  
      const threads: Thread[] = await response.json()
  
      // Filter threads by workspaceId if provided
      if (workspaceId) {
        return threads.filter((thread) => thread.workspaceId === workspaceId)
      }
  
      return threads
      */
  } catch (error) {
    console.error('Error fetching threads:', error);
    // Return fallback data if there's an error
    const fallbackThreads = generateFallbackThreads();
    return workspaceId
      ? fallbackThreads.filter((thread) => thread.workspaceId === workspaceId)
      : fallbackThreads;
  }
}

// Helper function to generate fallback threads
function generateFallbackThreads(): Thread[] {
  return [
    {
      id: 1,
      workspaceId: 1,
      title: 'Q3 Product Roadmap Planning',
      avatar: '/placeholder.svg?height=32&width=32',
      replies: 12,
      lastActivity: '2 hours ago',
      isFavorite: true,
    },
    {
      id: 2,
      workspaceId: 1,
      title: 'User Testing Results for Dashboard Redesign',
      avatar: '/placeholder.svg?height=32&width=32',
      replies: 8,
      lastActivity: 'Yesterday',
      isFavorite: false,
    },
    {
      id: 3,
      workspaceId: 1,
      title: 'Mobile App Performance Optimization',
      avatar: '/placeholder.svg?height=32&width=32',
      replies: 5,
      lastActivity: '3 days ago',
      isFavorite: false,
    },
    {
      id: 4,
      workspaceId: 2,
      title: 'Team Alpha Sprint Planning for July',
      avatar: '/placeholder.svg?height=32&width=32',
      replies: 24,
      lastActivity: '1 week ago',
      isFavorite: true,
    },
    {
      id: 5,
      workspaceId: 2,
      title: 'Third-Party API Integration Strategy',
      avatar: '/placeholder.svg?height=32&width=32',
      replies: 3,
      lastActivity: '2 weeks ago',
      isFavorite: false,
    },
  ];
}

// Update the fetchMessages function to ensure it returns messages for any thread ID
export async function fetchMessages(threadId: number): Promise<Message[]> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Since we're having issues with the JSON file, let's skip trying to fetch it
    // and directly use our generated messages
    console.log(`Generating messages for thread ID: ${threadId}`);
    return generateMessagesForThread(threadId);

    /* Commenting out the problematic fetch
      // Try to fetch from JSON file
      const response = await fetch("/data/messages.json")
  
      if (!response.ok) {
        console.error("Failed to fetch messages from JSON, using fallback data")
        return generateMessagesForThread(threadId)
      }
  
      const allMessages: Message[] = await response.json()
      
      // Filter messages by threadId
      const threadMessages = allMessages.filter(message => message.threadId === threadId)
      
      // If we have messages for this thread, return them
      if (threadMessages.length > 0) {
        return threadMessages
      }
      
      // Otherwise, generate fallback messages
      return generateMessagesForThread(threadId)
      */
  } catch (error) {
    console.error('Error fetching messages:', error);
    return generateMessagesForThread(threadId);
  }
}

// Helper function to generate realistic messages for a thread
function generateMessagesForThread(threadId: number): Message[] {
  // Create realistic messages for any thread ID
  const threadMessages: Record<number, Message[]> = {
    1: [
      {
        id: 101,
        threadId: 1,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "I've analyzed the Q3 roadmap data and identified 3 key priorities we should focus on. Would you like me to elaborate on each one?",
        timestamp: '10:32 AM',
        isCurrentUser: false,
      },
      {
        id: 102,
        threadId: 1,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'Yes, please break down the priorities and include any dependencies we should be aware of.',
        timestamp: '10:35 AM',
        isCurrentUser: true,
      },
      {
        id: 103,
        threadId: 1,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'Here are the key priorities:\n\n1. **User Authentication Overhaul** - This needs to be completed before the mobile app update.\n\n2. **Analytics Dashboard Redesign** - Marketing team needs this by August 15th.\n\n3. **API Performance Optimization** - Critical for the Q3 scaling goals.\n\nShall I create subtasks for each of these in the project management system?',
        timestamp: '10:38 AM',
        isCurrentUser: false,
      },
      {
        id: 104,
        threadId: 1,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'That would be great. Also, can you estimate the developer hours needed for each priority?',
        timestamp: '10:42 AM',
        isCurrentUser: true,
      },
    ],
    2: [
      {
        id: 201,
        threadId: 2,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "I've analyzed the user testing data for the dashboard redesign. The main pain points are navigation complexity and data visualization clarity.",
        timestamp: '2:15 PM',
        isCurrentUser: false,
      },
      {
        id: 202,
        threadId: 2,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "That's interesting. Can you provide more details about the navigation issues specifically?",
        timestamp: '2:20 PM',
        isCurrentUser: true,
      },
      {
        id: 203,
        threadId: 2,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "Users reported difficulty finding key features, particularly the reporting section. 78% of test participants took more than 30 seconds to locate the custom report builder. The sidebar categorization was described as 'confusing' by 65% of users.",
        timestamp: '2:23 PM',
        isCurrentUser: false,
      },
    ],
    3: [
      {
        id: 301,
        threadId: 3,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "I've analyzed the mobile app performance metrics. The main bottleneck appears to be in the image loading process. We could implement lazy loading and image optimization to improve performance by approximately 35%.",
        timestamp: '9:10 AM',
        isCurrentUser: false,
      },
      {
        id: 302,
        threadId: 3,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "That's a significant improvement. What would be the implementation timeline for these optimizations?",
        timestamp: '9:15 AM',
        isCurrentUser: true,
      },
      {
        id: 303,
        threadId: 3,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'Based on the codebase complexity and team availability, I estimate:\n\n1. Lazy loading implementation: 3-4 developer days\n2. Image optimization pipeline: 2-3 developer days\n3. Testing and QA: 2 developer days\n\nTotal timeline: 7-9 business days for full implementation. Would you like me to prepare a more detailed implementation plan with specific tasks?',
        timestamp: '9:22 AM',
        isCurrentUser: false,
      },
    ],
    4: [
      {
        id: 401,
        threadId: 4,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "Let's plan our sprint for the next two weeks. What are the highest priority items we should focus on?",
        timestamp: '11:05 AM',
        isCurrentUser: true,
      },
      {
        id: 402,
        threadId: 4,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'Based on the backlog analysis and stakeholder input, I recommend focusing on these priorities:\n\n1. Authentication service refactoring (critical security updates)\n2. Dashboard performance optimization (addressing customer complaints)\n3. New API endpoints for the mobile app integration\n\nThe first two items are blocking other teams, so they should be addressed first.',
        timestamp: '11:08 AM',
        isCurrentUser: false,
      },
      {
        id: 403,
        threadId: 4,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'Makes sense. Do we have enough capacity in the team to handle all three priorities in this sprint?',
        timestamp: '11:12 AM',
        isCurrentUser: true,
      },
      {
        id: 404,
        threadId: 4,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "Based on the team's velocity from previous sprints and current availability, we can complete the first two priorities with high confidence. The API endpoints work might need to be partially moved to the next sprint. I recommend we start with the first two and pull in the API work if we make good progress.",
        timestamp: '11:15 AM',
        isCurrentUser: false,
      },
    ],
    5: [
      {
        id: 501,
        threadId: 5,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          "I've reviewed our third-party API integration strategy and identified several potential improvements. The current approach has some scalability concerns that could impact performance as we grow.",
        timestamp: '3:45 PM',
        isCurrentUser: false,
      },
      {
        id: 502,
        threadId: 5,
        sender: {
          name: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'What specific scalability issues are you seeing? And what improvements would you recommend?',
        timestamp: '3:50 PM',
        isCurrentUser: true,
      },
      {
        id: 503,
        threadId: 5,
        sender: {
          name: 'SmartSpace',
          avatar: '/placeholder.svg?height=40&width=40',
        },
        content:
          'The main issues are:\n\n1. Direct API calls without proper caching\n2. No rate limiting protection\n3. Synchronous processing of large data sets\n\nI recommend implementing:\n\n1. A Redis cache layer with appropriate TTLs\n2. A token bucket rate limiter\n3. Asynchronous processing with a message queue for large operations\n\nThese changes would significantly improve resilience and performance.',
        timestamp: '3:55 PM',
        isCurrentUser: false,
      },
    ],
  };

  // Return thread-specific messages if available, otherwise generate generic ones
  if (threadMessages[threadId]) {
    return threadMessages[threadId];
  }

  // Generic messages for threads without specific content
  return [
    {
      id: threadId * 100 + 1,
      threadId: threadId,
      sender: {
        name: 'SmartSpace',
        avatar: '/placeholder.svg?height=40&width=40',
      },
      content: `I've analyzed the latest data for this thread. There are several key insights we should discuss.`,
      timestamp: '10:32 AM',
      isCurrentUser: false,
    },
    {
      id: threadId * 100 + 2,
      threadId: threadId,
      sender: {
        name: 'You',
        avatar: '/placeholder.svg?height=40&width=40',
      },
      content: `Great, what are the most important findings we should focus on?`,
      timestamp: '10:35 AM',
      isCurrentUser: true,
    },
    {
      id: threadId * 100 + 3,
      threadId: threadId,
      sender: {
        name: 'SmartSpace',
        avatar: '/placeholder.svg?height=40&width=40',
      },
      content: `Based on my analysis, there are three main areas to address:\n\n1. Performance optimization opportunities\n2. User experience improvements\n3. Integration challenges with existing systems\n\nWhich area would you like to explore first?`,
      timestamp: '10:38 AM',
      isCurrentUser: false,
    },
  ];
}

// Add a function to generate fake comments for any thread
export async function fetchComments(threadId?: number): Promise<Comment[]> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!threadId) {
      return [];
    }

    // Skip trying to fetch the JSON file and use generated comments
    console.log(`Generating comments for thread ID: ${threadId}`);
    return generateCommentsForThread(threadId);

    /* Commenting out the problematic fetch
      // Try to fetch from JSON file
      const response = await fetch("/data/comments.json")
  
      if (!response.ok) {
        console.error("Failed to fetch comments from JSON, using fallback data")
        return generateCommentsForThread(threadId)
      }
  
      const allComments: Comment[] = await response.json()
      
      // Filter comments by threadId
      const threadComments = allComments.filter(comment => comment.threadId === threadId)
      
      // If we have comments for this thread, return them
      if (threadComments.length > 0) {
        return threadComments
      }
      
      // Otherwise, generate fallback comments
      return generateCommentsForThread(threadId)
      */
  } catch (error) {
    console.error('Error fetching comments:', error);
    return generateCommentsForThread(threadId || 0);
  }
}

// Helper function to generate realistic comments for a thread
function generateCommentsForThread(threadId: number): Comment[] {
  // Thread-specific comments
  const threadComments: Record<number, Comment[]> = {
    1: [
      {
        id: 101,
        threadId: 1,
        user: {
          name: 'Emily Chen',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'EC',
        },
        content:
          "The authentication overhaul should definitely be our top priority. We've been seeing increased security concerns from enterprise clients.",
        timestamp: '2 hours ago',
      },
      {
        id: 102,
        threadId: 1,
        user: {
          name: 'Marcus Johnson',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'MJ',
        },
        content:
          "I've started drafting the technical specs for the API optimization. Will share with the team by EOD.",
        timestamp: 'Yesterday',
      },
      {
        id: 103,
        threadId: 1,
        user: {
          name: 'Sophia Rodriguez',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'SR',
        },
        content:
          'Marketing is really pushing for that analytics dashboard. Can we prioritize at least the MVP version for early August?',
        timestamp: '3 days ago',
      },
    ],
    2: [
      {
        id: 201,
        threadId: 2,
        user: {
          name: 'Alex Kim',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'AK',
        },
        content:
          'The navigation issues are concerning. I think we should consider a card sorting exercise with a few key users to restructure the information architecture.',
        timestamp: '4 hours ago',
      },
      {
        id: 202,
        threadId: 2,
        user: {
          name: 'Priya Patel',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'PP',
        },
        content:
          "I've created some alternative visualization mockups based on the feedback. Will share in our design review tomorrow.",
        timestamp: 'Yesterday',
      },
    ],
    3: [
      {
        id: 301,
        threadId: 3,
        user: {
          name: 'David Park',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'DP',
        },
        content:
          'The performance optimizations look good. We should see a significant improvement in load times, especially on older devices.',
        timestamp: '4 days ago',
      },
      {
        id: 302,
        threadId: 3,
        user: {
          name: 'Olivia Wilson',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'OW',
        },
        content:
          "I've been testing the image optimization on various devices. The improvement is noticeable, especially on slower connections.",
        timestamp: '1 week ago',
      },
    ],
    4: [
      {
        id: 401,
        threadId: 4,
        user: {
          name: 'Priya Patel',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'PP',
        },
        content:
          "I've prepared the sprint planning document. Let's review it together tomorrow during our standup.",
        timestamp: '5 days ago',
      },
      {
        id: 402,
        threadId: 4,
        user: {
          name: 'James Taylor',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'JT',
        },
        content:
          "I'm concerned about the authentication service refactoring timeline. We might need to allocate more resources to meet the deadline.",
        timestamp: '1 week ago',
      },
    ],
    5: [
      {
        id: 501,
        threadId: 5,
        user: {
          name: 'Michael Brown',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'MB',
        },
        content:
          "The Redis cache implementation makes a lot of sense. I've had good experiences with this approach on previous projects.",
        timestamp: '3 hours ago',
      },
      {
        id: 502,
        threadId: 5,
        user: {
          name: 'Sarah Martinez',
          avatar: '/placeholder.svg?height=40&width=40',
          initials: 'SM',
        },
        content:
          'Has anyone looked into the cost implications of the proposed changes? We should make sure this fits within our infrastructure budget.',
        timestamp: 'Yesterday',
      },
    ],
  };

  // Return thread-specific comments if available, otherwise generate generic ones
  if (threadComments[threadId]) {
    return threadComments[threadId];
  }

  // Generate generic comments for threads without specific content
  return [
    {
      id: threadId * 100 + 1,
      threadId: threadId,
      user: {
        name: 'David Wilson',
        avatar: '/placeholder.svg?height=40&width=40',
        initials: 'DW',
      },
      content: `I've reviewed the latest updates. We should discuss the implementation timeline in our next meeting.`,
      timestamp: '2 hours ago',
    },
    {
      id: threadId * 100 + 2,
      threadId: threadId,
      user: {
        name: 'Sarah Martinez',
        avatar: '/placeholder.svg?height=40&width=40',
        initials: 'SM',
      },
      content: `Has anyone started working on the documentation for this? I'd be happy to help with that.`,
      timestamp: 'Yesterday',
    },
    {
      id: threadId * 100 + 3,
      threadId: threadId,
      user: {
        name: 'James Taylor',
        avatar: '/placeholder.svg?height=40&width=40',
        initials: 'JT',
      },
      content: `Great progress so far! Let's make sure we're aligning this with our quarterly objectives.`,
      timestamp: '3 days ago',
    },
  ];
}

// Mock function to add a comment
export async function addComment(
  threadId: number,
  content: string
): Promise<Comment> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In a real app, this would be a POST request
  const newComment: Comment = {
    id: Date.now(),
    threadId,
    user: {
      name: 'You',
      avatar: '/placeholder.svg?height=40&width=40',
      initials: 'YO',
    },
    content,
    timestamp: 'Just now',
  };

  // Return the new comment
  return newComment;
}

// Mock function to add a message
export async function addMessage(
  threadId: number,
  content: string
): Promise<Message> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In a real app, this would be a POST request
  const newMessage: Message = {
    id: Date.now(), // Use timestamp as a temporary ID
    threadId,
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

  // Return the new message
  return newMessage;
}

// Mock function to add a bot response
export async function addBotResponse(
  threadId: number,
  threadTitle: string
): Promise<Message> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate a contextual response based on the thread title
  let responseContent = '';

  if (threadTitle.includes('Roadmap')) {
    responseContent =
      "I've analyzed your input regarding the roadmap. Would you like me to create a timeline visualization for these priorities?";
  } else if (threadTitle.includes('Testing')) {
    responseContent =
      'Based on the user testing data and your feedback, I recommend focusing on simplifying the navigation structure first. Would you like me to suggest some specific UI improvements?';
  } else if (threadTitle.includes('Performance')) {
    responseContent =
      "Your performance concerns are valid. I've run some additional analysis and found that we could also optimize the database queries to reduce load times by another 15-20%.";
  } else if (threadTitle.includes('Sprint')) {
    responseContent =
      "I've updated the sprint plan based on your feedback. The revised timeline looks achievable with our current team capacity. Shall I share this with the broader team?";
  } else if (threadTitle.includes('API')) {
    responseContent =
      "I've documented the proposed API changes and created a migration plan that minimizes disruption to existing services. Would you like me to schedule a review with the architecture team?";
  } else {
    responseContent = `I've processed your message about "${threadTitle}". What specific aspects would you like me to help with next?`;
  }

  // In a real app, this would be a POST request to an AI endpoint
  const botResponse: Message = {
    id: Date.now() + 1, // Use timestamp + 1 as a temporary ID
    threadId,
    sender: {
      name: 'SmartSpace',
      avatar: '/placeholder.svg?height=40&width=40',
    },
    content: responseContent,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isCurrentUser: false,
  };

  // Return the bot response
  return botResponse;
}
