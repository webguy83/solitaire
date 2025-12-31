import { SCENE_KEYS, ASSET_KEYS } from "./common";

export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE_KEYS.TITLE });
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // Luxurious purple and gold gradient background
        const bgTop = this.add.rectangle(0, 0, width, height / 2, 0x2d1b4e, 1);
        bgTop.setOrigin(0, 0);
        
        const bgBottom = this.add.rectangle(0, height / 2, width, height / 2, 0x1a0f35, 1);
        bgBottom.setOrigin(0, 0);

        // Gold accent strips
        const goldTop = this.add.rectangle(0, 0, width, 5, 0xd4af37, 1);
        goldTop.setOrigin(0, 0);
        
        const goldBottom = this.add.rectangle(0, height - 5, width, 5, 0xd4af37, 1);
        goldBottom.setOrigin(0, 0);

        // Ornate decorative elements (top corners)
        this.createSuitDecoration(50, 40, '♠', 0xd4af37);
        this.createSuitDecoration(width - 50, 40, '♥', 0xffd700);

        // Ornate main title with gold styling
        const titleText = this.add.text(centerX, centerY - 60, 'SOLITAIRE', {
            fontFamily: 'Georgia, serif',
            fontSize: '80px',
            color: '#ffd700',
            stroke: '#8b6914',
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 12,
                fill: true
            }
        });
        titleText.setOrigin(0.5);
        
        // Add golden shimmer effect
        this.tweens.add({
            targets: titleText,
            alpha: { from: 0.95, to: 1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Elegant subtitle
        const subtitleText = this.add.text(centerX, centerY + 10, '✦ Classic Card Game ✦', {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#d4af37',
            fontStyle: 'italic'
        });
        subtitleText.setOrigin(0.5);

        // Play button container
        const buttonY = centerY + 80;
        const buttonWidth = 200;
        const buttonHeight = 50;

        // Ornate button background
        const buttonBg = this.add.rectangle(centerX, buttonY, buttonWidth, buttonHeight, 0x4a2c7a, 1);
        buttonBg.setStrokeStyle(3, 0xd4af37, 1);
        buttonBg.setInteractive({ useHandCursor: true });

        // Button text with gold styling
        const buttonText = this.add.text(centerX, buttonY, 'PLAY', {
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            color: '#ffd700',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // Luxurious button hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x6a3ca8);
            buttonBg.setStrokeStyle(3, 0xffd700, 1);
            this.tweens.add({
                targets: [buttonBg, buttonText],
                scale: 1.05,
                duration: 200,
                ease: 'Power2'
            });
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4a2c7a);
            buttonBg.setStrokeStyle(3, 0xd4af37, 1);
            this.tweens.add({
                targets: [buttonBg, buttonText],
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
        });

        buttonBg.on('pointerdown', () => {
            buttonBg.setFillStyle(0x3a1f5a);
            this.tweens.add({
                targets: [buttonBg, buttonText],
                scale: 0.98,
                duration: 100,
                ease: 'Power2'
            });
        });

        buttonBg.on('pointerup', () => {
            buttonBg.setFillStyle(0x6a3ca8);
            this.tweens.add({
                targets: [buttonBg, buttonText],
                scale: 1.05,
                duration: 100,
                ease: 'Power2'
            });
            
            // Start the game
            this.scene.start(SCENE_KEYS.GAME);
        });

        

        // Ornate decorative elements (bottom corners)
        this.createSuitDecoration(50, height - 40, '♦', 0xffd700);
        this.createSuitDecoration(width - 50, height - 40, '♣', 0xd4af37);

        // Elegant footer text
        const footerText = this.add.text(centerX, height - 20, `© ${new Date().getFullYear()} - Press PLAY to Start`, {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#d4af37'
        });
        footerText.setOrigin(0.5);
        footerText.setAlpha(0.7);

        // Add subtle pulsing animation to the play button
        this.tweens.add({
            targets: [buttonBg, buttonText],
            alpha: { from: 1, to: 0.85 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createSuitDecoration(x: number, y: number, symbol: string, color: number) {
        const suit = this.add.text(x, y, symbol, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '50px',
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#8b6914',
            strokeThickness: 2
        });
        suit.setOrigin(0.5);
        suit.setAlpha(0.5);

        // Add gentle rotation and shimmer animation
        this.tweens.add({
            targets: suit,
            angle: { from: -10, to: 10 },
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.tweens.add({
            targets: suit,
            alpha: { from: 0.4, to: 0.6 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}