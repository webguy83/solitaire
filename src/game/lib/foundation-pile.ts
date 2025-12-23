import { CardSuit, CardValue } from "./common";

export class FoundationPile {
    private _suit: CardSuit;
    private _currentValue: CardValue | 0;

    constructor(suit: CardSuit) {
        this._suit = suit;
        this._currentValue = 0;
    }

    get suit() {
        return this._suit;
    }

    get value() {
        return this._currentValue;
    }

    reset() {
        this._currentValue = 0;
    }

    addCard() {
        if (this._currentValue < 13) {
            this._currentValue += 1;
        }
    }
}