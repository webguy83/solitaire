import * as Phaser from 'phaser';
import { ASSET_KEYS, SCALE, SUIT_FRAMES, COLORS } from './common';

export class WinPopup {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, moves: number, time: string) {
        this.scene = scene;
        this.container = this.createPopup(moves, time);
    }

    private createPopup(moves: number, time: string): Phaser.GameObjects.Container {
        const { width, height } = this.scene.scale;
        const container = this.scene.add.container(0, 0).setDepth(2).setAlpha(0);

        // Semi-transparent dark overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0);
        container.add(overlay);

        const centerX = width / 2;
        const centerY = height / 2;

        // Main popup box background
        const boxWidth = 420;
        const boxHeight = 260;
        const popupBox = this.scene.add.rectangle(centerX, centerY, boxWidth, boxHeight, COLORS.WIN_POPUP_BG)
            .setStrokeStyle(4, COLORS.WIN_POPUP_BORDER);
        container.add(popupBox);

        // Inner border for depth
        const innerBox = this.scene.add.rectangle(centerX, centerY, boxWidth - 16, boxHeight - 16, COLORS.WIN_POPUP_BG)
            .setStrokeStyle(2, COLORS.WIN_POPUP_INNER_BORDER);
        container.add(innerBox);

        // Display the four aces at top
        const aceY = centerY - 75;
        const aceSpacing = 55;
        const startX = centerX - (aceSpacing * 1.5);

        const suits: Array<keyof typeof SUIT_FRAMES> = ['HEART', 'DIAMOND', 'CLUB', 'SPADE'];
        suits.forEach((suit, index) => {
            const aceCard = this.scene.add.image(startX + index * aceSpacing, aceY, ASSET_KEYS.CARDS)
                .setOrigin(0.5)
                .setScale(SCALE)
                .setFrame(SUIT_FRAMES[suit]);
            container.add(aceCard);
        });

        // Blue ribbon banner background
        const bannerWidth = 360;
        const bannerHeight = 50;
        const bannerY = centerY - 5;

        // Banner shadow
        const bannerShadow = this.scene.add.rectangle(centerX + 2, bannerY + 2, bannerWidth, bannerHeight, COLORS.WIN_BANNER_DARK)
            .setOrigin(0.5);
        container.add(bannerShadow);

        // Banner main
        const banner = this.scene.add.rectangle(centerX, bannerY, bannerWidth, bannerHeight, COLORS.WIN_BANNER_BLUE)
            .setOrigin(0.5);
        container.add(banner);

        // Banner top highlight
        const bannerHighlight = this.scene.add.rectangle(centerX, bannerY - 12, bannerWidth - 20, 12, COLORS.WIN_BANNER_HIGHLIGHT)
            .setOrigin(0.5);
        container.add(bannerHighlight);

        // Banner bottom shadow
        const bannerDarkShadow = this.scene.add.rectangle(centerX, bannerY + 12, bannerWidth - 20, 12, COLORS.WIN_BANNER_SHADOW)
            .setOrigin(0.5);
        container.add(bannerDarkShadow);

        // "YOU WIN!" text
        const winText = this.scene.add.text(centerX, bannerY, 'YOU WIN!', {
            fontFamily: 'Courier New, monospace',
            fontSize: '32px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(2, 2, '#000000', 2);
        container.add(winText);

        // Stats text below banner
        const statsY = centerY + 45;
        const statsStyle = {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        };

        const statsText = this.scene.add.text(centerX, statsY, `Moves: ${moves}    Time: ${time}`, statsStyle)
            .setOrigin(0.5);
        container.add(statsText);

        // Restart button
        const buttonY = centerY + 90;
        const buttonWidth = 180;
        const buttonHeight = 40;

        // Button background
        const buttonBg = this.scene.add.rectangle(centerX, buttonY, buttonWidth, buttonHeight, COLORS.SUIT_RED)
            .setStrokeStyle(2, COLORS.WHITE)
            .setInteractive({ useHandCursor: true });
        container.add(buttonBg);

        // Button text
        const buttonText = this.scene.add.text(centerX, buttonY, 'Play Again', {
            fontFamily: 'Courier New, monospace',
            fontSize: '20px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(buttonText);

        // Button hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(COLORS.SUIT_RED_DARK).setStrokeStyle(2, COLORS.CREAM)
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(COLORS.SUIT_RED).setStrokeStyle(2, COLORS.WHITE)
        });

        // Button click handler
        buttonBg.on('pointerdown', () => {
            this.fadeOutAndDestroy();
        });

        // Make overlay clickable to dismiss (optional future feature)
        overlay.setInteractive();

        // Fade in animation
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        return container;
    }

    private fadeOutAndDestroy(): void {
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.container.destroy();
                this.scene.scene.restart();
            }
        });
    }

    public destroy(): void {
        this.fadeOutAndDestroy();
    }
}
