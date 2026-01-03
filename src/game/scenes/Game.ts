import * as Phaser from 'phaser';
import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS, SCALE, CARD_BACK_FRAME, SUIT_FRAMES } from './common';
import { Solitaire } from '../lib/solitaire';
import { Card } from '../lib/card';
import { CardValue } from '../lib/common';
import { FoundationPile } from '../lib/foundation-pile';
import { WinPopup } from './WinPopup';

const DEBUG = false;
const FOUNDATION_PILE_X_POSITIONS = [360, 425, 490, 555];
const FOUNDATION_PILE_Y_POSITION = 5;
const DISCARD_PILE_X_POSITION = 85;
const DISCARD_PILE_Y_POSITION = 5;
const STOCK_PILE_X_POSITION = 5;
const STOCK_PILE_Y_POSITION = 5;
const TABLEAU_PILE_X_POSITION = 40;
const TABLEAU_PILE_Y_POSITION = 92;
const MAX_CARD_SPACING = 25; // Maximum spacing between cards - increased for better spread
const MIN_CARD_SPACING = 8; // Minimum spacing when heavily compressed

type ZoneType = keyof typeof ZONE_TYPE;

const ZONE_TYPE = {
    FOUNDATION: 'FOUNDATION',
    TABLEAU: 'TABLEAU'
} as const;

export class GameScene extends Phaser.Scene {
    drawPileCards: Phaser.GameObjects.Image[] = [];
    discardPileCards: Phaser.GameObjects.Image[] = [];
    foundationPileCards: Phaser.GameObjects.Image[][] = [];
    tableauContainers: Phaser.GameObjects.Container[] = [];
    private recycleCircle!: Phaser.GameObjects.Arc;
    private tableauPlaceholders: Phaser.GameObjects.Rectangle[] = [];
    private maxTableauHeight: number = 0;

    private solitaire = new Solitaire();
    private timerText!: Phaser.GameObjects.Text;
    private movesText!: Phaser.GameObjects.Text;
    private stockText!: Phaser.GameObjects.Text;
    private bottomBarBg!: Phaser.GameObjects.Rectangle;
    private restartButton!: Phaser.GameObjects.Rectangle;
    private restartButtonText!: Phaser.GameObjects.Text;
    private elapsedSeconds = 0;
    private timerEvent?: Phaser.Time.TimerEvent;
    private gameCompleted = false;
    private moveCount = 0;

    constructor() {
        super({ key: SCENE_KEYS.GAME });
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Reset all arrays
        this.drawPileCards = [];
        this.discardPileCards = [];
        this.foundationPileCards = [];
        this.tableauContainers = [];
        this.tableauPlaceholders = [];

        // Reset game state
        this.solitaire = new Solitaire();
        this.solitaire.newGame();
        this.elapsedSeconds = 0;
        this.gameCompleted = false;
        this.moveCount = 0;

        // Calculate maximum tableau height based on screen dimensions
        const { height } = this.scale;
        const BOTTOM_BAR_HEIGHT = 22;
        this.maxTableauHeight = height - TABLEAU_PILE_Y_POSITION - BOTTOM_BAR_HEIGHT - 10; // 10px padding

        this.makeDrawPile();
        this.makeDiscardPile();
        this.makeFoundationPiles();
        this.makeTableauPiles();
        this.createDragEvents();
        this.createDropZones();
        this.createBottomBar();
        this.setupDebugKeys();

    }

