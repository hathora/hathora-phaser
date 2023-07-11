import type * as _Phaser from "phaser";
import type { HathoraPhaser } from ".";

declare module "phaser" {
    interface Scene {
        HathoraPhaser: HathoraPhaser;
    }
    namespace Phaser {
        namespace GameObjects {
            interface GameObjectFactory extends _Phaser.GameObjects.GameObjectFactory {
                haVisibilityToggle(x: number, y: number): typeof Phaser.GameObjects.DOMElement;
                haRegionSelect(x: number, y: number): typeof Phaser.GameObjects.DOMElement;
                haCreateGameButton(x: number, y: number, label?: string): any;
                haJoinPrivateInput(x: number, y: number, label?: string): any;
                haJoinPublicList(x: number, y: number, width?: number, height?: number, label?: string, pollRate?: number): any;
            }
        }
    }
}
