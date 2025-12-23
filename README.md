# Solitaire - PhaserJS Game

A classic Klondike Solitaire card game built with Phaser 3, TypeScript, and Vite. This implementation features traditional solitaire gameplay with drag-and-drop mechanics, smooth animations, and responsive design.

## About the Game

This is a fully playable Solitaire (Klondike) game that includes:

- **Classic Solitaire Rules**: Build foundation piles from Ace to King by suit, and tableau piles in descending order with alternating colors
- **Interactive Gameplay**: Drag and drop cards between tableau piles, foundation piles, and discard pile
- **Draw Pile**: Draw cards from the stock pile and recycle the discard pile when empty
- **Win Detection**: Automatically detects when all four foundation piles are complete
- **Responsive Scaling**: Game adapts to different screen sizes with FIT scaling mode

### Game Structure

The game is built with a modular TypeScript architecture:

- **Card System**: Object-oriented card representation with suit, value, and face state
- **Deck Management**: 52-card deck with shuffle and draw functionality
- **Foundation Piles**: Four suit-specific piles (♠ ♥ ♦ ♣) for building sequences
- **Tableau Layout**: Seven columns for the classic solitaire tableau
- **Scene Management**: Phaser scenes for boot, preload, title screen, and main game

### Technology Stack

- [Phaser 3.90.0](https://github.com/phaserjs/phaser) - Game framework
- [Vite 6.3.1](https://github.com/vitejs/vite) - Build tool and dev server
- [TypeScript 5.7.2](https://github.com/microsoft/TypeScript) - Type-safe development

## Getting Started

### Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch a development web server |
| `npm run build` | Create a production build in the `dist` folder |

### Installation & Running

After cloning the repo, run `npm install` from your project directory. Then start the development server with `npm run dev`.

The game will be available at `http://localhost:8080` by default. The dev server supports hot-reloading, so any changes to files in the `src` folder will automatically recompile and reload the browser.

## Project Structure

| Path                              | Description                                                |
|-----------------------------------|------------------------------------------------------------|
| `index.html`                      | Main HTML page containing the game canvas                  |
| `public/assets`                   | Game sprites (card sprites, backgrounds, etc.)             |
| `public/style.css`                | Global layout styles                                       |
| `src/main.ts`                     | Application bootstrap                                      |
| `src/game/main.ts`                | Game entry point: Phaser configuration and initialization  |
| `src/game/scenes/`                | Phaser game scenes (Boot, Preload, Title, Game)            |
| `src/game/lib/card.ts`            | Card class with suit, value, and flip logic                |
| `src/game/lib/deck.ts`            | Deck management (shuffle, draw, discard)                   |
| `src/game/lib/solitaire.ts`       | Core game logic and rules                                  |
| `src/game/lib/foundation-pile.ts` | Foundation pile validation and management                  |
| `src/game/lib/utils.ts`           | Utility functions                                          | 

## Development

### Hot Reloading

Vite provides instant hot-module replacement. Edit any TypeScript file in `src/` and see changes reflected immediately in the browser without losing game state.

### Game Configuration

The Phaser game configuration in [src/game/main.ts](src/game/main.ts) includes:
- Canvas size: 640×360 with FIT scaling mode
- Pixel art rendering enabled for crisp card graphics
- Auto-centering on all screen sizes
- Scene sequence: Boot → Preload → Title → Game

### Handling Assets

Static assets like card sprites are placed in the `public/assets` folder and loaded via the Phaser Loader:

```typescript
preload() {
    // Load static assets from public/assets folder
    this.load.image('background', 'assets/bg.png');
    this.load.spritesheet('cards', 'assets/cards.png', { 
        frameWidth: 32, 
        frameHeight: 48 
    });
}
```

When you run `npm run build`, all static assets are automatically copied to the `dist/assets` folder.

## Building for Production

After you run `npm run build`, your game will be built into a single optimized bundle and saved to the `dist` folder, along with all assets from the public folder.

To deploy your game, upload the entire contents of the `dist` folder to a web server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
