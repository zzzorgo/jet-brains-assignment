'use client';

import { useRef, useState } from 'react';
import styles from './VirtualList.module.css';
import { VirtualListItem } from './VirtualList__Item';
import { useInit, useItemLoader, useRenderedSlice, useResizeLayout, useWidthChanged } from './hooks';
import { VirtualListLoader } from './VirtualList__Loader';
import { LIFECYCLE_PHASES, SCROLL_DIRECTIONS } from './constants';
import { LOADING_STATUS } from '@/clientApi/constants';
import { getTotalHeight } from './utils';

export const VirtualList = ({ initialItems, ItemComponent, loader }) => {
  const [lifeCyclePhase, setLifecyclePhase] = useState(LIFECYCLE_PHASES.Init);

  // todo: replace with custom structure
  const itemRectsRef = useRef({});
  const containerRef = useRef(null);
  const prevTotalHeightRef = useRef(0);

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

  useInit(totalHeight, containerRef, prevTotalHeightRef, lifeCyclePhase, setLifecyclePhase);
  const { onScroll, scrollContainerRef } = useResizeLayout(totalHeight, containerRef, prevTotalHeightRef, lifeCyclePhase, setLifecyclePhase);

  useWidthChanged(
    () => setLifecyclePhase(LIFECYCLE_PHASES.ResizeLayout + Math.random()),
    containerRef,
    lifeCyclePhase === LIFECYCLE_PHASES.Ready
  );

  // todo: measure useCallback impact
  const scrollHandler = async (e) => {
    const currentScroll = e.target.scrollTop;
    const containerRect = containerRef.current.getBoundingClientRect();

    const needToLoadMoreItems = currentScroll < 1000
      && lifeCyclePhase === LIFECYCLE_PHASES.Ready
      && loadingStatus !== LOADING_STATUS.Loading;

    if (needToLoadMoreItems) {
      const lastElement = await loadNext();

      setTopElement(lastElement);
    } else {
      setNextTopAndBottomElements(currentScroll, containerRect);
    }

    onScroll(currentScroll);
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
      onScroll={scrollHandler} ref={containerRef}
      style={{
        opacity: lifeCyclePhase === LIFECYCLE_PHASES.Init ? 0 : 1,
      }}
    >
      {loadingStatus === LOADING_STATUS.Loading && <VirtualListLoader className={styles.VirtualList__Loader} />}
      <div ref={scrollContainerRef}>
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
