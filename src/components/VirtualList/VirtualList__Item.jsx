'use client';

import { useEffect, useRef, useState } from 'react';

export const VirtualListItem = ({ children, className, updateRect, top }) => {
    useEffect(() => {
        const rect = ref.current.getBoundingClientRect();
        updateRect(rect);
    });

    const ref = useRef(null);

    return (
        <div style={{ top }} className={className} ref={ref}>
            {children}
        </div>

    );
};
