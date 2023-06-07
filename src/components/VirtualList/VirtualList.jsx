'use client';

import { useRef } from 'react';

import { VirtualListItem } from './VirtualList__Item';
import { useItemFetcher, useLifecyclePhases, useRenderedSlice, useWidthChanged } from './hooks';
import { VirtualListLoader } from './VirtualList__Loader';
import { LIFECYCLE_PHASES, LOADING_STATUS, LOAD_NEXT_OFFSET, SCROLL_DIRECTIONS } from './constants';
import { getTotalHeight } from './utils';

import styles from './VirtualList.module.css';

export const VirtualList = ({ initialItems, ItemComponent, fetcher }) => {
  const itemRectsRef = useRef({});
  const scrollContainerRef = useRef(null);
  const containerRef = useRef(null);
  const prevTotalHeightRef = useRef(0);
  const prevScrollRef = useRef(0);
  const scrollDirectionRef = useRef(SCROLL_DIRECTIONS.None);

  /**
   * the two lines bellow may be a bottleneck in case of a huge amount of
   * items because of O(n) time complexity
   */
  const rectEntries = Object.entries(itemRectsRef.current);
  const totalHeight = getTotalHeight(rectEntries);

  const { items, loadingStatus, fetchNext } = useItemFetcher(initialItems, fetcher);

  /**
   * To render only the items that are visible in the viewport plus some extra
   * from the top and the bottom.
   */
  const {
    calculatedItemTops,
    topElement,
    bottomElement,
    setTopElement,
    setNextTopAndBottomElements,
  } = useRenderedSlice(items[items.length - 1].id, rectEntries, totalHeight);

  /**
   * To control the lifecycle of the virtual list in a more granular way
   * we use a `lifeCyclePhase` state which is updated only when needed. Mostly it is
   * utilized to trigger the first render of the new items and adjust the list to the
   * newly added items on the second render, but also to perform initialization and 
   * prevent excessive api calls.
   */
  const { lifeCyclePhase, setLifecyclePhase } = useLifecyclePhases({
    onScrollToBottom: () => {
      scrollContainerRef.current.scrollBy(0, Number.MAX_SAFE_INTEGER);
      prevTotalHeightRef.current = totalHeight;
    },
    onResizeLayout: () => {
      // setting this directly so to control the relative order of height update and scroll (bellow)
      containerRef.current.style.height = `${totalHeight}px`;

      const diff = totalHeight - prevTotalHeightRef.current;

      if (scrollDirectionRef.current === SCROLL_DIRECTIONS.Up) {
        scrollContainerRef.current.scrollBy(0, diff);
      }

      prevTotalHeightRef.current = totalHeight;
    },
  });

  /**
   * To trigger the resize layout phase when the width of the virtual list changes.
   * Math.random generates seed to trigger the resize layout phase on every width change
   * in case of frequent width changes.
   */
  useWidthChanged(
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
      const lastElement = await fetchNext();

      // to expand the rendered slice to render all the new items and measure their height
      setTopElement(lastElement);
      /**
       * to prevent excessive api calls we should wait for the resize layout phase
       * which is triggered by getUpdateRectHandler after the new items are rendered
       */
      setLifecyclePhase(LIFECYCLE_PHASES.WaitForResizeLayout);
    } else {
      /**
       * amount of reflows here could be optimized by utilizing resize observer
       * and measuring the height only when the height of the scroll container changes
       */
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

  /**
   * may be a bottleneck in case of a huge amount of
   * items because of O(n) time complexity
   */
  const itemsToRender = items.filter(item => {
    const withinRenderedSlice = item.id <= topElement && item.id >= bottomElement;
    const needToRenderEverything = lifeCyclePhase === LIFECYCLE_PHASES.Init;

    return withinRenderedSlice || needToRenderEverything;
  });

  return (
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
          >
            <ItemComponent item={item} />
          </VirtualListItem>
        ))}
      </div>
    </div>
  );
};
