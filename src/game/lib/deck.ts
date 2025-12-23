import { Card } from "./card";
import { CARD_SUIT, CardValue } from "./common";
import { shuffleArray } from "./utils";

export class Deck {
    private _cards: Card[];
    private _drawPile: Card[];
    private _discardPile: Card[];

    constructor() {
        this._cards = [];
        this._drawPile = [];
        this._discardPile = [];
        this.createDeck();
        this.reset();
    }

    reset() {
        this._discardPile = [];
        this._drawPile = [...this._cards];
        this.shuffle();
    }

    get cards() {
        return this._cards;
    }

    get drawPile() {
        return this._drawPile;
    }

    get discardPile() {
        return this._discardPile;
    }

    drawCard() {
        return this._drawPile.shift();
    }

    shuffle() {
        this._drawPile = shuffleArray(this._drawPile);
    }

    shuffleInDiscardPile() {
        this._discardPile.forEach(card => {
            card.flip();
            this._drawPile.push(card);
        });
        this._discardPile = [];
    }

    private createDeck() {
        Object.values(CARD_SUIT).forEach(suit => {
            for (let value = 1; value <= 13; value++) {
                this._cards.push(new Card(suit, value as CardValue));
            }
        });
    }

}