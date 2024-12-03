import { useState } from 'react';
import styles from './chat-body.module.scss';
import { DropdownMenu, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { Separator } from '../../ui/separator';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export function ChatBody() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `I'm sorry for any misunderstanding, but as an AI text-based assistant, I don't have the capability to plot graphs or charts. My primary function is to provide information and answer questions based on the data and functions available to me. I recommend using specialized software or tools for data visualization, such as Excel, Google Sheets, or a programming language like Python with libraries for data visualization (e.g., matplotlib, seaborn).`,
      sender: 'bot',
    },
    {
      id: 2,
      text: 'I need some information about your services.',
      sender: 'user',
    },
    {
      id: 3,
      text: `Sure! I'd be happy to help. Please provide me with more details or specific questions about our services, and I'll do my best to assist you.`,
      sender: 'bot',
    },
    {
      id: 4,
      text: 'What are your office hours?',
      sender: 'user',
    },
    {
      id: 5,
      text: `Our office hours are from 9:00 AM to 5:00 PM, Monday to Friday. We are closed on weekends and public holidays. If you have any urgent inquiries outside of these hours, please send us an email, and we'll get back to you as soon as possible.`,
      sender: 'bot',
    },
    {
      id: 6,
      text: 'Can I schedule a meeting with you?',
      sender: 'user',
    },
    {
      id: 7,
      text: `Of course! I'd be happy to schedule a meeting with you. Please provide me with your availability, preferred meeting date and time, and any specific topics or questions you'd like to discuss. I'll do my best to accommodate your request and arrange a meeting that works for both of us.`,
      sender: 'bot',
    },
    {
      id: 8,
      text: 'Thank you for your help!',
      sender: 'user',
    },
    {
      id: 9,
      text: `You're welcome! If you have any more questions or need further assistance, feel free to ask. I'm here to help. Have a great day!`,
      sender: 'bot',
    },
    {
      id: 10,
      text: 'This is a test message from the user.',
      sender: 'user',
    },
    {
      id: 11,
      text: 'This is a response from the bot.',
      sender: 'bot',
    },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
      };
      setMessages([
        ...messages,
        userMessage,
        {
          id: messages.length + 2,
          text: 'This is a response from the bot.',
          sender: 'bot',
        },
      ]);
      setNewMessage('');
    }
  };

  return (
    <div className="chat__body flex-grow flex flex-col min-h-0 bg-white">
      <ScrollArea className="chat__scroll-area flex-grow">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none"></div>
        <div className="chat__messages-list p-8">
          <div className="messages">
            <ScrollArea className="messages__scroll-area flex-grow">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message w-full mb-5 ${
                    message.sender === 'user' ? 'text-left' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block p-3 max-w-4xl rounded-lg shadow-lg group  ${
                      message.sender === 'user'
                        ? 'bg-primary border border-primary'
                        : 'text-left border border-secondary '
                    }`}
                  >
                    <div className="message__text text-md relative  ">
                      {/* Toolbar - Hidden by default, visible on hover */}
                      <div className="absolute top-0 -right-2 mt-[-45px] z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="flex gap-3 px-4 py-3 bg-card rounded-md shadow-md border">
                              <Button
                                className="hover:bg-transparent h-4 w-4 hover:text-primary"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigator.clipboard.writeText(message.text)
                                }
                              >
                                <Copy />
                              </Button>
                              <Separator orientation="vertical" />
                              <Button
                                className="hover:bg-transparent h-4 w-4 hover:text-destructive"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setMessages(
                                    messages.filter(
                                      (msg) => msg.id !== message.id
                                    )
                                  )
                                }
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </DropdownMenuTrigger>
                        </DropdownMenu>
                      </div>
                      <div
                        className={`message-text ${
                          message.sender === 'user'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default ChatBody;
