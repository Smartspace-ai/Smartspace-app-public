import Threads from '../sidebar/threads/threads';
import ChatBody from './chat-body/chat-body';
import ChatComposer from './chat-composer/chat-composer';
import ChatHeader from './chat-header/chat-header';
import styles from './chat.module.scss';

export function Chat() {
  return (
    <div
      id="chat"
      className="sidebar flex-grow h-screen flex flex-col bg-card border "
    >
      <ChatHeader></ChatHeader>
      <ChatBody></ChatBody>
      <ChatComposer></ChatComposer>
    </div>
  );
}

export default Chat;
