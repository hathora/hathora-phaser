import { Plugins, Scene } from "phaser";
import { RoomV1Api, Region, DiscoveryV1Api } from "@hathora/hathora-cloud-sdk";
import { HathoraConnection } from "@hathora/client-sdk";
import './phaserTypes';
declare class HathoraPhaser extends Plugins.ScenePlugin {
    private lobbyClient;
    private authClient;
    discoveryClient: DiscoveryV1Api;
    roomClient: RoomV1Api;
    isCreatingPublicGame: boolean;
    selectedRegion: Region | 'All';
    onRegionsLoad: Promise<void>[];
    onJoin?: Function;
    onError?: Function;
    appId: string;
    private token;
    publicLobbyPollId?: number;
    joinedGame: boolean;
    regions: string[];
    regionPings: {
        ping: number;
        region: Region;
    }[];
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
