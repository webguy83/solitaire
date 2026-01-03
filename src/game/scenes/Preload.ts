import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS } from "./common";


export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE_KEYS.PRELOAD });
    }

    preload() {
        // Load assets here
        this.load.spritesheet(ASSET_KEYS.CARDS, 'assets/cards_3.png', { frameWidth: CARD_WIDTH, frameHeight: CARD_HEIGHT });
    }

    create() {
        // Start the next scene, e.g., Title scene
        this.scene.start(SCENE_KEYS.TITLE);
    }
}