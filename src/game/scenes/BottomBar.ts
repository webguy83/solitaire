import * as Phaser from 'phaser';
import { COLORS } from './common';
import { CardBackSwatcher } from './CardBackSwatcher';

export class BottomBar {
    private scene: Phaser.Scene;
    private bottomBarBg: Phaser.GameObjects.Rectangle;
    private timerText: Phaser.GameObjects.Text;
    private movesText: Phaser.GameObjects.Text;
    private restartButton: Phaser.GameObjects.Rectangle;
    private restartButtonText: Phaser.GameObjects.Text;
    private swatcher: CardBackSwatcher;
    private timerEvent?: Phaser.Time.TimerEvent;
    private elapsedSeconds: number = 0;
    private moveCount: number = 0;
    private gameCompleted: boolean = false;

    constructor(scene: Phaser.Scene, onRestartCallback: () => void, onCardBackChange: (frame: number) => void, initialCardBackFrame: number = 52) {
        this.scene = scene;
        this.createBottomBar(onRestartCallback, onCardBackChange, initialCardBackFrame);
    }

    private createBottomBar(onRestartCallback: () => void, onCardBackChange: (frame: number) => void, initialCardBackFrame: number) {
        const { width, height } = this.scene.scale;
        const barHeight = 22;
        const barY = height - barHeight / 2;

        // Retro green background bar
        this.bottomBarBg = this.scene.add.rectangle(0, height - barHeight, width, barHeight, COLORS.FELT_DARK)
            .setOrigin(0, 0)
            .setDepth(1);

        const textStyle = {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        };

        // Moves counter on the left
        this.movesText = this.scene.add.text(10, barY, 'Moves: 0', textStyle)
            .setOrigin(0, 0.5)
            .setDepth(1);

        // Timer on the right side
        this.timerText = this.scene.add.text(width - 10, barY, 'Time: 0', textStyle)
            .setOrigin(1, 0.5)
            .setDepth(1);

        // Restart button in the center
        const buttonWidth = 90;
        const buttonHeight = 18;
        const centerX = width / 2;

        this.restartButton = this.scene.add.rectangle(centerX, barY, buttonWidth, buttonHeight, COLORS.SUIT_RED)
            .setStrokeStyle(1, COLORS.WHITE)
            .setInteractive({ useHandCursor: true })
            .setDepth(1);

        this.restartButtonText = this.scene.add.text(centerX, barY, 'New Game', {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            color: `#${COLORS.WHITE.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5).setDepth(1);

        // Button hover effects
        this.restartButton.on('pointerover', () => {
            this.restartButton.setFillStyle(COLORS.SUIT_RED_DARK).setStrokeStyle(1, COLORS.CREAM);
        });

        this.restartButton.on('pointerout', () => {
            this.restartButton.setFillStyle(COLORS.SUIT_RED).setStrokeStyle(1, COLORS.WHITE);
        });

        // Button click handler
        this.restartButton.on('pointerdown', () => {
            onRestartCallback();
        });

        // Card back swatcher (positioned left of restart button)
        const swatcherX = centerX - buttonWidth / 2 - 60;
        this.swatcher = new CardBackSwatcher(this.scene, swatcherX, barY + 1, onCardBackChange, initialCardBackFrame);

        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
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

    incrementMoveCount() {
        this.moveCount++;
        this.movesText.setText(`Moves: ${this.moveCount}`);
    }

    getElapsedSeconds(): number {
        return this.elapsedSeconds;
    }

    getMoveCount(): number {
        return this.moveCount;
    }

    setGameCompleted(completed: boolean) {
        this.gameCompleted = completed;
        this.hide();
    }

    reset() {
        this.elapsedSeconds = 0;
        this.moveCount = 0;
        this.gameCompleted = false;
        this.movesText.setText('Moves: 0');
        this.timerText.setText('Time: 0:00');
    }

    destroy() {
        this.timerEvent?.remove();
        this.bottomBarBg.destroy();
        this.timerText.destroy();
        this.movesText.destroy();
        this.restartButton.destroy();
        this.restartButtonText.destroy();       
         this.swatcher.destroy();    
    }

    private hide() {
        this.bottomBarBg.setVisible(false);
        this.timerText.setVisible(false);
        this.movesText.setVisible(false);
        this.restartButton.setVisible(false);
        this.restartButtonText.setVisible(false);
        this.swatcher.destroy();
    }
}
