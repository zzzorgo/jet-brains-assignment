'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VirtualList.module.css';
import { VirtualListItem } from './VirtualList__Item';

export const Some = ({ data }) => {
    const rects = useRef({});
    const [messages, setMessages] = useState(data);
    const [bottomElement, setBottomElement] = useState(0);
    const [lastLoadedElement, setLastLoadedElement] = useState(data[data.length - 1].id);
    const [topElement, setTopElement] = useState(0);
    const [firstRender, setFirstRender] = useState(true);
    const [scroll, setScroll] = useState(0);
    const ref = useRef(null);
    const prevScroll = useRef(0);
    let accumulatedTop = 0;

    const tops = {};

    const entries = Object.entries(rects.current);

    const scrollHandler = async (e) => {
        const currentScroll = e.target.scrollTop;
        const scrollVector = currentScroll - prevScroll.current;
        prevScroll.current = currentScroll;
        const containerRect = ref.current.getBoundingClientRect();

        // todo: optimize amount of requests
        if (currentScroll + containerRect.height >= tops[lastLoadedElement]) {
            // todo: handle errors
            const resp = await fetch(`/api/messages?offset=${lastLoadedElement + 1}&size=10000`);
            const newMessages = (await resp.json()).data;
            setMessages([...messages, ...newMessages]);

            if (newMessages.length > 0) {
                setLastLoadedElement(newMessages[newMessages.length - 1].id);
                setBottomElement(newMessages[newMessages.length - 1].id)
                return;
            }
        }

        let nextTopElement = topElement;
        while(currentScroll > tops[nextTopElement] + rects.current[nextTopElement].height && nextTopElement < lastLoadedElement) {
            nextTopElement++;
        }

        while(currentScroll < tops[nextTopElement] && nextTopElement > 0) {
            nextTopElement--;
        }

        setTopElement(Math.max(nextTopElement - 5, 0));

        let nextBottomElement = bottomElement;

        while(currentScroll + containerRect.height > tops[nextBottomElement] && nextBottomElement < lastLoadedElement) {
            nextBottomElement++;
        }

        while(currentScroll + containerRect.height < tops[nextBottomElement] && nextBottomElement >= 0) {
            nextBottomElement--;
        }

        setBottomElement(Math.min(nextBottomElement + 5, lastLoadedElement));
    };

    for (let index = 0; index < entries.length; index++) {
        const [id, rect] = entries[index];
        tops[id] = accumulatedTop;
        accumulatedTop += rect.height;
    }

    useEffect(() => {
        if (firstRender) {
            setBottomElement(messages[messages.length - 1].id);
            setFirstRender(false);
        }
    }, [firstRender]);

    const messagesToRender = messages.filter(item => (item.id >= topElement && item.id <= bottomElement) || firstRender);

    return (
        <>
        <div>{scroll}</div>
        {/* todo: do not use style */}
        <div className={styles.VirtualList} onScroll={scrollHandler} ref={ref} style={{ opacity: firstRender ? 0 : 1 }}>
            <div style={{ minHeight: (tops[lastLoadedElement] ?? 0) + (rects.current[lastLoadedElement]?.height ?? 0) }}>
                {messagesToRender.map((item) => (
                    <VirtualListItem
                        className={styles.VirtualList__Item}
                        key={item.id}
                        isVisible={true}
                        updateRect={(rect) => {
                            rects.current[item.id] = rect;
                        }}
                        top={tops[item.id]}
                        height={rects.current[item.id]?.height}
                    >
                        {item.id} {item.body} {item.id}
                    </VirtualListItem>
                ))}
            </div>
        </div>
        </>
    );
};
