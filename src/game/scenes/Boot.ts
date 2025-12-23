import { Scene } from 'phaser';
import { SCENE_KEYS } from './common';

export class Boot extends Scene {
    constructor() {
        super({ key: SCENE_KEYS.BOOT });
    }

    preload() {

    }

    create() {
        this.scene.start(SCENE_KEYS.PRELOAD);
    }
}
