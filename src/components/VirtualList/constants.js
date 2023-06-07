export const LIFECYCLE_PHASES = {
    Init: 'Init',
    Ready: 'Ready',
    ResizeLayout: 'ResizeLayout',
    WaitForResizeLayout: 'WaitForResizeLayout',
    ScrollToBottom: 'ScrollToBottom',
};

export const SCROLL_DIRECTIONS = {
    Up: 'Up',
    Down: 'Down',
    None: 'None',
};

export const LOADING_STATUS = {
    NotSent: 'NotSent',
    Loading: 'Loading',
    Success: 'Success',
    Error: 'Error',
};

// Ideally both of the values below should be based on the container size
export const LOAD_NEXT_OFFSET = 1000;
export const BUFFERED_ITEMS_COUNT = 40;

/**
 * You can change this variable to 10 000 or even 100 000 to quickly load all the 100 000 messages in
 * the mock data file, but it is not reasonable to do in production, so the current solution is not
 * optimized for such a case and may behave slowly.
 */
export const PAGE_SIZE = 100;
