export const getTotalHeight = (rectEntries) => {
    // todo: why not reduce
    let totalHeight = 0;

    for (let index = 0; index < rectEntries.length; index++) {
        const [, rect] = rectEntries[index];
        totalHeight += rect.height;
    }

    return totalHeight;
};
