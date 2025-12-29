import { CardSuit, CardValue } from "./common";

export class FoundationPile {
    private _suit: CardSuit | null;
    private _currentValue: CardValue | 0;

    constructor(suit: CardSuit | null = null) {
        this._suit = suit;
        this._currentValue = 0;
    }

    get suit() {
        return this._suit;
    }

    get value() {
        return this._currentValue;
    }

    get isAssigned() {
        return this._suit !== null;
    }

    reset() {
        this._suit = null;
        this._currentValue = 0;
    }

    assignSuit(suit: CardSuit) {
        if (this._suit === null) {
            this._suit = suit;
        }
    }

    addCard() {
        if (this._currentValue < 13) {
            this._currentValue += 1;
        }
    }
}