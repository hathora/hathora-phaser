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

### `[scene].HathoraPhaser.initialize`

Called once, to initialize the plugin.

#### Parameters

| Parameter          | Type     | Description                                                                  |
| ------------------ | -------- | ---------------------------------------------------------------------------- |
| appId              | string   | Your Hathora appId, get it from [the console](https://console.hathora.dev).  |
| connectionCallback | function | A callback function, with a `HathoraConnection` object as a parameter.       |
| errorCallback      | function | A callback function if a connection error occurs, with an `error` parameter. |
| useUrl             | boolean  | Defaults to true, a flag to specify if the URL should be read as a roomId.   |
| defaultVisibility  | string   | 'public' or 'private', represents connection visibility if no toggle.        |

#### Example Usage

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


### `[scene].add.haVisibilityToggle`

Adds a visibility toggle to the scene which the player can use to specify a new game's visibility.

![Visibility toggle element with default styling.](https://github.com/hathora/hathora-phaser/assets/7004280/86a55be3-814f-4c94-a4b1-8335acc799db)

#### Parameters

| Parameter   | Type     | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| x           | number   | The X coordinate to display the visibility toggle at.  |
| y           | number   | The Y coordinate to display the visibility toggle at.  |

#### CSS Customization

- `.ha-toggle`: Parent class of the containing `<div>` ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L25-L30)).
- `.ha-toggle__switch`: Inner `<button>` classes ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L32-L55)).
- `(switch class).on`: Conditional class to signify the selected `<button>` element ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L57-L68)).

#### Example Usage

```ts
this.add.haVisibilityToggle(250, 250);
```

### `[scene].add.haCreateGameButton`

Adds a create game button to the scene which if clicked will create a new game room on the server.

![Create game button with default styling.](https://github.com/hathora/hathora-phaser/assets/7004280/f7fd8146-4ae3-4f2f-92b6-8a5e6c7c8371)

#### Parameters

| Parameter   | Type     | Description                                             |
| ----------- | -------- | ------------------------------------------------------- |
| x           | number   | The X coordinate to display the create game button at.  |
| y           | number   | The Y coordinate to display the create game button at.  |
| label       | string   | An optional string to change the button's label text.   |

#### CSS Customization

- `.ha-btn`: Class applied to the `<button>` element ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L87-L101)).

#### Example Usage

```ts
this.add.haCreateGameButton(250, 250, 'Create a New Game');
```

### `[scene].add.haRegionSelect`

Adds a dropdown menu populated with server regions and their average pings to the connected client.

![Region select dropdown with default styling.](https://github.com/hathora/hathora-phaser/assets/7004280/c7f7e779-9228-4c82-a95a-bd5510060476)

#### Parameters

| Parameter   | Type     | Description                                                 |
| ----------- | -------- | ----------------------------------------------------------- |
| x           | number   | The X coordinate to display the region select dropdown at.  |
| y           | number   | The Y coordinate to display the region select dropdown at.  |

#### CSS Customization

- `.ha-select`: Class applied to the `<select>` element ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L70-L85)).

#### Example Usage

```ts
this.add.haRegionSelect(250, 250);
```

### `[scene].add.haJoinPublicList`

Adds a scrollable panel which displays the active public games in the selected region.

![Join public list dialog with default styling.](https://github.com/hathora/hathora-phaser/assets/7004280/70af0018-a31a-4464-9ed1-edc58b6b9ad3)

#### Parameters

| Parameter   | Type     | Description                                                        |
| ----------- | -------- | ------------------------------------------------------------------ |
| x           | number   | The X coordinate to display the join public game panel at.         |
| y           | number   | The Y coordinate to display the join public game panel at.         |
| width       | number   | The horizontal width to display the join public game panel at.     |
| height      | number   | The vertical height to display the join public game panel at.      |
| label       | string   | An optional override for the panel's heading label.                |
| pollRate    | number   | An optional override for the panel's polling rate in milliseconds. |

#### CSS Customization

- `.ha-join-public`: Class applied to the parent `<div>` element ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L137-L148)).
- `.ha-join-public__header`: Class applied to the `<header>` element of the panel ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L150-L157)).
- `.ha-join-public__list`: Class applied to the scrollable `<div>` containing individual game rooms ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L159-L167)).
- `.ha-join-public__list--filled`: Conditional class to signify that the list has entries ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L169-L171)).
- `.ha-join-public__game`: Class applied to the individual rows representing a game room ([default styling](https://github.com/hathora/hathora-phaser/blob/main/lib/styles.css#L173-L211)).

#### Example Usage

```ts
this.add.haJoinPublicList(250, 250, 400, 400, 'Find a Game', 500);
```

### `[scene].add.haJoinPrivateInput`