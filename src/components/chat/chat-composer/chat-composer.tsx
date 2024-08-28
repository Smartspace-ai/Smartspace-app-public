import { Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import styles from './chat-composer.module.scss';
import { Textarea } from '../../ui/textarea';

export function ChatComposer() {
  return (
    <div className="chat__composer p-8">
      <Textarea />
    </div>
  );
}

export default ChatComposer;
