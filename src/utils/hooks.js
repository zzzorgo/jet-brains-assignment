import { useEffect, useRef } from 'react';

export const useWidthChanged = (callback, observedElementRef, enabled) => {
    const prevWidth = useRef(0);
    const resizeObserver = useRef(null);

    useEffect(() => {
        if (resizeObserver.current) {
            resizeObserver.current.disconnect();
        }

        resizeObserver.current = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                if (prevWidth.current !== entry.contentRect.width && enabled) {
                    prevWidth.current = entry.contentRect.width;
                    callback();
                }
            });
        });

        resizeObserver.current.observe(observedElementRef.current);
    }, [callback, enabled, observedElementRef]);
};
