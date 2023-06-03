'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VirtualList.module.css';
import { VirtualListItem } from './VirtualList__Item';
import { useWidthChanged } from './hooks';
import { useRenderedSlice } from './VirtualList.hooks';

const LIFECYCLE_PHASES = {
    Init: 'Init',
    Ready: 'Ready',
    ResizeLayout: 'ResizeLayout',
    ScrollToBottom: 'ScrollToBottom',
};

const SCROLL_DIRECTIONS = {
    Up: 'Up',
    Down: 'Down',
    None: 'None',
};

const LOADING_STATUS = {
    NotSent: 'NotSent',
    Loading: 'Loading',
    Success: 'Success',
    Error: 'Error',
};

const loadMessages = async (offset, size = 100) => {
    // todo: handle errors
    const resp = await fetch(`/api/messages?offset=${offset}&size=${size}`);
    const newMessages = await resp.json();

    return newMessages;
};

const getTotalHeight = (rectEntries) => {
    let totalHeight = 0;

    for (let index = 0; index < rectEntries.length; index++) {
        const [, rect] = rectEntries[index];
        totalHeight += rect.height;
    }

    return totalHeight;
};

export const VirtualList = ({ initialMessages }) => {
    const [messages, setMessages] = useState(initialMessages);
    // even though we can calculate it from messages, it's better to have it as a separate state
    // so not to iterate over messages on each render
    const [lastLoadedElement, setLastLoadedElement] = useState(initialMessages[initialMessages.length - 1].id);
    const [lifeCyclePhase, setLifecyclePhase] = useState(LIFECYCLE_PHASES.Init);

    const rectsRef = useRef({});
    const containerRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const prevTotalHeightRef = useRef(0);
    const prevScrollRef = useRef(0);
    const scrollDirectionRef = useRef(SCROLL_DIRECTIONS.None);
    const loadingStatusRef = useRef(LOADING_STATUS.NotSent);

    const rectEntries = Object.entries(rectsRef.current);
    const totalHeight = getTotalHeight(rectEntries);

    const {
        tops,
        setNextTopAndBottomElements,
        setTopElement,
        topElement,
        bottomElement,
    } = useRenderedSlice(lastLoadedElement, rectEntries, totalHeight);

    // todo: measure useCallback impact
    const scrollHandler = async (e) => {
        const currentScroll = e.target.scrollTop;
        const containerRect = containerRef.current.getBoundingClientRect();

        const needToLoadMoreMessages = currentScroll < 1000
            && lifeCyclePhase === LIFECYCLE_PHASES.Ready
            && loadingStatusRef.current !== LOADING_STATUS.Loading;

        // todo: optimize amount of requests
        if (needToLoadMoreMessages) {
            loadingStatusRef.current = LOADING_STATUS.Loading;
            const newMessages = await loadMessages(lastLoadedElement + 1);

            if (newMessages.length > 0) {
                const lastElement = newMessages[newMessages.length - 1].id;

                setMessages([...newMessages, ...messages]);
                setLastLoadedElement(lastElement);
                setTopElement(lastElement);

                return;
            }
        }

        setNextTopAndBottomElements(currentScroll, containerRect);

        scrollDirectionRef.current = currentScroll - prevScrollRef.current < 0 ? SCROLL_DIRECTIONS.Up : SCROLL_DIRECTIONS.Down;
        prevScrollRef.current = currentScroll;
    };

    useEffect(() => {
        if (lifeCyclePhase === LIFECYCLE_PHASES.Init) {
            setLifecyclePhase(LIFECYCLE_PHASES.ScrollToBottom);
        } else if (lifeCyclePhase === LIFECYCLE_PHASES.ScrollToBottom) {
            containerRef.current.scrollBy(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            prevTotalHeightRef.current = totalHeight;
            setLifecyclePhase(LIFECYCLE_PHASES.Ready);
        }
    }, [lifeCyclePhase, totalHeight]);

    useEffect(() => {
        // using ref to have proper update order
        scrollContainerRef.current.style.height = `${totalHeight}px`;

        if (lifeCyclePhase.startsWith(LIFECYCLE_PHASES.ResizeLayout)) {
            const diff = totalHeight - prevTotalHeightRef.current;

            if (scrollDirectionRef.current === SCROLL_DIRECTIONS.Up) {
                containerRef.current.scrollBy(diff, diff);
            }

            prevTotalHeightRef.current = totalHeight;
            setLifecyclePhase(LIFECYCLE_PHASES.Ready);
        }

        if (lifeCyclePhase === LIFECYCLE_PHASES.ResizeLayout) {
            loadingStatusRef.current = LOADING_STATUS.Success;
        }

    }, [lifeCyclePhase, messages, totalHeight]);

    useEffect(() => {
        if (lifeCyclePhase === LIFECYCLE_PHASES.ResizeLayout) {
            loadingStatusRef.current = LOADING_STATUS.Success;
        }

    }, [lifeCyclePhase]);

    const messagesToRender = messages.filter(item => (item.id <= topElement && item.id >= bottomElement) || lifeCyclePhase === LIFECYCLE_PHASES.Init);

    useWidthChanged(
        () => setLifecyclePhase(LIFECYCLE_PHASES.ResizeLayout + Math.random()),
        containerRef,
        lifeCyclePhase === LIFECYCLE_PHASES.Ready
    );

    return (
        /* todo: do not use style */
        <div
            className={styles.VirtualList}
            onScroll={scrollHandler} ref={containerRef}
            style={{
                opacity: lifeCyclePhase === LIFECYCLE_PHASES.Init ? 0 : 1,
            }}
        >
            <div ref={scrollContainerRef}>
                {messagesToRender.map((item) => (
                    <VirtualListItem
                        className={styles.VirtualList__Item}
                        key={item.id}
                        updateRect={(rect) => {
                            if (rect.height !== rectsRef.current[item.id]?.height) {
                                rectsRef.current[item.id] = rect;
                                setLifecyclePhase(LIFECYCLE_PHASES.ResizeLayout);
                            }
                        }}
                        top={tops[item.id]}
                        height={rectsRef.current[item.id]?.height}
                    >
                        {item.body} {item.id}
                    </VirtualListItem>
                ))}
            </div>
        </div>
    );
};
