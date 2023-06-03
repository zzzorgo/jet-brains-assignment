'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VirtualList.module.css';

export const VirtualListItem = ({ children, className, updateRect, isVisible, top, height }) => {
    useEffect(() => {
        if (isVisible) {
            const rect = ref.current.getBoundingClientRect();
            updateRect(rect);
        }
    });

    const ref = useRef(null);
    const topToRender = isNaN(top) ? 0 : top;
    const bottomToRender = isNaN(height) ? 0 : height + top;

    return (
        <div style={{ opacity: isVisible ? 1 : 0, top }} className={className} ref={ref}>
            <div className={styles.VirtualList__ItemDivider}>
                <div style={{ position: 'absolute', background: 'white', fontSize: 10, padding: '4px' }}>{topToRender}</div>
            </div>
            {children}
            <div className={styles.VirtualList__ItemDivider}>
                <div style={{ position: 'absolute', background: 'white', fontSize: 10, padding: '4px', transform: 'translateY(-100%)' }}>{bottomToRender}</div>
            </div>
        </div>

    );
};
