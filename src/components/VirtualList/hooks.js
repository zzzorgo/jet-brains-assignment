import { LOADING_STATUS } from '@/clientApi/constants';
import { useEffect, useRef, useState } from 'react';
import { LIFECYCLE_PHASES, SCROLL_DIRECTIONS } from './constants';

export const useRenderedSlice = (lastLoadedElement, rectEntries, totalHeight) => {
  const [bottomElement, setBottomElement] = useState(0);
  const [topElement, setTopElement] = useState(lastLoadedElement);

  const calculatedItemTops = {};

  let accumulatedTop = totalHeight;

  for (let index = 0; index < rectEntries.length; index++) {
    const [id, rect] = rectEntries[index];
    accumulatedTop -= rect.height;
    calculatedItemTops[id] = accumulatedTop;
  }

  const calculateNextTopAndBottomElements = (currentScroll, containerRect) => {
    let nextTopElement = topElement;

    while (currentScroll > calculatedItemTops[nextTopElement] && nextTopElement > 0) {
      nextTopElement--;
    }

    while (currentScroll < calculatedItemTops[nextTopElement] && nextTopElement < lastLoadedElement) {
      nextTopElement++;
    }

    nextTopElement = (Math.min(nextTopElement + 40, lastLoadedElement));

    let nextBottomElement = bottomElement;

    while (currentScroll + containerRect.height > calculatedItemTops[nextBottomElement] && nextBottomElement > 0) {
      nextBottomElement--;
    }

    while (currentScroll + containerRect.height < calculatedItemTops[nextBottomElement] && nextBottomElement < lastLoadedElement) {
      nextBottomElement++;
    }

    nextBottomElement = (Math.max(nextBottomElement - 40, 0));

    return { nextTopElement, nextBottomElement };
  };

  const setNextTopAndBottomElements = (currentScroll, containerRect) => {
    const { nextTopElement, nextBottomElement } = calculateNextTopAndBottomElements(currentScroll, containerRect);
    setTopElement(nextTopElement);
    setBottomElement(nextBottomElement);
  };

  return { setNextTopAndBottomElements, calculatedItemTops, setTopElement, setBottomElement, bottomElement, topElement };
};

export const useItemLoader = (initialItems, loader) => {
  const [items, setItems] = useState(initialItems);
  // todo: why both ref ans state
  const [loadingStatus, setLoadingStatus] = useState(LOADING_STATUS.NotSent);
  const loadingStatusRef = useRef(LOADING_STATUS.NotSent);

  const loadNext = async () => {
    let lastLoadedItem = items[items.length - 1].id;

    if (loadingStatusRef.current === LOADING_STATUS.Loading) {
      return lastLoadedItem;
    }

    setLoadingStatus(LOADING_STATUS.Loading);
    loadingStatusRef.current = LOADING_STATUS.Loading;

    const newItems = await loader(lastLoadedItem + 1);

    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
      lastLoadedItem = newItems[newItems.length - 1].id;
    }

    setLoadingStatus(LOADING_STATUS.Success);
    loadingStatusRef.current = LOADING_STATUS.Success;

    return lastLoadedItem;
  };

  return { items, loadingStatus, loadNext };
};

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

export const useInit = (totalHeight, containerRef, prevTotalHeightRef, lifeCyclePhase, setLifecyclePhase) => {
  useEffect(() => {
    if (lifeCyclePhase === LIFECYCLE_PHASES.Init) {
      setLifecyclePhase(LIFECYCLE_PHASES.ScrollToBottom);
    }
  }, [lifeCyclePhase, setLifecyclePhase]);

  useEffect(() => {
    if (lifeCyclePhase === LIFECYCLE_PHASES.ScrollToBottom) {
      containerRef.current.scrollBy(0, Number.MAX_SAFE_INTEGER);
      prevTotalHeightRef.current = totalHeight;
      setLifecyclePhase(LIFECYCLE_PHASES.Ready);
    }
  }, [lifeCyclePhase, setLifecyclePhase, totalHeight, containerRef, prevTotalHeightRef]);
};

export const useResizeLayout = (totalHeight, containerRef, prevTotalHeightRef, lifeCyclePhase, setLifecyclePhase) => {
  const prevScrollRef = useRef(0);
  const scrollDirectionRef = useRef(SCROLL_DIRECTIONS.None);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // using ref to have proper update order
    scrollContainerRef.current.style.height = `${totalHeight}px`;

    if (lifeCyclePhase.startsWith(LIFECYCLE_PHASES.ResizeLayout)) {
      const diff = totalHeight - prevTotalHeightRef.current;

      if (scrollDirectionRef.current === SCROLL_DIRECTIONS.Up) {
        containerRef.current.scrollBy(0, diff);
      }

      prevTotalHeightRef.current = totalHeight;
      setLifecyclePhase(LIFECYCLE_PHASES.Ready);
    }
  }, [lifeCyclePhase, totalHeight, setLifecyclePhase, containerRef, prevTotalHeightRef]);

  return {
    onScroll: (currentScroll) => {
      scrollDirectionRef.current = currentScroll - prevScrollRef.current < 0 ? SCROLL_DIRECTIONS.Up : SCROLL_DIRECTIONS.Down;
      prevScrollRef.current = currentScroll;
    },
    scrollContainerRef,
  };
};
