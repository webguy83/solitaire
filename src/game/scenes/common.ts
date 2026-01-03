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

export const CARD_WIDTH = 37;
export const CARD_HEIGHT = 52;

export const SCALE = 1.5;
export const CARD_BACK_FRAME = 52;
export const SUIT_FRAMES = {
    HEART: 26,
    DIAMOND: 13,
    SPADE: 39,
    CLUB: 0
}