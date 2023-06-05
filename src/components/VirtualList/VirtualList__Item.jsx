'use client';

import { useEffect, useRef } from 'react';

export const VirtualListItem = ({ children, className, updateRect, top }) => {
    const ref = useRef(null);

    useEffect(() => {
        const rect = ref.current.getBoundingClientRect();
        updateRect(rect);
    });

    return (
        <div style={{ top }} className={className} ref={ref}>
            {children}
        </div>
    );
};
