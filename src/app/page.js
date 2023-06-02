import styles from './page.module.css'
import { Some } from './VirtualList'
import data from '../../mock/data.json';
import { getDataSlice } from '@/utils/getDataSlice';

export default function Home() {
  return (
    <main className={styles.main}>
      <Some data={getDataSlice(0, 10)} />
    </main>
  )
}
