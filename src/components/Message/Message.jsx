'use client';

import styles from './Message.module.css';

export const Message = ({ item }) => {
    return (
        <>
            <div className={styles.Message__Header}>{item.id}</div>
            <div className={styles.Message__Body}>{item.body}</div>
        </>
    );
};
