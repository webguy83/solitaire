import { Boot } from './scenes/Boot';
import { AUTO, Game } from 'phaser';
import { GameScene } from './scenes/Game';
import { TitleScene } from './scenes/Title';
import { PreloadScene } from './scenes/Preload';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 360,
    },
    parent: 'game-container',
    backgroundColor: '#387F3C',
    scene: [
        Boot,
        PreloadScene,
        TitleScene,
        GameScene,
    ]
};

const StartGame = () => {
    return new Game(config);
}

export default StartGame;
