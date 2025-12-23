import { CARD_SUIT_TO_COLOUR, CardSuit, CardValue } from './common';

export class Card {
    private _suit: CardSuit;
    private _value: CardValue;
    private _isFaceUp: boolean;

    constructor(suit: CardSuit, value: CardValue, isFaceUp: boolean = false) {
        this._suit = suit;
        this._value = value;
        this._isFaceUp = isFaceUp;
    }

    get suit() {
        return this._suit;
    }

    get value() {
        return this._value;
    }

    get isFaceUp() {
        return this._isFaceUp;
    }

    get colour() {
        return CARD_SUIT_TO_COLOUR[this._suit];
    }

    flip() {
        this._isFaceUp = !this._isFaceUp;
    }


}