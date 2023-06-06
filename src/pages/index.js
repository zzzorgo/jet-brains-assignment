import { Message } from '@/components/Message/Message';
import { VirtualList } from '@/components/VirtualList/VirtualList';
import { getMessagesSlice } from '@/utils/getMessagesSlice';
import { loadMessages } from '@/clientApi/messages';

import styles from './index.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <VirtualList
        initialItems={getMessagesSlice(0, 100)}
        ItemComponent={Message}
        loader={loadMessages}
      />
    </main>
  )
}
