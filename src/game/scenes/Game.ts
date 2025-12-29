import * as Phaser from 'phaser';
import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS } from './common';
import { Solitaire } from '../lib/solitaire';
import { Card } from '../lib/card';
import { FoundationPile } from '../lib/foundation-pile';

const DEBUG = false;
const SCALE = 1.5;
const CARD_BACK_FRAME = 52;
const SUIT_FRAMES = {
    HEART: 26,
    DIAMOND: 13,
    SPADE: 39,
    CLUB: 0
}

const FOUNDATION_PILE_X_POSITIONS = [360, 425, 490, 555];
const FOUNDATION_PILE_Y_POSITION = 5;
const DISCARD_PILE_X_POSITION = 85;
const DISCARD_PILE_Y_POSITION = 5;
const STOCK_PILE_X_POSITION = 5;
const STOCK_PILE_Y_POSITION = 5;
const TABLEAU_PILE_X_POSITION = 40;
const TABLEAU_PILE_Y_POSITION = 92;
const MAX_TABLEAU_HEIGHT = 268; // Maximum available height for tableau piles
const MAX_CARD_SPACING = 20; // Maximum spacing between cards
const MIN_CARD_SPACING = 12; // Minimum spacing when compressed

type ZoneType = keyof typeof ZONE_TYPE;

const ZONE_TYPE = {
    FOUNDATION: 'FOUNDATION',
    TABLEAU: 'TABLEAU'
} as const;

export class GameScene extends Phaser.Scene {
    drawPileCards: Phaser.GameObjects.Image[] = [];
    discardPileCards: Phaser.GameObjects.Image[] = [];
    foundationPileCards: Phaser.GameObjects.Image[] = [];
    tableauContainers: Phaser.GameObjects.Container[] = [];

    private solitaire = new Solitaire();

    constructor() {
        super({ key: SCENE_KEYS.GAME });
    }

    create() {
        this.solitaire.newGame();

        this.makeDrawPile();
        this.makeDiscardPile();
        this.makeFoundationPiles();
        this.makeTableauPiles();
        this.createDragEvents();
        this.createDropZones();
    }

    private makeDrawPile() {
        this.createLocationBox(STOCK_PILE_X_POSITION, STOCK_PILE_Y_POSITION);

        for (let i = 0; i < 3; i++) {
            const card = this.createCard(STOCK_PILE_X_POSITION + i * 5, STOCK_PILE_Y_POSITION, false);
            this.drawPileCards.push(card);
        }

        const drawZone = this.add.zone(0, 0, CARD_WIDTH * SCALE + 20, CARD_HEIGHT * SCALE + 12).setOrigin(0).setInteractive();

        drawZone.on(Phaser.Input.Events.POINTER_DOWN, () => {
            if (this.solitaire.drawPile.length === 0 && this.solitaire.discardPile.length === 0) {
                return;
            }

            if (this.solitaire.drawPile.length === 0) {
                this.solitaire.shuffleDiscardPile();
                // set visibility to false on each card in discard pile
                this.discardPileCards.forEach(card => card.setVisible(false));
                this.showCardsInDrawPile();
                return;
            }

            this.solitaire.drawCard();
            this.showCardsInDrawPile();

            this.discardPileCards[0].setFrame(this.discardPileCards[1].frame).setVisible(this.discardPileCards[1].visible);
            const card = this.solitaire.discardPile[this.solitaire.discardPile.length - 1];
            this.discardPileCards[1].setFrame(this.getCardFrame(card)).setVisible(true);
        });

        if (DEBUG) {
            this.add.rectangle(drawZone.x, drawZone.y, drawZone.width, drawZone.height, 0xff0000, 0.5).setOrigin(0);
        }
    }

    private getCardFrame(data: Card | FoundationPile) {
        if (data.suit === null) {
            return CARD_BACK_FRAME; // Fallback for unassigned foundation piles
        }
        return SUIT_FRAMES[data.suit] + (data.value - 1);
    }

    private showCardsInDrawPile() {
        const numOfCardsToShow = Math.min(this.solitaire.drawPile.length, 3);
        this.drawPileCards.forEach((card, index) => {
            const showCard = index < numOfCardsToShow;
            card.setVisible(showCard);
        });
    }

