'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VirtualList.module.css';
import { VirtualListItem } from './VirtualList__Item';
import { useWidthChanged } from '@/utils/hooks';
import { useRenderedSlice } from './VirtualList.hooks';

const LIFECYCLE_PHASES = {
    Init: 'Init',
    Ready: 'Ready',
    ResizeLayout: 'ResizeLayout',
    NewMessagesLayout: 'NewMessagesLayout',
    ScrollLayout: 'ScrollLayout',
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

const loadMessages = async (offset, size = 3000) => {
    // todo: handle errors
    const resp = await fetch(`/api/messages?offset=${offset}&size=${size}`);
    const newMessages = await resp.json();

    return newMessages;
};

export const VirtualList = ({ initialMessages }) => {
    const [messages, setMessages] = useState(initialMessages);
    // even though we can calculate it from messages, it's better to have it as a separate state
    // so not to iterate over messages on each render
    const [lastLoadedElement, setLastLoadedElement] = useState(initialMessages[initialMessages.length - 1].id);
    const [lifeCyclePhase, setLifecyclePhase] = useState(LIFECYCLE_PHASES.Init);

    const containerRef = useRef(null);
    const containerHeightRef = useRef(0);
    const scrollContainerRef = useRef(null);
    const totalHeightRef = useRef(0);
    const lastDownloadedMessagesRef = useRef([]);
    const prevScrollRef = useRef(0);
    const heightAndTopRef = useRef({});
    const scrollDirectionRef = useRef(SCROLL_DIRECTIONS.None);
    const loadingStatusRef = useRef(LOADING_STATUS.NotSent);

    const {
        setNextTopAndBottomElements,
        setTopElement,
        topElement,
        bottomElement,
    } = useRenderedSlice(lastLoadedElement, heightAndTopRef.current);

    // todo: measure useCallback impact
    const scrollHandler = async (e) => {
        const currentScroll = e.target.scrollTop;

        const needToLoadMoreMessages = currentScroll < 1000
            && loadingStatusRef.current !== LOADING_STATUS.Loading;

        // todo: optimize amount of requests
        if (needToLoadMoreMessages) {
            loadingStatusRef.current = LOADING_STATUS.Loading;
            const newMessages = await loadMessages(lastLoadedElement + 1);

            if (newMessages.length > 0) {
                const lastElement = newMessages[newMessages.length - 1].id;

                lastDownloadedMessagesRef.current = newMessages;
                setMessages([...newMessages, ...messages]);
                setLastLoadedElement(lastElement);
                setTopElement(lastElement);
                setLifecyclePhase(LIFECYCLE_PHASES.NewMessagesLayout);

                return;
            }
        }

        setNextTopAndBottomElements(currentScroll, containerHeightRef.current);

        scrollDirectionRef.current = currentScroll - prevScrollRef.current < 0 ? SCROLL_DIRECTIONS.Up : SCROLL_DIRECTIONS.Down;
        prevScrollRef.current = currentScroll;
    };

    useEffect(() => {
        if (lifeCyclePhase === LIFECYCLE_PHASES.Init) {
            totalHeightRef.current = messages.reduce((acc, message) => {
                return acc + heightAndTopRef.current[message.id].height;
            }, 0);

            for (let index = 0; index < messages.length; index++) {
                const element = heightAndTopRef.current[index];
                const prevTop = heightAndTopRef.current[index - 1]?.top ?? totalHeightRef.current;
                element.top = prevTop - element.height;
            }

            scrollContainerRef.current.style.height = `${totalHeightRef.current}px`;

            setLifecyclePhase(LIFECYCLE_PHASES.ScrollToBottom);
        } else if (lifeCyclePhase === LIFECYCLE_PHASES.ScrollToBottom) {
            containerRef.current.scrollBy(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            setLifecyclePhase(LIFECYCLE_PHASES.Ready);
        }
    }, [lifeCyclePhase, messages]);

    useEffect(() => {
        if (lifeCyclePhase.startsWith(LIFECYCLE_PHASES.ResizeLayout)) {
            console.log('resize');
            setLifecyclePhase(LIFECYCLE_PHASES.Ready);
        }
    }, [lifeCyclePhase]);

    useEffect(() => {
        if (lifeCyclePhase === LIFECYCLE_PHASES.ScrollLayout) {
            setLifecyclePhase(LIFECYCLE_PHASES.Ready);
        }
    }, [lifeCyclePhase]);

    useEffect(() => {
        if (lifeCyclePhase === LIFECYCLE_PHASES.NewMessagesLayout) {
            lastDownloadedMessagesRef.current = [];
            loadingStatusRef.current = LOADING_STATUS.Success;

            setLifecyclePhase(LIFECYCLE_PHASES.Ready);
        }

    }, [lifeCyclePhase]);

    // const messagesToRender2 = Array(topElement - bottomElement).fill(undefined);

    // for (let index = bottomElement; index <= topElement; index++) {
    //     messagesToRender2[index - bottomElement] = messages[index];
    // }
    const messagesToRender = messages.filter(item => (item.id <= topElement && item.id >= bottomElement) || lifeCyclePhase === LIFECYCLE_PHASES.Init);
    
    // console.log('messagesToRender', messagesToRender);
    // console.log('messagesToRender2', messagesToRender2);
    // console.log('topElement', topElement);
    // console.log('bottomElement', bottomElement);

    useWidthChanged(
        () => setLifecyclePhase(LIFECYCLE_PHASES.ResizeLayout + Math.random()),
        containerRef,
        lifeCyclePhase === LIFECYCLE_PHASES.Ready,
        (newHeight) => { containerHeightRef.current = newHeight; }
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
                            if (lifeCyclePhase === LIFECYCLE_PHASES.Init) {
                                heightAndTopRef.current[item.id] = {
                                    top: 0,
                                    height: rect.height,
                                };
                            } else {
                                const prevHeight = heightAndTopRef.current[item.id]?.height ?? 0;

                                if (rect.height !== prevHeight) {
                                    const diff = rect.height - prevHeight;
                                    totalHeightRef.current += diff;
                                    setLifecyclePhase(LIFECYCLE_PHASES.ScrollLayout);
                                    scrollContainerRef.current.style.height = `${totalHeightRef.current}px`;

                                    heightAndTopRef.current[item.id] = {
                                        top: heightAndTopRef.current[item.id]?.top ?? 0,
                                        height: rect.height,
                                    };

                                    for (let i = item.id - 1; i >= 0; i--) {
                                        if (heightAndTopRef.current[i]) {
                                            heightAndTopRef.current[i].top += diff;
                                        }
                                    }

                                    if (scrollDirectionRef.current === SCROLL_DIRECTIONS.Up) {
                                        containerRef.current.scrollBy(0, diff);
                                    }
                                }
                            }
                        }}
                        top={(heightAndTopRef.current[item.id]?.top ?? 0)}
                    >
                        <div className={styles.VirtualList__ItemHeader}>{item.id}</div>
                        <div>{item.body}</div>
                    </VirtualListItem>
                ))}
            </div>
        </div>
    );
};
