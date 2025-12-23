import { SCENE_KEYS } from "./common";


export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE_KEYS.TITLE });
    }

    create() {
        this.scene.start(SCENE_KEYS.GAME);
    }
}