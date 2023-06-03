import { useState } from 'react';

export const useRenderedSlice = (lastLoadedElement, rectEntries, totalHeight) => {
    const [bottomElement, setBottomElement] = useState(0);
    const [topElement, setTopElement] = useState(lastLoadedElement);

    const tops = {};

    let accumulatedTop = totalHeight;

    for (let index = 0; index < rectEntries.length; index++) {
        const [id, rect] = rectEntries[index];
        accumulatedTop -= rect.height;
        tops[id] = accumulatedTop;
    }

    const calculateNextTopAndBottomElements = (currentScroll, containerRect) => {
        let nextTopElement = topElement;

        while(currentScroll > tops[nextTopElement] && nextTopElement > 0) {
            nextTopElement--;
        }

        while(currentScroll < tops[nextTopElement] && nextTopElement < lastLoadedElement) {
            nextTopElement++;
        }

        nextTopElement = (Math.min(nextTopElement + 5, lastLoadedElement));

        let nextBottomElement = bottomElement;

        while(currentScroll + containerRect.height > tops[nextBottomElement] && nextBottomElement > 0) {
            nextBottomElement--;
        }

        while(currentScroll + containerRect.height < tops[nextBottomElement] && nextBottomElement < lastLoadedElement) {
            nextBottomElement++;
        }

        nextBottomElement = (Math.max(nextBottomElement - 5, 0));

        return { nextTopElement, nextBottomElement };
    };

    const setNextTopAndBottomElements = (currentScroll, containerRect) => {
        const { nextTopElement, nextBottomElement } = calculateNextTopAndBottomElements(currentScroll, containerRect);
        setTopElement(nextTopElement);
        setBottomElement(nextBottomElement);
    };

    return { setNextTopAndBottomElements, tops, setTopElement, setBottomElement, bottomElement, topElement };
};