    private makeDiscardPile() {
        this.createLocationBox(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION);
        const bottomCard = this.createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION).setVisible(false);
        const topCard = this.createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION).setVisible(false);
        this.discardPileCards.push(bottomCard, topCard);
    }

    private makeFoundationPiles() {
        FOUNDATION_PILE_X_POSITIONS.forEach(x => {
            this.createLocationBox(x, FOUNDATION_PILE_Y_POSITION);
            const card = this.createCard(x, FOUNDATION_PILE_Y_POSITION, false).setVisible(false);
            this.foundationPileCards.push(card);
        });
    }

    private createLocationBox(x: number, y: number) {
        this.add.rectangle(x, y, 56, 78).setOrigin(0).setStrokeStyle(2, 0x000000, .5);
    }

    private createCard(x: number, y: number, draggable: boolean = true, cardIndex?: number, pileIndex?: number) {
        return this.add.image(x, y, ASSET_KEYS.CARDS, CARD_BACK_FRAME).setOrigin(0).setScale(SCALE).setInteractive({
            draggable
        }).setData({
            x,
            y,
            cardIndex,
            pileIndex
        })
    }

    private calculateCardSpacing(pileSize: number): number {
        if (pileSize <= 1) return 0;

        // Calculate the required height for all cards with max spacing
        const cardHeight = CARD_HEIGHT * SCALE;
        const requiredHeight = cardHeight + (pileSize - 1) * MAX_CARD_SPACING;

        // If it fits, use max spacing
        if (requiredHeight <= MAX_TABLEAU_HEIGHT) {
            return MAX_CARD_SPACING;
        }

        // Otherwise, calculate compressed spacing
        const availableSpaceForSpacing = MAX_TABLEAU_HEIGHT - cardHeight;
        const spacing = Math.floor(availableSpaceForSpacing / (pileSize - 1));

        // Ensure spacing doesn't go below minimum
        return Math.max(spacing, MIN_CARD_SPACING);
    }

    private makeTableauPiles() {
        this.tableauContainers = [];

        this.solitaire.tableauPiles.forEach((pile, pileIndex) => {
            const tableauContainer = this.add.container(TABLEAU_PILE_X_POSITION + pileIndex * 85, TABLEAU_PILE_Y_POSITION, []);
            this.tableauContainers.push(tableauContainer);

            const spacing = this.calculateCardSpacing(pile.length);

            pile.forEach((card, cardIndex) => {
                const cardGameObject = this.createCard(0, cardIndex * spacing, card.isFaceUp, cardIndex, pileIndex);
                tableauContainer.add(cardGameObject);
                if (card.isFaceUp) {
                    cardGameObject.setFrame(this.getCardFrame(card));
                }

            });
        });
    }

    private createDragEvents() {
        this.createDragStartEventListener();
        this.createDragEventListener();
        this.createDragEndEventListener();
        this.createDropEventListeners();
    }

    private createDragStartEventListener() {
        this.input.on(Phaser.Input.Events.DRAG_START, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
            gameObject.setData({ x: gameObject.x, y: gameObject.y });
            const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
            if (tableauPileIndex !== undefined) {
                // Set all other tableau containers to base depth
                this.tableauContainers.forEach((container, index) => {
                    container.setDepth(index === tableauPileIndex ? 1 : 0);
                });
            } else {
                // Dragging from discard pile - reset all tableau containers to base depth
                this.tableauContainers.forEach(container => container.setDepth(0));
                gameObject.setDepth(1);
            }
            gameObject.setAlpha(0.8);
        });
    }

    private createDragEventListener() {
        this.input.on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
            this.updateCardPosition(gameObject, dragX, dragY, 0.8);
        });
    }

    private updateCardPosition(gameObject: Phaser.GameObjects.Image, x: number, y: number, alpha: number) {
        const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
        if (tableauPileIndex !== undefined) {
            this.updateTableauCardsPosition(gameObject, x, y, alpha, tableauPileIndex);
        } else {
            // Handle discard pile and other cards
            gameObject.setPosition(x, y);
            gameObject.setAlpha(alpha);
        }
    }

    private updateTableauCardsPosition(gameObject: Phaser.GameObjects.Image, x: number, y: number, alpha: number, tableauPileIndex: number) {
        const cardIndex = gameObject.getData('cardIndex') as number;
        const container = this.tableauContainers[tableauPileIndex];
        const numberOfCardsToMove = container.length - cardIndex;
        const spacing = this.calculateCardSpacing(container.length);

        for (let i = 0; i < numberOfCardsToMove; i++) {
            const cardBelow = container.getAt<Phaser.GameObjects.Image>(cardIndex + i);
            cardBelow.setPosition(x, y + i * spacing);
            cardBelow.setAlpha(alpha);
        }
    }

    private createDragEndEventListener() {
        this.input.on(Phaser.Input.Events.DRAG_END, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dropped: boolean) => {
            const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
            if (tableauPileIndex !== undefined) {
                // Reset all tableau containers to base depth
                this.tableauContainers.forEach(container => container.setDepth(0));
            } else {
                gameObject.setDepth(0);
            }
            if (gameObject.active) {
                this.updateCardPosition(
                    gameObject,
                    gameObject.getData('x') as number,
                    gameObject.getData('y') as number,
                    1
                );
            }
        });
    }

    private createDropZones() {
        // Create 4 separate foundation zones
        for (let i = 0; i < 4; i++) {
            const zone = this.add.zone(FOUNDATION_PILE_X_POSITIONS[i], FOUNDATION_PILE_Y_POSITION, 65, 85).setOrigin(0).setRectangleDropZone(65, 85).setData({
                zoneType: ZONE_TYPE.FOUNDATION,
                pileIndex: i
            });

            if (DEBUG) {
                this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0xff0000, 0.2).setOrigin(0);
            }
        }

        // add zones for tableau piles
        for (let i = 0; i < 7; i++) {
            const zone = this.add.zone(30 + i * 85, TABLEAU_PILE_Y_POSITION, 75.5, 268).setOrigin(0).setRectangleDropZone(75.5, 268).setData({
                zoneType: ZONE_TYPE.TABLEAU,
                pileIndex: i
            }).setDepth(-1);
            if (DEBUG) {
                this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0xff0000f, 0.2).setOrigin(0);
            }
        }
    }

    private createDropEventListeners() {
        this.input.on(Phaser.Input.Events.DROP, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dropZone: Phaser.GameObjects.Zone) => {
            const zoneType = dropZone.getData('zoneType') as ZoneType;
            if (zoneType === ZONE_TYPE.FOUNDATION) {
                const targetFoundationIndex = dropZone.getData('pileIndex') as number;
                this.handleMoveCardToFoundation(gameObject, targetFoundationIndex);
            } else if (zoneType === ZONE_TYPE.TABLEAU) {
                const targetTableauIndex = dropZone.getData('pileIndex') as number;
                this.handleMoveCardToTableau(gameObject, targetTableauIndex);
            }
        });
    }

    private handleMoveCardToFoundation(card: Phaser.GameObjects.Image, targetFoundationIndex: number) {
        let isValidMove = false;
        let isCardFomDiscardPile = false;

        const tableauPileIndex = card.getData('pileIndex') as number | undefined;
        if (tableauPileIndex === undefined) {
            isValidMove = this.solitaire.playDiscardPileCardToFoundation(targetFoundationIndex);
            isCardFomDiscardPile = true;
        } else {
            isValidMove = this.solitaire.moveTableauCardToFoundation(tableauPileIndex, targetFoundationIndex);
        }
        if (!isValidMove) {
            return;
        }

        if (isCardFomDiscardPile) {
            this.updateCardGameObjectsInDiscardPile();
        } else {
            this.handleRevealingNewTableauCards(tableauPileIndex as number);
            card.destroy();
        }
        this.updateFoundationPiles();
    }
    private handleMoveCardToTableau(gameObject: Phaser.GameObjects.Image, targetTableauIndex: number) {
        let isValidMove = false;
        let isCardFromDiscardPile = false;

        const sourceTableauIndex = gameObject.getData('pileIndex') as number | undefined;
        const cardIndex = gameObject.getData('cardIndex') as number;

        const originalPileSize = this.tableauContainers[targetTableauIndex].length;

        if (sourceTableauIndex === undefined) {
            isValidMove = this.solitaire.playDiscardPileCardToTableau(targetTableauIndex);
            isCardFromDiscardPile = true;
        } else {
            isValidMove = this.solitaire.moveTableauCardToTableau(sourceTableauIndex, cardIndex, targetTableauIndex);
        }
        if (!isValidMove) {
            return;
        }

        if (isCardFromDiscardPile) {
            const newPileSize = originalPileSize + 1;
            const spacing = this.calculateCardSpacing(newPileSize);
            const newCard = this.createCard(0, originalPileSize * spacing, true, originalPileSize, targetTableauIndex);
            newCard.setFrame(gameObject.frame);
            this.tableauContainers[targetTableauIndex].add(newCard);
            this.repositionTableauCards(targetTableauIndex);
            this.updateCardGameObjectsInDiscardPile();
            return;
        } else {
            // from tableau to tableau
            // number of cards to move
            const numberOfCardsToMove = this.tableauContainers[sourceTableauIndex as number].length - cardIndex;
            for (let i = 0; i < numberOfCardsToMove; i++) {
                const container = this.tableauContainers[sourceTableauIndex as number];
                const cardToMove = container.getAt<Phaser.GameObjects.Image>(cardIndex);
                container.removeAt(cardIndex);
                this.tableauContainers[targetTableauIndex].add(cardToMove);
                const newCardIndex = originalPileSize + i;
                cardToMove.setData({
                    x: 0,
                    y: 0, // Will be repositioned by repositionTableauCards
                    cardIndex: newCardIndex,
                    pileIndex: targetTableauIndex
                });
            }
            // Reposition cards in both piles with new spacing
            this.repositionTableauCards(targetTableauIndex);
            this.repositionTableauCards(sourceTableauIndex as number);
            // set depths
            this.tableauContainers[sourceTableauIndex as number].setDepth(0);
            this.handleRevealingNewTableauCards(sourceTableauIndex as number);
        }
    }

    private updateCardGameObjectsInDiscardPile() {
        // discardPileCards[1] = top card, discardPileCards[0] = bottom card
        const cardMappings = [
            { gameObjectIndex: 1, pileOffset: 1 }, // top card
            { gameObjectIndex: 0, pileOffset: 2 }  // bottom card
        ];

        cardMappings.forEach(({ gameObjectIndex, pileOffset }) => {
            const card = this.solitaire.discardPile[this.solitaire.discardPile.length - pileOffset];
            if (card === undefined) {
                this.discardPileCards[gameObjectIndex].setVisible(false);
            } else {
                this.discardPileCards[gameObjectIndex].setVisible(true).setFrame(this.getCardFrame(card));
            }
        });
    }
    private handleRevealingNewTableauCards(sourceTableauIndex: number) {
        const wasFlipped = this.solitaire.flipTableauCard(sourceTableauIndex);
        if (!wasFlipped) {
            return;
        }

        const tableauPile = this.solitaire.tableauPiles[sourceTableauIndex];
        const card = tableauPile[tableauPile.length - 1];
        const cardGameObject = this.tableauContainers[sourceTableauIndex].getAt<Phaser.GameObjects.Image>(tableauPile.length - 1);
        cardGameObject.setFrame(this.getCardFrame(card));
        this.input.setDraggable(cardGameObject);
    }

    private repositionTableauCards(pileIndex: number) {
        const container = this.tableauContainers[pileIndex];
        const spacing = this.calculateCardSpacing(container.length);

        for (let i = 0; i < container.length; i++) {
            const card = container.getAt<Phaser.GameObjects.Image>(i);
            const yPos = i * spacing;
            card.setPosition(0, yPos);
            card.setData({
                x: 0,
                y: yPos,
                cardIndex: i,
                pileIndex: pileIndex
            });
        }
    }

    private updateFoundationPiles() {
        this.solitaire.foundationPiles.forEach((pile, index) => {
            if (pile.value === 0) {
                return;
            } else {
                this.foundationPileCards[index].setVisible(true).setFrame(this.getCardFrame(pile));
            }
        });
    }
}