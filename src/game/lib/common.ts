export const CARD_SUIT = {
    HEART: 'HEART',
    DIAMOND: 'DIAMOND',
    CLUB: 'CLUB',
    SPADE: 'SPADE',
} as const;

export type CardSuit = keyof typeof CARD_SUIT;

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export const CARD_SUIT_COLOUR = {
    RED: 'RED',
    BLACK: 'BLACK',
} as const;

export type CardSuitColour = keyof typeof CARD_SUIT_COLOUR;

export const CARD_SUIT_TO_COLOUR = {
    [CARD_SUIT.HEART]: CARD_SUIT_COLOUR.RED,
    [CARD_SUIT.DIAMOND]: CARD_SUIT_COLOUR.RED,
    [CARD_SUIT.CLUB]: CARD_SUIT_COLOUR.BLACK,
    [CARD_SUIT.SPADE]: CARD_SUIT_COLOUR.BLACK,
};