// Number of DOM slots in the scrolling ring buffer.
export const SLOT_COUNT = 24

// How many slots ahead to pre-generate before they scroll into view.
export const LOOK_AHEAD = 8

// How many phantom slots to append after the ring buffer to prevent the
// translateX-reset snap from being visible.
export const EXTRA_SLOTS = 8

export const HIT_WINDOW_MS = 175

export const REVIEW_SLOT_PX = 320
