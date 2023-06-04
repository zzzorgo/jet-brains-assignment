import { useState } from 'react';

export const useRenderedSlice = (lastLoadedElement, tops) => {
    const [bottomElement, setBottomElement] = useState(0);
    const [topElement, setTopElement] = useState(lastLoadedElement);

    const calculateNextTopAndBottomElements = (currentScroll, containerHeight) => {
        let nextTopElement = topElement;

        while(currentScroll > tops[nextTopElement].top && nextTopElement > 0) {
            nextTopElement--;
        }

        while(currentScroll < tops[nextTopElement].top && nextTopElement < lastLoadedElement) {
            nextTopElement++;
        }

        nextTopElement = (Math.min(nextTopElement + 20, lastLoadedElement));

        let nextBottomElement = bottomElement;

        while(currentScroll + containerHeight > tops[nextBottomElement].top && nextBottomElement > 0) {
            nextBottomElement--;
        }

        while(currentScroll + containerHeight < tops[nextBottomElement].top && nextBottomElement < lastLoadedElement) {
            nextBottomElement++;
        }

        nextBottomElement = (Math.max(nextBottomElement - 20, 0));

        return { nextTopElement, nextBottomElement };
    };

    const setNextTopAndBottomElements = (currentScroll, containerHeight) => {
        const { nextTopElement, nextBottomElement } = calculateNextTopAndBottomElements(currentScroll, containerHeight);
        setTopElement(nextTopElement);
        setBottomElement(nextBottomElement);
    };

    return { setNextTopAndBottomElements, setTopElement, setBottomElement, bottomElement, topElement };
};

