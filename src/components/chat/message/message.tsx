import styles from './message.module.scss';

export function Message() {
  return (
    <div className={styles['container']}>
      <h1>Welcome to Message!</h1>
    </div>
  );
}

export default Message;