    private setupDebugKeys() {
        // Press 'W' to simulate win for testing TODO REmove before production
        this.input.keyboard?.on('keydown-W', () => {
            if (this.gameCompleted) return;

            // Set all foundation piles to King (13)
            this.solitaire.foundationPiles.forEach(pile => {
                pile.assignSuit('HEART'); // Assign any suit
                for (let i = pile.value; i < 13; i++) {
                    pile.addCard();
                }
            });

            this.updateFoundationPiles();
        });

        // Press 'M' to test max cards scenario (rightmost pile: 6 face down + K→A face up = 19 cards)
        this.input.keyboard?.on('keydown-M', () => {
            console.log('🧪 Testing WORST CASE: 19 cards (6 face down + 13 face up)...');

            // Clear the rightmost tableau pile (index 6)
            const pileIndex = 6;
            this.solitaire.tableauPiles[pileIndex] = [];

            // Add 6 face-down cards first
            for (let i = 0; i < 6; i++) {
                const suit: 'HEART' | 'SPADE' = i % 2 === 0 ? 'HEART' : 'SPADE';
                const card = new Card(suit, 1 as CardValue, false); // Face down, value doesn't matter
                this.solitaire.tableauPiles[pileIndex].push(card);
            }

            // Add K through A (13 cards) all face up
            for (let value = 13; value >= 1; value--) {
                const suit: 'HEART' | 'SPADE' = value % 2 === 0 ? 'HEART' : 'SPADE'; // Alternate red/black
                const card = new Card(suit, value as CardValue, true);
                this.solitaire.tableauPiles[pileIndex].push(card);
            }

            // Rebuild the visual pile
            const container = this.tableauContainers[pileIndex];
            container.removeAll(true);

            const pile = this.solitaire.tableauPiles[pileIndex];
            const spacing = this.calculateCardSpacing(pile.length);
            const totalHeight = 78 + (pile.length - 1) * spacing;
            console.log(`📏 ${pile.length} cards with ${spacing}px spacing = ${totalHeight}px total height`);
            console.log(`📐 Available height: ${this.maxTableauHeight}px`);
            console.log(`${totalHeight > this.maxTableauHeight ? '❌ OVERFLOW by ' + (totalHeight - this.maxTableauHeight) + 'px!' : '✅ FITS!'}`);

            pile.forEach((card, cardIndex) => {
                const cardGameObject = this.createCard(0, cardIndex * spacing, card.isFaceUp, cardIndex, pileIndex);
                container.add(cardGameObject);
                if (card.isFaceUp) {
                    cardGameObject.setFrame(this.getCardFrame(card));
                }
            });
        });
    }

    private createBottomBar() {
        const { width, height } = this.scale;
        const barHeight = 22;
        const barY = height - barHeight / 2;

        // Retro gray background bar
        this.bottomBarBg = this.add.rectangle(0, height - barHeight, width, barHeight, 0x808080)
            .setOrigin(0, 0)
            .setDepth(1);

        const textStyle = {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        };

        // Moves counter on the left
        this.movesText = this.add.text(10, barY, 'Moves: 0', textStyle)
            .setOrigin(0, 0.5)
            .setDepth(1);

        // Timer on the right side
        this.timerText = this.add.text(width - 10, barY, 'Time: 0', textStyle)
            .setOrigin(1, 0.5)
            .setDepth(1);

        // Restart button in the center
        const buttonWidth = 90;
        const buttonHeight = 18;
        const centerX = width / 2;

        this.restartButton = this.add.rectangle(centerX, barY, buttonWidth, buttonHeight, 0x606060)
            .setStrokeStyle(1, 0x404040)
            .setInteractive({ useHandCursor: true })
            .setDepth(1);

        this.restartButtonText = this.add.text(centerX, barY, 'New Game', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);

        // Button hover effects
        this.restartButton.on('pointerover', () => {
            this.restartButton.setFillStyle(0x707070);
        });

        this.restartButton.on('pointerout', () => {
            this.restartButton.setFillStyle(0x606060);
        });

        // Button click handler
        this.restartButton.on('pointerdown', () => {
            this.scene.restart();
        });

        // Stock pile count (hidden by default for retro look)
        this.stockText = this.add.text(-1000, -1000, '', textStyle)
            .setDepth(101);

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.updateStockDisplay();
    }

    private updateTimer() {
        if (this.gameCompleted) {
            return;
        }

        this.elapsedSeconds++;
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText(`Time: ${formattedTime}`);
    }

    private incrementMoveCount() {
        this.moveCount++;
        this.movesText.setText(`Moves: ${this.moveCount}`);
    }

