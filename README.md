# Hathora Phaser 3 Plugin

This plugin extends Phaser's game object factory functions with several additional UI elements which interface with one another and can be leveraged to quickly bootstrap multiplayer lobby menu scenes.

## Usage

Before calling any of the factory functions, you must first install the plugin within your Phaser game directory. You can do so via:

```bash
npm install hathora-phaser
```

With the plugin installed as a Node module, you must then add it to your game's configuration object as follows:

```ts
import './style.css'
import { Scene, Game, WEBGL, Scale } from 'phaser';
import { HathoraPhaser, HathoraConnection } from 'hathora-phaser';
import { TitleScene, GameScene } from './scenes';

const config = {
  type: WEBGL,
  scale: {
    width: 1280,
    height: 720,
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
  },
  parent: 'game',
  dom: {
    createContainer: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      // debug: true
    }
  },
  scene: [
    TitleScene,
    GameScene
  ],
  plugins: {
    scene: [
      {
        key: 'HathoraPhaser',
        mapping: 'HathoraPhaser',
        plugin: HathoraPhaser,
        start: true
      }
    ]
  }
  // Important part for using the plugin ☝️
}

new Game(config);
```

The final step before you can begin composing your scene via the factory functions is to initialize the plugin with your Hathora `appId` (you can get this by creating a project in your [Hathora Console](https://console.hathora.dev/)). This code typically would live inside the `create()` function of your game's boot scene or anywhere it would only be called once, and would look something like this:

```ts
this.HathoraPhaser.initialize(
  '[HATHORA_APP_ID]',
  (connection: HathoraConnection) => {
    this.scene.start('scene-game', {
      connection
    });
  },
  (error: any) => {
    console.warn(error);
  },
  true
);
```

For a full description of all the arguments passed to `HathoraPhaser.initialize()`, please see the next section! 😎

After initializing the plugin you're free to call it's factory functions to assemble a lobby UI that makes sense for your game. These factory functions come with a default styling, but you can override these styles using their classNames also listed in the next section.

For a full example using all available UI elements, please [see this repo](#todo).

## API

(Todo)