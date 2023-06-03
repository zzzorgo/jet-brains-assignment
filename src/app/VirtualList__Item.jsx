'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VirtualList.module.css';

export const VirtualListItem = ({ children, className, updateRect, top }) => {
    useEffect(() => {
        const rect = ref.current.getBoundingClientRect();
        updateRect(rect);
    });

    const ref = useRef(null);

    return (
        <div style={{ top }} className={className} ref={ref}>
            <div className={styles.VirtualList__ItemDivider}/>
            {children}
            <div className={styles.VirtualList__ItemDivider}/>
        </div>

    );
};
