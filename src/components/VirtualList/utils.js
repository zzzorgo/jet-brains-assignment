export const getTotalHeight = (rectEntries) => {
    // Could be done with a single `reduce` call, but it is more readable to use a `for` loop here
    let totalHeight = 0;

    for (let index = 0; index < rectEntries.length; index++) {
        const [, rect] = rectEntries[index];
        totalHeight += rect.height;
    }

    return totalHeight;
};
