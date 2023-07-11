import { Plugins, Scene } from "phaser";
import { RoomV1Api, Region } from "@hathora/hathora-cloud-sdk";
import { HathoraConnection } from "@hathora/client-sdk";
import './phaserTypes';
declare class HathoraPhaser extends Plugins.ScenePlugin {
    private lobbyClient;
    private authClient;
    roomClient: RoomV1Api;
    isCreatingPublicGame: boolean;
    selectedRegion: Region;
    onRegionsLoad: Promise<void>[];
    onJoin?: Function;
    onError?: Function;
    appId: string;
    private token;
    pollId?: number;
    debugId: string;
    constructor(scene: Scene, manager: Plugins.PluginManager);
    boot(): void;
    initialize(appId: string, onJoin: Function, onError: Function, useUrl?: boolean, defaultVisibility?: 'public' | 'private'): Promise<void>;
    showOverlay(msg?: string): void;
    hideOverlay(): void;
    private factoryVisibilityToggle;
    private factoryRegionSelect;
    private factoryCreateGameButton;
    private factoryJoinPrivateInput;
    private factoryJoinPublicList;
}
export { HathoraPhaser, HathoraConnection };
