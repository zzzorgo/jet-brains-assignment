import { useEffect, useRef } from 'react';

export const useWidthChanged = (callback, observedElementRef, enabled, callback2) => {
    const prevWidth = useRef(0);
    const prevHeight = useRef(0);
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

                callback2(entry.contentRect.height)
            });
        });

        resizeObserver.current.observe(observedElementRef.current);
    }, [callback, callback2, enabled, observedElementRef]);
};
