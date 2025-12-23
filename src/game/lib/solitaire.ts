import { Card } from "./card";
import { CARD_SUIT } from "./common";
import { Deck } from "./deck";
import { FoundationPile } from "./foundation-pile";

export class Solitaire {

    private _deck: Deck;
    private _foundationPileSpade: FoundationPile;
    private _foundationPileHeart: FoundationPile;
    private _foundationPileClub: FoundationPile;
    private _foundationPileDiamond: FoundationPile;
    private _tableauPiles: Card[][];

    constructor() {
        this._deck = new Deck();
        this._foundationPileSpade = new FoundationPile(CARD_SUIT.SPADE);
        this._foundationPileHeart = new FoundationPile(CARD_SUIT.HEART);
        this._foundationPileClub = new FoundationPile(CARD_SUIT.CLUB);
        this._foundationPileDiamond = new FoundationPile(CARD_SUIT.DIAMOND);
        this._tableauPiles = [[], [], [], [], [], [], []];
    }

    get drawPile() {
        return this._deck.drawPile;
    }

    get discardPile() {
        return this._deck.discardPile;
    }

    get tableauPiles() {
        return this._tableauPiles;
    }

    get foundationPiles() {
        return [this._foundationPileSpade, this._foundationPileHeart, this._foundationPileClub, this._foundationPileDiamond];
    }

    get isWonGame() {
        return this._foundationPileSpade.value === 13 &&
            this._foundationPileHeart.value === 13 &&
            this._foundationPileClub.value === 13 &&
            this._foundationPileDiamond.value === 13;
    }

    newGame() {
        this._deck.reset();
        this._foundationPileSpade.reset();
        this._foundationPileHeart.reset();
        this._foundationPileClub.reset();
        this._foundationPileDiamond.reset();
        this._tableauPiles = [[], [], [], [], [], [], []];

        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = this._deck.drawCard();
                if (card) {
                    if (j === i) {
                        card.flip();
                    }
                    this._tableauPiles[i].push(card);
                }
            }
        }
    }

    drawCard() {
        const card = this._deck.drawCard();
        if (!card) {
            return false;
        }
        card.flip();
        this._deck.discardPile.push(card);
        return true;
    }

    shuffleDiscardPile() {
        if (this._deck.drawPile.length > 0) {
            return false;
        }
        this._deck.shuffleInDiscardPile();
        return true;
    }

    playDiscardPileCardToFoundation() {
        const card = this._deck.discardPile[this._deck.discardPile.length - 1];
        if (!card) {
            return false;
        }

        if (!this.isValidFoundationMove(card)) {
            return false;
        }

        this.addCardToFoundationPile(card);
        this._deck.discardPile.pop();

        return true;
    }
    playDiscardPileCardToTableau(targetTableauIndex: number) {
        const card = this._deck.discardPile[this._deck.discardPile.length - 1];
        if (!card) {
            return false;
        }

        const targetTableauPile = this._tableauPiles[targetTableauIndex];

        if (!this.isValidTableauMove(card, targetTableauPile)) {
            return false;
        }

        this._tableauPiles[targetTableauIndex].push(card);
        this._deck.discardPile.pop();

        return true;
    }

    moveTableauCardToFoundation(tableauPileIndex: number) {
        const tableauPile = this._tableauPiles[tableauPileIndex];
        const card = tableauPile[tableauPile.length - 1];
        if (!card) {
            return false;
        }

        if (!this.isValidFoundationMove(card)) {
            return false;
        }

        this.addCardToFoundationPile(card);
        tableauPile.pop();

        return true

    }

    moveTableauCardToTableau(sourceTableauIndex: number, cardIndex: number, targetTableauIndex: number) {
        const sourceTableauPile = this._tableauPiles[sourceTableauIndex];
        const  targetTableauPile = this._tableauPiles[targetTableauIndex];
        if(sourceTableauPile === undefined || targetTableauPile === undefined) {
            return false;
        }

        const card = sourceTableauPile[cardIndex];
        if (!card) {
            return false;
        }

        if(!card.isFaceUp) {
            return false;
        }

        if(!this.isValidTableauMove(card, targetTableauPile)) {
            return false;
        }

        const cardsToMove = sourceTableauPile.splice(cardIndex);
        targetTableauPile.push(...cardsToMove);

        return true;

    }

    flipTableauCard(tableauPileIndex: number) {
        const tableauPile = this._tableauPiles[tableauPileIndex];
        const card = tableauPile[tableauPile.length - 1];
        if (!card) {
            return false;
        }

        if(card.isFaceUp) {
            return false;
        }

        card.flip();
        return true;
    }

    private isValidFoundationMove(card: Card) {
        const foundationPile = this.foundationPiles.find(pile => pile.suit === card.suit);
        if (!foundationPile) {
            return false;
        }

        return card.value === foundationPile.value + 1;
    }

    private addCardToFoundationPile(card: Card) {
        const foundationPile = this.foundationPiles.find(pile => pile.suit === card.suit);
        if (!foundationPile) {
            return;
        }
        foundationPile.addCard();
    }

    private isValidTableauMove(card: Card, targetTableauPile: Card[]) {
        // empty pile can only accept a king
        if (targetTableauPile.length === 0) {
            return card.value === 13;
        }
        const lastTableauCard = targetTableauPile[targetTableauPile.length - 1];
        // if last card is an ace, cannot accept any card
        if (lastTableauCard.value === 1) {
            return false;
        }

        if (lastTableauCard.colour === card.colour) {
            return false;
        }
        if (lastTableauCard.value !== card.value + 1) {
            return false;
        }
        return true;
    }
}