    private updateStockDisplay() {
        const stockCount = this.solitaire.drawPile.length;
        this.stockText.setText(`${stockCount} Stock`);
    }

    private makeDrawPile() {
        this.createLocationBox(STOCK_PILE_X_POSITION, STOCK_PILE_Y_POSITION);

        // Create green recycle circle (hidden initially)
        const centerX = STOCK_PILE_X_POSITION + (CARD_WIDTH * SCALE) / 2;
        const centerY = STOCK_PILE_Y_POSITION + (CARD_HEIGHT * SCALE) / 2;
        this.recycleCircle = this.add.circle(centerX, centerY, 15)
            .setStrokeStyle(5, 0x00ff00)
            .setFillStyle(0x00ff00, 0)
            .setVisible(false);

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
            this.updateStockDisplay();

            this.discardPileCards[0].setFrame(this.discardPileCards[1].frame).setVisible(this.discardPileCards[1].visible);
            const card = this.solitaire.discardPile[this.solitaire.discardPile.length - 1];
            this.discardPileCards[1].setFrame(this.getCardFrame(card)).setVisible(true);
        });

        if (DEBUG) {
            this.add.rectangle(drawZone.x, drawZone.y, drawZone.width, drawZone.height, 0xff0000, 0.2).setOrigin(0);
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

        // Show green circle when draw pile is empty and there are cards to recycle
        const showRecycleCircle = this.solitaire.drawPile.length === 0 && this.solitaire.discardPile.length > 0;
        this.recycleCircle.setVisible(showRecycleCircle);
    }

    private makeDiscardPile() {
        this.createLocationBox(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION);
        const bottomCard = this.createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION).setVisible(false).setData({ isDiscardPile: true });
        const topCard = this.createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION).setVisible(false).setData({ isDiscardPile: true });
        this.discardPileCards.push(bottomCard, topCard);
    }

    private makeFoundationPiles() {
        FOUNDATION_PILE_X_POSITIONS.forEach((x, index) => {
            this.createLocationBox(x, FOUNDATION_PILE_Y_POSITION);
            const bottomCard = this.createCard(x, FOUNDATION_PILE_Y_POSITION, false).setVisible(false).setData({
                pileType: ZONE_TYPE.FOUNDATION,
                foundationIndex: index
            })
            const topCard = this.createCard(x, FOUNDATION_PILE_Y_POSITION, true).setVisible(false).setData({
                pileType: ZONE_TYPE.FOUNDATION,
                foundationIndex: index
            })
            this.foundationPileCards.push([bottomCard, topCard]);
            this.input.setDraggable(topCard);
        });
    }

    private createLocationBox(x: number, y: number) {
        return this.add.rectangle(x, y, 56, 78).setOrigin(0).setStrokeStyle(2, 0x000000, .5);
    }

    private createCard(x: number, y: number, draggable: boolean = true, cardIndex?: number, pileIndex?: number) {
        const card = this.add.image(x, y, ASSET_KEYS.CARDS, CARD_BACK_FRAME).setOrigin(0).setScale(SCALE).setInteractive({
            draggable
        }).setData({
            x,
            y,
            cardIndex,
            pileIndex
        })

        if (draggable) {
            card.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
                // If the card was moved less than 5 pixels, treat it as a click
                if (pointer.getDistance() < 5) {
                    this.handleCardClick(card);
                }
            });
        }

        return card;
    }

    private calculateCardSpacing(pileSize: number): number {
        if (pileSize <= 1) return 0;

        const cardHeight = CARD_HEIGHT * SCALE;

        // Calculate ideal spacing with max spacing
        const idealHeight = cardHeight + (pileSize - 1) * MAX_CARD_SPACING;
        if (idealHeight <= this.maxTableauHeight) {
            return MAX_CARD_SPACING;
        }

        // Calculate compressed spacing to fit available space
        const availableSpaceForSpacing = this.maxTableauHeight - cardHeight;
        const calculatedSpacing = availableSpaceForSpacing / (pileSize - 1);

        // Use calculated spacing, but don't go below minimum
        const spacing = Math.max(calculatedSpacing, MIN_CARD_SPACING);

        return Math.floor(spacing);
    }

    private makeTableauPiles() {
        this.tableauContainers = [];

        this.solitaire.tableauPiles.forEach((pile, pileIndex) => {
            // Create placeholder box for empty piles
            const placeholder = this.createLocationBox(
                TABLEAU_PILE_X_POSITION + pileIndex * 85,
                TABLEAU_PILE_Y_POSITION
            );
            this.tableauPlaceholders.push(placeholder);

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
        this.input.on(Phaser.Input.Events.DRAG_START, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
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
        this.input.on(Phaser.Input.Events.DRAG, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
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
        this.input.on(Phaser.Input.Events.DRAG_END, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, _dropped: boolean) => {
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
            // add start width using the width of the card instead of padding for the first item
            // don't add zone padding to the end of the last zone
            const zonePadding = i === 0 ? 0 : 10;
            const extraCardWidth = i === 0 ? CARD_WIDTH * SCALE : 0;
            const extraEndWidth = i === 3 ? zonePadding + 2 : 0; // Extra width for last zone
            const zone = this.add.zone(FOUNDATION_PILE_X_POSITIONS[i] - zonePadding - extraCardWidth, FOUNDATION_PILE_Y_POSITION, 56 + zonePadding + extraEndWidth + extraCardWidth, 78).setOrigin(0).setRectangleDropZone(56 + zonePadding + extraEndWidth + extraCardWidth, 78).setDepth(-1).setData({
                zoneType: ZONE_TYPE.FOUNDATION,
                pileIndex: i
            });

            if (DEBUG) {
                this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0xff0000, 0.2).setOrigin(0);
            }
        }

        // add zones for tableau piles
        for (let i = 0; i < 7; i++) {
            const zone = this.add.zone(30 + i * 85, TABLEAU_PILE_Y_POSITION, 75.5, this.maxTableauHeight).setOrigin(0).setRectangleDropZone(75.5, this.maxTableauHeight).setData({
                zoneType: ZONE_TYPE.TABLEAU,
                pileIndex: i
            }).setDepth(-1);
            if (DEBUG) {
                this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0xff0000f, 0.2).setOrigin(0);
            }
        }
    }

    private createDropEventListeners() {
        this.input.on(Phaser.Input.Events.DROP, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dropZone: Phaser.GameObjects.Zone) => {
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
        let isCardFromFoundation = false;

        const tableauPileIndex = card.getData('pileIndex') as number | undefined;
        const cardIndex = card.getData('cardIndex') as number | undefined;
        const foundationIndex = card.getData('foundationIndex') as number | undefined;

        if (foundationIndex !== undefined) {
            // From foundation pile to foundation pile
            isValidMove = this.solitaire.moveFoundationCardToFoundation(foundationIndex, targetFoundationIndex);
            isCardFromFoundation = true;
        } else if (tableauPileIndex === undefined) {
            isValidMove = this.solitaire.playDiscardPileCardToFoundation(targetFoundationIndex);
            isCardFomDiscardPile = true;
        } else {
            // Only allow moving the top card from tableau to foundation (no stacks)
            const tableauPile = this.tableauContainers[tableauPileIndex];
            if (cardIndex !== tableauPile.length - 1) {
                // Not the top card - multiple cards being dragged, which is invalid
                return;
            }
            isValidMove = this.solitaire.moveTableauCardToFoundation(tableauPileIndex, targetFoundationIndex);
        }
        if (!isValidMove) {
            return;
        }

        this.incrementMoveCount();

        if (isCardFomDiscardPile) {
            this.updateCardGameObjectsInDiscardPile();
        } else if (isCardFromFoundation) {
            this.updateFoundationPiles();
        } else {
            this.handleRevealingNewTableauCards(tableauPileIndex as number);
            card.destroy();
        }
        this.updateFoundationPiles();
    }
    private handleMoveCardToTableau(gameObject: Phaser.GameObjects.Image, targetTableauIndex: number) {
        let isValidMove = false;
        let isCardFromDiscardPile = false;
        let isCardFromFoundation = false;

        const sourceTableauIndex = gameObject.getData('pileIndex') as number | undefined;
        const foundationIndex = gameObject.getData('foundationIndex') as number | undefined;
        const cardIndex = gameObject.getData('cardIndex') as number;

        const originalPileSize = this.tableauContainers[targetTableauIndex].length;

        if (foundationIndex !== undefined) {
            // From foundation pile
            isValidMove = this.solitaire.moveFoundationCardToTableau(foundationIndex, targetTableauIndex);
            isCardFromFoundation = true;
        } else if (sourceTableauIndex === undefined) {
            // From discard pile
            isValidMove = this.solitaire.playDiscardPileCardToTableau(targetTableauIndex);
            isCardFromDiscardPile = true;
        } else {
            // From tableau to tableau
            isValidMove = this.solitaire.moveTableauCardToTableau(sourceTableauIndex, cardIndex, targetTableauIndex);
        }
        if (!isValidMove) {
            return;
        }

        this.incrementMoveCount();

        if (isCardFromDiscardPile || isCardFromFoundation) {
            this.addCardToTableauPile(originalPileSize, gameObject.frame, targetTableauIndex);

            if (isCardFromDiscardPile) {
                this.updateCardGameObjectsInDiscardPile();
            } else if (isCardFromFoundation) {
                this.updateFoundationPiles();
            }
            return;
        } else {
            // from tableau to tableau
            this.handleTableauToTableauGameObjects(sourceTableauIndex as number, cardIndex, targetTableauIndex, originalPileSize);
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

        cardGameObject.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
            // If the card was moved less than 1 pixel, treat it as a click
            if (pointer.getDistance() < 5) {
                this.handleCardClick(cardGameObject);
            }
        });
    }

    private handleCardClick(card: Phaser.GameObjects.Image) {
        const tableauPileIndex = card.getData('pileIndex') as number | undefined;
        const cardIndex = card.getData('cardIndex') as number | undefined;
        const foundationIndex = card.getData('foundationIndex') as number | undefined;
        const isDiscardPileCard = card.getData('isDiscardPile') as boolean | undefined;
        let isValidMove = false;

        if (foundationIndex !== undefined) {
            // From foundation pile don't move on click
            return;
        }

        if (tableauPileIndex !== undefined) {
            // From tableau pile - try to move to foundation
            const tableauPile = this.tableauContainers[tableauPileIndex];
            // only allow moving for top facing card
            if (cardIndex === tableauPile.length - 1) {
                for (let i = 0; i < this.solitaire.foundationPiles.length; i++) {
                    isValidMove = this.solitaire.moveTableauCardToFoundation(tableauPileIndex, i);

                    if (isValidMove) {
                        this.incrementMoveCount();
                        this.handleRevealingNewTableauCards(tableauPileIndex as number);
                        card.destroy();
                        this.updateFoundationPiles();
                        return;
                    }
                }
            }

            // not valid move then check tableau to tableau
            if (!isValidMove && cardIndex !== undefined) {
                for (let i = 0; i < this.solitaire.tableauPiles.length; i++) {
                    isValidMove = this.solitaire.moveTableauCardToTableau(tableauPileIndex, cardIndex, i);

                    if (isValidMove) {
                        this.incrementMoveCount();
                        this.handleTableauToTableauGameObjects(tableauPileIndex, cardIndex, i, this.tableauContainers[i].length);
                        return;
                    }
                }
            }

            // No valid move found for tableau card
            this.shakeCard(card);
            return;
        }

        // Only handle discard pile cards from this point
        if (!isDiscardPileCard) {
            return;
        }

        // from discard pile - try to move to foundation
        for (let i = 0; i < this.solitaire.foundationPiles.length; i++) {
            isValidMove = this.solitaire.playDiscardPileCardToFoundation(i);
            if (isValidMove) {
                this.incrementMoveCount();
                this.updateCardGameObjectsInDiscardPile();
                this.updateFoundationPiles();
                return;
            }
        }

        // if still not valid check tableau piles
        for (let i = 0; i < this.solitaire.tableauPiles.length; i++) {
            isValidMove = this.solitaire.playDiscardPileCardToTableau(i);
            if (isValidMove) {
                this.incrementMoveCount();
                this.addCardToTableauPile(this.tableauContainers[i].length, card.frame, i);
                this.updateCardGameObjectsInDiscardPile();
                return;
            }
        }

        // No valid move found - shake the card
        this.shakeCard(card);
    }

    private handleTableauToTableauGameObjects(sourceTableauIndex: number, cardIndex: number, targetTableauIndex: number, originalPileSize: number) {
        const numberOfCardsToMove = this.tableauContainers[sourceTableauIndex].length - cardIndex;
        for (let i = 0; i < numberOfCardsToMove; i++) {
            const container = this.tableauContainers[sourceTableauIndex];
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
        this.repositionTableauCards(sourceTableauIndex);
        // set depths
        this.tableauContainers[sourceTableauIndex].setDepth(0);
        this.handleRevealingNewTableauCards(sourceTableauIndex);
    }

    private addCardToTableauPile(originalPileSize: number, frame: Phaser.Textures.Frame, targetTableauIndex: number) {
        const newPileSize = originalPileSize + 1;
        const spacing = this.calculateCardSpacing(newPileSize);
        const newCard = this.createCard(0, originalPileSize * spacing, true, originalPileSize, targetTableauIndex);
        newCard.setFrame(frame);
        this.tableauContainers[targetTableauIndex].add(newCard);
        this.repositionTableauCards(targetTableauIndex);
    }

    private prepareCardForShake(card: Phaser.GameObjects.Image) {
        card.disableInteractive();

        const originalOriginX = card.originX;
        const originalOriginY = card.originY;
        const originalX = card.x;
        const originalY = card.y;

        // Adjust position when changing origin to keep card in same visual position
        const offsetX = (0.5 - originalOriginX) * card.displayWidth;
        const offsetY = (0.5 - originalOriginY) * card.displayHeight;
        card.setOrigin(0.5, 0.5);
        card.setPosition(originalX + offsetX, originalY + offsetY);

        return { card, originalOriginX, originalOriginY, originalX, originalY };
    }

    private shakeCard(gameObject: Phaser.GameObjects.Image) {
        const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
        const cardIndex = gameObject.getData('cardIndex') as number | undefined;
        const isDiscardPileCard = gameObject.getData('isDiscardPile') as boolean | undefined;

        const cardsToReEnable: Phaser.GameObjects.Image[] = [];
        const cardsToShake: Array<{ card: Phaser.GameObjects.Image, originalOriginX: number, originalOriginY: number, originalX: number, originalY: number }> = [];

        if (tableauPileIndex !== undefined && cardIndex !== undefined) {
            // Handle tableau pile: disable cards below, shake cards from clicked card to top
            const container = this.tableauContainers[tableauPileIndex];

            for (let i = 0; i < cardIndex; i++) {
                const cardBelow = container.getAt<Phaser.GameObjects.Image>(i);
                if (cardBelow.input?.enabled) {
                    cardBelow.disableInteractive();
                    cardsToReEnable.push(cardBelow);
                }
            }

            for (let i = cardIndex; i < container.length; i++) {
                cardsToShake.push(this.prepareCardForShake(container.getAt<Phaser.GameObjects.Image>(i)));
            }
        } else {
            // Handle single card (discard pile or foundation)
            cardsToShake.push(this.prepareCardForShake(gameObject));

            if (isDiscardPileCard) {
                this.discardPileCards.forEach(discardCard => {
                    if (discardCard !== gameObject && discardCard.input?.enabled) {
                        discardCard.disableInteractive();
                        cardsToReEnable.push(discardCard);
                    }
                });
            }
        }

        this.tweens.add({
            targets: cardsToShake.map(c => c.card),
            rotation: { from: -0.04, to: 0.04 },
            duration: 60,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                cardsToShake.forEach(({ card, originalOriginX, originalOriginY, originalX, originalY }) => {
                    card.setRotation(0);
                    card.setOrigin(originalOriginX, originalOriginY);
                    card.setPosition(originalX, originalY);
                    card.setInteractive({ draggable: true });
                });

                cardsToReEnable.forEach(card => {
                    card.setInteractive({ draggable: true });
                });
            }
        });
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
            const [bottomCard, topCard] = this.foundationPileCards[index];

            if (pile.suit === null || pile.value === 0) {
                bottomCard.setVisible(false);
                topCard.setVisible(false);
                return;
            }

            if (pile.value === 1) {
                // Only one card, show only top card
                bottomCard.setVisible(false);
                topCard.setVisible(true).setFrame(this.getCardFrame(pile));
                this.input.setDraggable(topCard);
            } else {
                // Two or more cards, show both bottom and top
                // Bottom card shows the previous card (value - 1)
                const previousCardFrame = SUIT_FRAMES[pile.suit] + (pile.value - 2);
                bottomCard.setVisible(true).setFrame(previousCardFrame);
                topCard.setVisible(true).setFrame(this.getCardFrame(pile));
                this.input.setDraggable(topCard);
            }
        });

        // Check if game is won
        if (!this.gameCompleted && this.solitaire.isWonGame) {
            this.handleGameWon();
        }
    }

    private handleGameWon() {
        this.gameCompleted = true;

        if (this.timerEvent) {
            this.timerEvent.destroy();
        }

        // Hide the bottom bar
        this.bottomBarBg.setVisible(false);
        this.movesText.setVisible(false);
        this.timerText.setVisible(false);
        this.restartButton.setVisible(false);
        this.restartButtonText.setVisible(false);
        

        // Start the cascading card animation
        this.startWinAnimation();

        // Show win popup with stats after a short delay
        this.time.delayedCall(800, () => {
            const minutes = Math.floor(this.elapsedSeconds / 60);
            const seconds = this.elapsedSeconds % 60;
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            new WinPopup(this, this.moveCount, formattedTime);
        });
    }

    private startWinAnimation() {
        let cardDelay = 0;

        // For each foundation pile, cascade cards from K down to A
        this.solitaire.foundationPiles.forEach((pile, pileIndex) => {
            if (pile.suit === null || pile.value === 0) return;

            const pileX = FOUNDATION_PILE_X_POSITIONS[pileIndex];

            // Animate cards from King (13) down to Ace (1)
            for (let cardValue = pile.value; cardValue >= 1; cardValue--) {
                this.time.delayedCall(cardDelay, () => {
                    const card = this.add.image(pileX, FOUNDATION_PILE_Y_POSITION, ASSET_KEYS.CARDS)
                        .setScale(SCALE)
                        .setFrame(SUIT_FRAMES[pile.suit!] + (cardValue - 1))
                        .setDepth(1);

                    // Enable physics for this card
                    this.physics.add.existing(card);
                    const body = card.body as Phaser.Physics.Arcade.Body;

                    // Set initial velocity (shoot upward and to the side)
                    const randomAngle = Phaser.Math.Between(-45, 45);
                    const initialVelocityX = Math.sin(randomAngle * Math.PI / 180) * Phaser.Math.Between(100, 300);
                    const initialVelocityY = -Phaser.Math.Between(200, 400);

                    body.setVelocity(initialVelocityX, initialVelocityY);
                    body.setGravityY(600);
                    body.setBounce(0.7, 0.7);
                    body.setCollideWorldBounds(true);
                    body.setMaxVelocity(500, 1000);
                    body.setAngularVelocity(Phaser.Math.Between(-200, 200));
                });

                cardDelay += 100; // Stagger each card by 100ms
            }
        });
    }
}