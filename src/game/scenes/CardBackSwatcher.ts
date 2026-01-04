import * as Phaser from 'phaser';
import { ASSET_KEYS, COLORS, SCALE, CARD_WIDTH, CARD_HEIGHT} from './common';

const CARD_BACK_FRAMES = [52, 53, 54, 55];

export class CardBackSwatcher {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private selectedFrame: number;
    private onChangeCallback: (frame: number) => void;

    constructor(scene: Phaser.Scene, x: number, y: number, onChangeCallback: (frame: number) => void, initialFrame: number = 52) {
        this.scene = scene;
        this.selectedFrame = initialFrame;
        this.onChangeCallback = onChangeCallback;
        this.container = this.createSwatcher(x, y);
    }

    private createSwatcher(x: number, y: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y).setDepth(1);
        const swatchSize = 15;
        const spacing = 4;
        const totalWidth = (swatchSize * 4) + (spacing * 3);

        CARD_BACK_FRAMES.forEach((frame, index) => {
            const offsetX = index * (swatchSize + spacing) - totalWidth / 2 + swatchSize / 2;
            
            // Create card preview
            const cardPreview = this.scene.add.image(offsetX, 0, ASSET_KEYS.CARDS)
                .setFrame(frame)
                .setScale(SCALE * (swatchSize / 48))
                .setInteractive({ useHandCursor: true });
            container.add(cardPreview);

            // Create border overlay (inner border)
            const cardWidth = CARD_WIDTH * SCALE * (swatchSize / CARD_WIDTH);
            const cardHeight = CARD_HEIGHT * SCALE * (swatchSize / CARD_HEIGHT);
            const border = this.scene.add.rectangle(offsetX, -1, cardWidth - 1, cardHeight + 4, 0x000000, 0)
                .setStrokeStyle(2, COLORS.WIN_BANNER_BLUE, frame === this.selectedFrame ? 1 : 0)
                .setName(`border_${frame}`);
            container.add(border);

            // Click handler
            cardPreview.on('pointerdown', () => {
                this.selectFrame(frame);
            });
        });

        return container;
    }

    private selectFrame(frame: number): void {
        if (this.selectedFrame === frame) return;

        this.selectedFrame = frame;

        // Update border visibility for all frames
        CARD_BACK_FRAMES.forEach((f) => {
            const border = this.container.getByName(`border_${f}`) as Phaser.GameObjects.Rectangle;
            if (border) {
                border.setStrokeStyle(2, COLORS.WIN_BANNER_BLUE, f === frame ? 1 : 0);
            }
        });

        this.onChangeCallback(frame);
    }

    public getSelectedFrame(): number {
        return this.selectedFrame;
    }

    public destroy(): void {
        this.container.destroy();
    }
}
