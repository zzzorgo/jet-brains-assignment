'use client';

import { useRef } from 'react';
import styles from './VirtualList.module.css';
import { VirtualListItem } from './VirtualList__Item';
import { useItemLoader, useLifecyclePhases, useRenderedSlice, useWidthChanged } from './hooks';
import { VirtualListLoader } from './VirtualList__Loader';
import { LIFECYCLE_PHASES, LOAD_NEXT_OFFSET, SCROLL_DIRECTIONS } from './constants';
import { LOADING_STATUS } from '@/clientApi/constants';
import { getTotalHeight } from './utils';

export const VirtualList = ({ initialItems, ItemComponent, loader }) => {
  // todo: replace with custom structure
  const itemRectsRef = useRef({});
  const scrollContainerRef = useRef(null);
  const containerRef = useRef(null);
  const prevTotalHeightRef = useRef(0);
  const prevScrollRef = useRef(0);
  const scrollDirectionRef = useRef(SCROLL_DIRECTIONS.None);

  const rectEntries = Object.entries(itemRectsRef.current);
  const totalHeight = getTotalHeight(rectEntries);

  const { items, loadingStatus, loadNext } = useItemLoader(initialItems, loader);

  const {
    calculatedItemTops,
    setNextTopAndBottomElements,
    setTopElement,
    topElement,
    bottomElement,
  } = useRenderedSlice(items[items.length - 1].id, rectEntries, totalHeight);

  const { lifeCyclePhase, setLifecyclePhase } = useLifecyclePhases({
    onScrollToBottom: () => {
      scrollContainerRef.current.scrollBy(0, Number.MAX_SAFE_INTEGER);
      prevTotalHeightRef.current = totalHeight;
    },
    onResizeLayout: () => {
      containerRef.current.style.height = `${totalHeight}px`;

      const diff = totalHeight - prevTotalHeightRef.current;

      if (scrollDirectionRef.current === SCROLL_DIRECTIONS.Up) {
        scrollContainerRef.current.scrollBy(0, diff);
      }

      prevTotalHeightRef.current = totalHeight;
    },
  });

  useWidthChanged(
    // why math.random
    () => setLifecyclePhase(LIFECYCLE_PHASES.ResizeLayout + Math.random()),
    scrollContainerRef,
    lifeCyclePhase === LIFECYCLE_PHASES.Ready
  );

  const updateScrollData = (currentScroll) => {
    scrollDirectionRef.current = (currentScroll - prevScrollRef.current) < 0
      ? SCROLL_DIRECTIONS.Up
      : SCROLL_DIRECTIONS.Down;
    prevScrollRef.current = currentScroll;
  };

  const scrollHandler = async (e) => {
    const currentScroll = e.target.scrollTop;
    updateScrollData(currentScroll);

    const needToLoadMoreItems = currentScroll < LOAD_NEXT_OFFSET
      && lifeCyclePhase === LIFECYCLE_PHASES.Ready
      && loadingStatus !== LOADING_STATUS.Loading;

    if (needToLoadMoreItems) {
      const lastElement = await loadNext();

      setTopElement(lastElement);
      setLifecyclePhase(LIFECYCLE_PHASES.WaitForResizeLayout);
    } else {
      const scrollContainerRect = scrollContainerRef.current.getBoundingClientRect();
      setNextTopAndBottomElements(currentScroll, scrollContainerRect);
    }
  };

  const getUpdateRectHandler = (id) => (rect) => {
    if (rect.height !== itemRectsRef.current[id]?.height) {
      itemRectsRef.current[id] = rect;
      setLifecyclePhase(LIFECYCLE_PHASES.ResizeLayout);
    }
  };

  const itemsToRender = items.filter(item => {
    const withinRenderedSlice = item.id <= topElement && item.id >= bottomElement;
    const needToRenderEverything = lifeCyclePhase === LIFECYCLE_PHASES.Init;

    return withinRenderedSlice || needToRenderEverything;
  });

  return (
    /* todo: do not use style */
    <div
      className={styles.VirtualList}
      onScroll={scrollHandler} ref={scrollContainerRef}
      style={{
        opacity: lifeCyclePhase === LIFECYCLE_PHASES.Init ? 0 : 1,
      }}
    >
      {loadingStatus === LOADING_STATUS.Loading && <VirtualListLoader className={styles.VirtualList__Loader} />}
      <div ref={containerRef}>
        {itemsToRender.map((item) => (
          <VirtualListItem
            className={styles.VirtualList__Item}
            key={item.id}
            updateRect={getUpdateRectHandler(item.id)}
            top={calculatedItemTops[item.id]}
            height={itemRectsRef.current[item.id]?.height}
          >
            <ItemComponent item={item} />
          </VirtualListItem>
        ))}
      </div>
    </div>
  );
};
