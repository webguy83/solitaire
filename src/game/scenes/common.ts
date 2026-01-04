export const SCENE_KEYS = {
    PRELOAD: 'PRELOAD',
    TITLE: 'TITLE',
    GAME: 'GAME',
    BOOT: 'BOOT'
} as const;

export const ASSET_KEYS  = {
    TITLE: 'TITLE',
    CLICK_TO_STSART: 'CLICK_TO_START',
    CARDS: 'CARDS'
} as const;

export const CARD_WIDTH = 48;
export const CARD_HEIGHT = 64;

export const SCALE = 1;
export const CARD_BACK_FRAME = 52;
export const CARD_BACK_FRAMES = [CARD_BACK_FRAME, 53, 54, 55];
export const SUIT_FRAMES = {
    HEART: 26,
    DIAMOND: 13,
    SPADE: 39,
    CLUB: 0
}

// Game colors
export const COLORS = {
    FELT_GREEN: 0x0B7D3E,
    FELT_DARK: 0x085A2C,
    LOCATION_BOX_BG: 0x085A2C,
    LOCATION_BOX_STROKE: 0x000000,
    WHITE: 0xFFFFFF,
    CREAM: 0xFFF8DC,
    DARK_STROKE: 0x043D1A,
    SUIT_RED: 0xDC143C,
    SUIT_RED_DARK: 0xA01020,
    SUIT_BLACK: 0x000000,
    WIN_POPUP_BG: 0x387F3C,
    WIN_POPUP_BORDER: 0x2a5f2e,
    WIN_POPUP_INNER_BORDER: 0x4a9f4e,
    WIN_BANNER_BLUE: 0x2563eb,
    WIN_BANNER_DARK: 0x1a3a6e,
    WIN_BANNER_HIGHLIGHT: 0x3b82f6,
    WIN_BANNER_SHADOW: 0x1e40af
} as const;