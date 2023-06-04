import global from './globals.css';
import styles from './index.module.css'
import { VirtualList } from '@/components/VirtualList/VirtualList';
import { getMessagesSlice } from '@/utils/getMessagesSlice';

export default function Home() {
  return (
    <main className={styles.main}>
      <VirtualList initialMessages={getMessagesSlice(0, 100)} />
    </main>
  )
}
