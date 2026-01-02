import { Card } from "./card";
import { CARD_SUIT_TO_COLOUR } from "./common";
import { Deck } from "./deck";
import { FoundationPile } from "./foundation-pile";

export class Solitaire {

    private _deck: Deck;
    private _foundationPiles: FoundationPile[];
    private _tableauPiles: Card[][];

    constructor() {
        this._deck = new Deck();
        this._foundationPiles = [
            new FoundationPile(),
            new FoundationPile(),
            new FoundationPile(),
            new FoundationPile()
        ];
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
        return this._foundationPiles;
    }

    get isWonGame() {
        return this._foundationPiles.every(pile => pile.value === 13);
    }

    newGame() {
        this._deck.reset();
        this._foundationPiles.forEach(pile => pile.reset());
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

    playDiscardPileCardToFoundation(targetFoundationIndex: number) {
        const card = this._deck.discardPile[this._deck.discardPile.length - 1];
        if (!card) {
            return false;
        }

        if (!this.isValidTableauToFoundationMove(card, targetFoundationIndex)) {
            return false;
        }

        this.addCardToFoundationPile(card, targetFoundationIndex);
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

    moveTableauCardToFoundation(tableauPileIndex: number, targetFoundationIndex: number) {
        const tableauPile = this._tableauPiles[tableauPileIndex];
        const card = tableauPile[tableauPile.length - 1];
        if (!card) {
            return false;
        }

        if (!this.isValidTableauToFoundationMove(card, targetFoundationIndex)) {
            return false;
        }

        this.addCardToFoundationPile(card, targetFoundationIndex);
        tableauPile.pop();

        return true

    }

    moveTableauCardToTableau(sourceTableauIndex: number, cardIndex: number, targetTableauIndex: number) {
        const sourceTableauPile = this._tableauPiles[sourceTableauIndex];
        const targetTableauPile = this._tableauPiles[targetTableauIndex];
        if (sourceTableauPile === undefined || targetTableauPile === undefined) {
            return false;
        }

        const card = sourceTableauPile[cardIndex];
        if (!card) {
            return false;
        }

        if (!card.isFaceUp) {
            return false;
        }

        if (!this.isValidTableauMove(card, targetTableauPile)) {
            return false;
        }

        const cardsToMove = sourceTableauPile.splice(cardIndex);
        targetTableauPile.push(...cardsToMove);

        return true;

    }

    moveFoundationCardToTableau(foundationIndex: number, targetTableauIndex: number) {
        const foundationPile = this._foundationPiles[foundationIndex];
        const targetTableauPile = this._tableauPiles[targetTableauIndex];

        // Cannot move from empty foundation pile
        if (foundationPile.value === 0 || foundationPile.suit === null) {
            return false;
        }

        const lastTableauCard = targetTableauPile[targetTableauPile.length - 1];

        // If tableau pile is empty, only King (value 13) can be placed
        if (!lastTableauCard) {
            if (foundationPile.value !== 13) {
                return false;
            }
        } else {
            // Tableau pile is not empty - check valid move
            const foundationCardColor = CARD_SUIT_TO_COLOUR[foundationPile.suit];
            if (lastTableauCard.colour === foundationCardColor) {
                return false;
            }

            if (foundationPile.value + 1 !== lastTableauCard.value) {
                return false;
            }
        }

        // Create a card object representing the top card of the foundation pile
        const card = new Card(foundationPile.suit, foundationPile.value);
        card.flip();

        // Perform the move
        targetTableauPile.push(card);
        foundationPile.removeCard();

        return true;
    }

    moveFoundationCardToFoundation(sourceFoundationIndex: number, targetFoundationIndex: number) {
        const sourcePile = this._foundationPiles[sourceFoundationIndex];
        const targetPile = this._foundationPiles[targetFoundationIndex];

        // Can only move aces (value === 1) to empty foundation piles
        if (sourcePile.value !== 1 || sourcePile.suit === null) {
            return false;
        }

        // Target pile must be empty
        if (targetPile.value !== 0 || targetPile.suit !== null) {
            return false;
        }

        // Perform the move
        targetPile.assignSuit(sourcePile.suit);
        targetPile.addCard();
        sourcePile.removeCard();

        return true;
    }

    flipTableauCard(tableauPileIndex: number) {
        const tableauPile = this._tableauPiles[tableauPileIndex];
        const card = tableauPile[tableauPile.length - 1];
        if (!card) {
            return false;
        }

        if (card.isFaceUp) {
            return false;
        }

        card.flip();
        return true;
    }

    private isValidTableauToFoundationMove(card: Card, targetFoundationIndex: number) {
        const targetPile = this._foundationPiles[targetFoundationIndex];

        // If pile is not assigned yet, only accept Aces
        if (!targetPile.isAssigned) {
            return card.value === 1;
        }

        // If pile is assigned, check if card matches suit and is next in sequence
        if (targetPile.suit !== card.suit) {
            return false;
        }

        return card.value === targetPile.value + 1;
    }

    private addCardToFoundationPile(card: Card, targetFoundationIndex: number) {
        const targetPile = this._foundationPiles[targetFoundationIndex];

        // Assign suit if this is the first card (Ace) for this pile
        if (!targetPile.isAssigned && card.value === 1) {
            targetPile.assignSuit(card.suit);
        }

        targetPile.addCard();
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