import styles from './page.module.css'
import { VirtualList } from './VirtualList'
import data from '../../mock/data.json';
import { getMessagesSlice } from '@/utils/getDataSlice';

export default function Home() {
  return (
    <main className={styles.main}>
      <VirtualList initialMessages={getMessagesSlice(0, 100)} />
    </main>
  )
}
