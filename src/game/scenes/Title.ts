import { SCENE_KEYS } from "./common";

export class TitleScene extends Phaser.Scene {
    private static readonly COLORS = {
        FELT_GREEN: 0x0B7D3E,
        FELT_DARK: 0x085A2C,
        BUTTON_GREEN: 0x0A6B34,
        BUTTON_HOVER: 0x0D9245,
        WHITE: 0xFFFFFF,
        CREAM: 0xFFF8DC,
        DARK_STROKE: 0x043D1A,
        SUIT_RED: 0xDC143C,
        SUIT_RED_DARK: 0xA01020,
        SUIT_BLACK: 0x000000
    } as const;

    constructor() {
        super({ key: SCENE_KEYS.TITLE });
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        this.createBackground(width, height);
        this.createDecorations(width, height);
        this.createTitle(centerX, centerY);
        this.createSubtitle(centerX, centerY);
        this.createPlayButton(centerX, centerY);
        this.createFooter(centerX, height);
    }

    private createBackground(width: number, height: number): void {
        // Classic felt green background
        this.add.rectangle(0, 0, width, height, TitleScene.COLORS.FELT_GREEN, 1).setOrigin(0, 0);

        // Subtle darker border for depth
        const borderSize = 8;
        this.add.rectangle(0, 0, width, borderSize, TitleScene.COLORS.FELT_DARK, 1).setOrigin(0, 0);
        this.add.rectangle(0, height - borderSize, width, borderSize, TitleScene.COLORS.FELT_DARK, 1).setOrigin(0, 0);
        this.add.rectangle(0, 0, borderSize, height, TitleScene.COLORS.FELT_DARK, 1).setOrigin(0, 0);
        this.add.rectangle(width - borderSize, 0, borderSize, height, TitleScene.COLORS.FELT_DARK, 1).setOrigin(0, 0);
    }

    private createDecorations(width: number, height: number): void {
        // Black suits
        this.createSuitDecoration(60, 50, '♠', TitleScene.COLORS.SUIT_BLACK);
        this.createSuitDecoration(width - 60, height - 50, '♣', TitleScene.COLORS.SUIT_BLACK);
        // Red suits
        this.createSuitDecoration(width - 60, 50, '♥', TitleScene.COLORS.SUIT_RED);
        this.createSuitDecoration(60, height - 50, '♦', TitleScene.COLORS.SUIT_RED);
    }

    private createTitle(centerX: number, centerY: number): void {
        const titleText = this.add.text(centerX, centerY - 80, 'SOLITAIRE', {
            fontFamily: 'Georgia, serif',
            fontSize: '90px',
            color: '#FFFFFF',
            stroke: `#${TitleScene.COLORS.DARK_STROKE.toString(16)}`,
            strokeThickness: 5,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);

        this.createShimmerEffect(titleText);
    }

    private createSubtitle(centerX: number, centerY: number): void {
        this.add.text(centerX, centerY, '✦ Classic ✦', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: `#${TitleScene.COLORS.CREAM.toString(16)}`,
            fontStyle: 'italic',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5);
    }

    private createPlayButton(centerX: number, centerY: number): void {
        const buttonY = centerY + 90;
        const buttonBg = this.add.rectangle(centerX, buttonY, 220, 60, TitleScene.COLORS.SUIT_RED, 1);
        buttonBg.setStrokeStyle(4, TitleScene.COLORS.WHITE, 1);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(centerX, buttonY, 'PLAY', {
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5);

        this.setupButtonInteractions(buttonBg);
        this.createButtonPulseEffect(buttonBg, buttonText);
    }

    private createFooter(centerX: number, height: number): void {
        const footerText = this.add.text(
            centerX,
            height - 25,
            `© ${new Date().getFullYear()} - Press PLAY to Start`,
            {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: `#${TitleScene.COLORS.CREAM.toString(16)}`,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 3,
                    fill: true
                }
            }
        );
        footerText.setOrigin(0.5).setAlpha(0.8);
    }

    private setupButtonInteractions(buttonBg: Phaser.GameObjects.Rectangle): void {
        buttonBg.once(Phaser.Input.Events.POINTER_DOWN, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
                if (progress === 1) {
                    this.scene.start(SCENE_KEYS.GAME);
                }
            });
        });

        this.input.on(Phaser.Input.Events.POINTER_OVER, () => {
            buttonBg.setStrokeStyle(4, TitleScene.COLORS.CREAM, 1);
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 200,
                ease: 'Power2',
                onUpdate: (tween) => {
                    const value = tween.getValue() ?? 0;
                    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                        Phaser.Display.Color.ValueToColor(TitleScene.COLORS.SUIT_RED),
                        Phaser.Display.Color.ValueToColor(TitleScene.COLORS.SUIT_RED_DARK),
                        1,
                        value
                    );
                    buttonBg.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                }
            });
        });

        this.input.on(Phaser.Input.Events.POINTER_OUT, () => {
            buttonBg.setStrokeStyle(4, TitleScene.COLORS.WHITE, 1);
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 200,
                ease: 'Power2',
                onUpdate: (tween) => {
                    const value = tween.getValue() ?? 0;
                    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                        Phaser.Display.Color.ValueToColor(TitleScene.COLORS.SUIT_RED_DARK),
                        Phaser.Display.Color.ValueToColor(TitleScene.COLORS.SUIT_RED),
                        1,
                        value
                    );
                    buttonBg.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                }
            });
        });
    }

    private createShimmerEffect(target: Phaser.GameObjects.Text): void {
        this.tweens.add({
            targets: target,
            alpha: { from: 0.8, to: 1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createButtonPulseEffect(buttonBg: Phaser.GameObjects.Rectangle, buttonText: Phaser.GameObjects.Text): void {
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
            fontSize: '70px',
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: color === TitleScene.COLORS.SUIT_BLACK ? '#666666' : '#8B0000',
            strokeThickness: 3
        });
        suit.setOrigin(0.5);
        suit.setAlpha(0.6);

        // Subtle float animation
        this.tweens.add({
            targets: suit,
            y: suit.y + 10,
            alpha: { from: 0.5, to: 0.7 },
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}