'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './VirtualList.module.css';
import { VirtualListItem } from './VirtualList__Item';

export const Some = ({ data }) => {
    const rects = useRef({});
    const [messages, setMessages] = useState(data);
    const [bottomElement, setBottomElement] = useState(0);
    const [lastLoadedElement, setLastLoadedElement] = useState(data[data.length - 1].id);
    const [topElement, setTopElement] = useState(data[data.length - 1].id);
    const [initPhase, setInitPhase] = useState('layout');
    const ref = useRef(null);
    const scrollContainerRef = useRef(null);
    const prevTotalHeight = useRef(0);
    const prevWidth = useRef(0);
    const prevScroll = useRef(0);
    const scrollDirection = useRef('unknown');
    const resizeObserver = useRef(null);

    const tops = {};

    let totalHeight = 0;

    const entries = Object.entries(rects.current);

    for (let index = 0; index < entries.length; index++) {
        const [id, rect] = entries[index];
        totalHeight += rect.height;
    }

    let accumulatedTop = totalHeight;

    for (let index = 0; index < entries.length; index++) {
        const [id, rect] = entries[index];
        accumulatedTop -= rect.height;
        tops[id] = accumulatedTop;
    }

    const calculateNextTopAndBottom = (currentScroll, containerRect) => {
        let nextTopElement = topElement;

        while(currentScroll > tops[nextTopElement] && nextTopElement > 0) {
            nextTopElement--;
        }

        while(currentScroll < tops[nextTopElement] && nextTopElement < lastLoadedElement) {
            nextTopElement++;
        }

        setTopElement(Math.min(nextTopElement + 5, lastLoadedElement));

        let nextBottomElement = bottomElement;


        while(currentScroll + containerRect.height > tops[nextBottomElement] && nextBottomElement > 0) {
            nextBottomElement--;
        }

        while(currentScroll + containerRect.height < tops[nextBottomElement] && nextBottomElement < lastLoadedElement) {
            nextBottomElement++;
        }

        setBottomElement(Math.max(nextBottomElement - 5, 0));
    };

    // todo: measure useCallback impact
    const scrollHandler = async (e) => {
        const currentScroll = e.target.scrollTop;
        scrollDirection.current = currentScroll - prevScroll.current < 0 ? 'up' : 'down';
        const containerRect = ref.current.getBoundingClientRect();

        // todo: optimize amount of requests
        if (currentScroll < 500 && initPhase !== 'scrollToBottom') {
            // todo: handle errors
            const resp = await fetch(`/api/messages?offset=${lastLoadedElement + 1}&size=100`);
            const newMessages = (await resp.json()).data;
            setMessages([...newMessages, ...messages]);

            if (newMessages.length > 0) {
                setLastLoadedElement(newMessages[newMessages.length - 1].id);
                setTopElement(newMessages[newMessages.length - 1].id)
                return;
            }
        }

        calculateNextTopAndBottom(currentScroll, containerRect);
        prevScroll.current = currentScroll;
    };

    useEffect(() => {
        if (initPhase === 'layout') {
            setBottomElement(0);
            setInitPhase('scrollToBottom');
        } else if (initPhase === 'scrollToBottom') {
            ref.current.scrollBy(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            prevTotalHeight.current = totalHeight;
            setInitPhase('ready');
        }

        scrollContainerRef.current.style.height = `${totalHeight}px`;

        if (initPhase.startsWith('resizeLayout')) {
            const diff = totalHeight - prevTotalHeight.current;

            if (scrollDirection.current === 'up') {
                ref.current.scrollBy(diff, diff);
            }

            prevTotalHeight.current = totalHeight;
            setInitPhase('ready');
        }

    }, [initPhase, messages, totalHeight]);

    const messagesToRender = messages.filter(item => (item.id <= topElement && item.id >= bottomElement) || initPhase === 'layout');

    useEffect(() => {
        if (resizeObserver.current) {
            resizeObserver.current.disconnect();
        }

        resizeObserver.current = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                if (prevWidth.current !== entry.contentRect.width && initPhase === 'ready') {
                    prevWidth.current = entry.contentRect.width;
                    setInitPhase('resizeLayout' + Math.random());
                }
            });
        });

        resizeObserver.current.observe(ref.current);
    }, [initPhase]);

    return (
        /* todo: do not use style */
        <div className={styles.VirtualList} onScroll={scrollHandler} ref={ref} style={{ opacity: initPhase === 'layout' ? 0 : 1 }}>
            <div
                ref={scrollContainerRef}
            >
                {messagesToRender.map((item) => (
                    <VirtualListItem
                        className={styles.VirtualList__Item}
                        key={item.id}
                        isVisible={true}
                        updateRect={(rect) => {
                            if (rect.height !== rects.current[item.id]?.height) {
                                rects.current[item.id] = rect;
                                setInitPhase('resizeLayout');
                            }
                        }}
                        top={tops[item.id]}
                        height={rects.current[item.id]?.height}
                    >
                        {item.id} {item.body} {item.id}
                    </VirtualListItem>
                ))}
            </div>
        </div>
    );
};
