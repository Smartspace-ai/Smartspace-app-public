import { Mic, Paperclip, Plus, Send, Smile } from 'lucide-react';
import { Button } from '../../ui/button';
import styles from './chat-composer.module.scss';
import { Textarea } from '../../ui/textarea';

export function ChatComposer() {
  return (
    <div className="chat__composer p-4 w-full bag">
      <div className="chat__composer-inner flex items-center">
        {/* Attach File Button */}
        <button className="p-2  transition-colors">
          <Paperclip className="h-6 w-6" />
        </button>

        {/* Emoji Button */}
        <button className="p-2 transition-colors">
          <Smile className="h-6 w-6" />
        </button>

        {/* Text Area */}
        <div className="flex-grow mx-4">
          <Textarea
            rows={1}
            className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your messages..."
          />
        </div>

        {/* Send Message Button */}
        <button className="p-2 transition-colors">
          <Send className="h-6 w-6 rotate-45" />
        </button>
      </div>
    </div>
  );
}

export default ChatComposer;
