import { Plugins, Scene } from "phaser";
import { AuthV1Api, LobbyV2Api, DiscoveryV1Api, DiscoveryResponseInner, RoomV1Api, Region } from "@hathora/hathora-cloud-sdk";
import { ActiveConnectionInfo, ConnectionInfo, HathoraConnection } from "@hathora/client-sdk";
import { v4 as uuid } from 'uuid';
// @ts-ignore
import css from './styles.css?raw';

const STORAGE_KEY_TOKEN = 'hathora-phaser3:token';
const STORAGE_KEY_CREATING_PUBLIC_GAME = 'hathora-phaser3:creating_public_game';
const STORAGE_KEY_DEFAULT_REGION = 'hathora-phaser3:default_region';

function waitForConnection(plugin: HathoraPhaser, roomId: string): Promise<ActiveConnectionInfo> {
  return new Promise(async (resolve) => {
    let connectionInfo: ConnectionInfo | undefined = undefined;

    while (!connectionInfo || (connectionInfo && connectionInfo.status !== 'active')) {
      connectionInfo = await plugin.roomClient.getConnectionInfo(plugin.appId, roomId);
    }

    resolve(connectionInfo!);
  });
}

class HathoraPhaser extends Plugins.ScenePlugin {
  // Hathora clients
  private lobbyClient: LobbyV2Api = new LobbyV2Api();
  private authClient: AuthV1Api = new AuthV1Api();
  private discoveryClient: DiscoveryV1Api = new DiscoveryV1Api();
  public roomClient: RoomV1Api = new RoomV1Api();

  // Create game configuration
  public isCreatingPublicGame: boolean = (['true', null].includes(window.localStorage.getItem(STORAGE_KEY_CREATING_PUBLIC_GAME)));
  public selectedRegion: Region = (window.localStorage.getItem(STORAGE_KEY_DEFAULT_REGION) as Region || 'Seattle');
  public onRegionsLoad: Promise<void>[] = [];

  // CB functions for joining a room
  public onJoin?: Function;
  public onError?: Function;
  
  // Current game's appId
  public appId!: string;
  private token!: string;

  public pollId?: number;

  public debugId: string = Math.random().toString(36).substring(2);

  constructor(scene: Scene, manager: Plugins.PluginManager) {
    super(scene, manager, 'HathoraPhaser');
  }

  public boot() {
    const styles = document.createElement('style');

    styles.innerHTML = css;

    document.body.appendChild(styles);
    
    this.pluginManager.registerGameObject('haVisibilityToggle', this.factoryVisibilityToggle);
    this.pluginManager.registerGameObject('haRegionSelect', this.factoryRegionSelect);
    this.pluginManager.registerGameObject('haCreateGameButton', this.factoryCreateGameButton);
    this.pluginManager.registerGameObject('haJoinPrivateInput', this.factoryJoinPrivateInput);
    this.pluginManager.registerGameObject('haJoinPublicList', this.factoryJoinPublicList);
  }

  public async initialize(appId: string, onJoin: Function, onError: Function, useUrl: boolean = true) {
    if (this.appId) {
      console.error('You should only call initialize once.');
      return;
    }

    this.appId = appId;
    this.onJoin = onJoin;
    this.onError = onError;

    let token: any = '';

    if (sessionStorage.getItem(STORAGE_KEY_TOKEN)) {
      token = sessionStorage.getItem(STORAGE_KEY_TOKEN)!;
    }

    if (token === '') {
      const authData = await this.authClient.loginAnonymous(appId);
      token = authData.token;

      sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
    }

    this.scene.add.dom(0, 0).createFromHTML(`
      <div id="ha-loading" class="ha-loading-overlay">
        <div class="ha-loader"></div>
        <label id="ha-loading-message"></label>
      </div>
    `).setOrigin(0, 0).setClassName('ha-overlay-container');

    this.token = token;

    const {pathname} = window.location;
    const roomId = pathname.substring(1);
    const {hostname} = window.location;
    const isLocal = (hostname === 'localhost');
    let connectionInfo: ConnectionInfo;

    if (useUrl && roomId !== '') {
      try {
        if (isLocal) {
          connectionInfo = {
            host: 'localhost',
            port: 4000,
            transportType: 'tcp',
            status: 'active'
          };
        }
        else {
          connectionInfo = await waitForConnection(this, roomId);
        }

        const connection = new HathoraConnection(roomId, connectionInfo);

        connection.connect(token);
        
        clearInterval(this.pollId);
        onJoin(connection);
      }
      catch (e) {
        onError(e);
      }
    }
  }

  public showOverlay(msg = '') {
    const overlay = document.getElementById('ha-loading')!;
    const message = document.getElementById('ha-loading-message')!;

    overlay.classList.add('on');
    message.innerText = msg;
  }

  public hideOverlay() {
    const overlay = document.getElementById('ha-loading')!;

    overlay.classList.remove('on');
  }

  private factoryVisibilityToggle(x: number, y: number) {
    // @ts-ignore
    const {HathoraPhaser} = this.scene;
    const {isCreatingPublicGame: publicGame} = HathoraPhaser;
    const publicId = `public_${uuid()}`;
    const privateId = `private_${uuid()}`;


    const ele = this.scene.add.dom(x, y).createFromHTML(`
      <div class="ha-toggle">
        <button id="${publicId}" class="ha-toggle__switch${publicGame ? ' on': ''}">
          Public
        </button>
        <button id="${privateId}" class="ha-toggle__switch${!publicGame ? ' on': ''}">
          Private
        </button>
      </div>
    `).setOrigin(0.5);

    const btnPublic = document.getElementById(publicId)!;
    const btnPrivate = document.getElementById(privateId)!;

    btnPublic.addEventListener('click', () => {
      btnPublic.classList.remove('on');
      btnPrivate.classList.remove('on');

      btnPublic.classList.add('on');
      window.localStorage.setItem(STORAGE_KEY_CREATING_PUBLIC_GAME, 'true');
      HathoraPhaser.isCreatingPublicGame = true;
    });

    btnPrivate.addEventListener('click', () => {
      btnPublic.classList.remove('on');
      btnPrivate.classList.remove('on');

      btnPrivate.classList.add('on');
      window.localStorage.setItem(STORAGE_KEY_CREATING_PUBLIC_GAME, 'false');
      HathoraPhaser.isCreatingPublicGame = false;
    });

    return ele;
  }

  private factoryRegionSelect(x: number, y: number) {
    // @ts-ignore
    const {HathoraPhaser} = this.scene;
    const selectId = `region_${uuid()}`;

    const ele = this.scene.add.dom(x, y).createFromHTML(`
      <select id="${selectId}" class="ha-select">
        <option value="Seattle">Seattle</option>
        <option value="Washington_DC">Washington, DC</option>
        <option value="London">London</option>
        <option value="Franfurt">Franfurt</option>
        <option value="Mumbai">Mumbai</option>
        <option value="Singapore">Singapore</option>
        <option value="Tokyo">Tokyo</option>
        <option value="Sydney">Sydney</option>
        <option value="Sao_Paulo">Sao Paulo</option>
      </select>
    `).setOrigin(0.5);

    const select = document.getElementById(selectId)! as HTMLSelectElement;

    const pingingRegionsPromise = new Promise<void>((resolve) => {
      HathoraPhaser.discoveryClient.getPingServiceEndpoints().then((regions: DiscoveryResponseInner[]) => {
        const sentAt = Date.now();
        select.disabled = true;
        select.innerHTML = ``;
  
        const loadingOption = new Option();
        loadingOption.value = "";
        loadingOption.innerText = "Loading...";
        loadingOption.id = `${selectId}_loading`;
  
        select.append(loadingOption);
  
        let resolvedRegions = 0;
  
        regions.forEach((region) => {
          fetch(`https://${region.host}:${region.port}`, {
            mode: 'no-cors'
          }).then(() => {
            resolvedRegions++;
            const ping = (Date.now() - sentAt);
            const finalResolved = (resolvedRegions === regions.length);
  
            const regionOption = new Option();
            regionOption.value = region.region;
            regionOption.innerText = `${region.region} (${ping}ms)`;
  
            select.append(regionOption);
  
            if (finalResolved) {
              select.removeChild(loadingOption);
              select.disabled = false;
              select.value = HathoraPhaser.selectedRegion;
              resolve();
            }
          });
        });
      });
    });

    HathoraPhaser.onRegionsLoad.push(pingingRegionsPromise);
    
    select.addEventListener('change', (e) => {
      // @ts-ignore
      const {value: region} = e.target;
      
      window.localStorage.setItem(STORAGE_KEY_DEFAULT_REGION, region);
      HathoraPhaser.selectedRegion = region;
    });

    return ele;
  }

  private factoryCreateGameButton(x: number, y: number, label: string = 'Create Game') {
    // @ts-ignore
    const {HathoraPhaser}: { HathoraPhaser: HathoraPhaser } = this.scene;
    const btnId = `create_${uuid()}`;

    const ele = this.scene.add.dom(x, y).createFromHTML(`
      <button id="${btnId}" class="ha-btn">
        ${label}
      </button>
    `).setOrigin(0.5);

    const btn = document.getElementById(btnId)! as HTMLButtonElement;

    btn.disabled = true;

    Promise.all(HathoraPhaser.onRegionsLoad).then(() => {
      btn.disabled = false;
    });

    btn.addEventListener('click', async () => {
      const {hostname} = window.location;
      const isLocal = (hostname === 'localhost');
      const visibility = (isLocal ? 'local' : HathoraPhaser.isCreatingPublicGame ? 'public' : 'private');

      HathoraPhaser.showOverlay('Creating room, please wait...');

      try {
        const lobby = await HathoraPhaser.lobbyClient.createLobby(
          HathoraPhaser.appId,
          HathoraPhaser.token,
          {
            visibility,
            region: HathoraPhaser.selectedRegion,
            initialConfig: {}
          }
        );

        let connectionInfo: ConnectionInfo;
        const {roomId} = lobby;

        if (visibility === 'local') {
          connectionInfo = {
            host: 'localhost',
            port: 4000,
            transportType: 'tcp',
            status: 'active'
          };
        }
        else {
          connectionInfo = await waitForConnection(HathoraPhaser, roomId);
        }
  
        const connection = new HathoraConnection(roomId, connectionInfo);
  
        connection.connect(HathoraPhaser.token);
        
        clearInterval(HathoraPhaser.pollId);
        HathoraPhaser.onJoin!(connection);
        history.pushState({}, "", `/${roomId}`);
        HathoraPhaser.hideOverlay();
      }
      catch (e) {
        HathoraPhaser.onError!(e);
      }
    });

    return ele;
  }

  private factoryJoinPrivateInput(x: number, y: number, label: string = 'Join') {
    // @ts-ignore
    const {HathoraPhaser}: {HathoraPhaser: HathoraPhaser} = this.scene;
    const txtId = `join_private_${uuid()}`;
    const btnId = `join_private_${uuid()}`;

    const ele = this.scene.add.dom(x, y).createFromHTML(`
      <div class="ha-join-private">
        <input id="${txtId}" class="ha-text ha-text--join" />
        <button id="${btnId}" class="ha-btn ha-btn--join">
          ${label}
        </button>
      </div>
    `).setOrigin(0.5);

    const btn = document.getElementById(btnId)! as HTMLButtonElement;
    const txt = document.getElementById(txtId)! as HTMLInputElement;

    btn.addEventListener('click', async () => {
      const roomId = txt.value.trim();
      const {hostname} = window.location;
      const isLocal = (hostname === 'localhost');
      let connectionInfo: ConnectionInfo;

      try {
        if (isLocal) {
          connectionInfo = {
            host: 'localhost',
            port: 4000,
            transportType: 'tcp',
            status: 'active'
          };
        }
        else {
          connectionInfo = await waitForConnection(HathoraPhaser, roomId);
        }

        const connection = new HathoraConnection(roomId, connectionInfo);

        connection.connect(HathoraPhaser.token);
        
        clearInterval(this.pollId);
        HathoraPhaser.onJoin!(connection);
        history.pushState({}, "", `/${roomId}`);
      }
      catch (e) {
        HathoraPhaser.onError!(e);
      }
    });

    return ele;
  }

  private factoryJoinPublicList(x: number, y: number, width: number = 200, height: number = 350, label: string = 'Join Public Game', pollRate: number = 1000) {
    // @ts-ignore
    const {HathoraPhaser}: {HathoraPhaser: HathoraPhaser} = this.scene;
    const listId = `public_list_${uuid()}`;

    const ele = this.scene.add.dom(x, y).createFromHTML(`
      <div class="ha-join-public" style="width: ${width}px; height: ${height}px;">
        <header class="ha-join-public__header">
          ${label}
        </header>

        <div id="${listId}" class="ha-join-public__list">
          <div class="ha-loader"></div>
      </div>
    `).setOrigin(0.5);

    const list = document.getElementById(listId);

    const joinPublicGame = async (e: any) => {
      const roomId = e.target.getAttribute('data-join-room-id');
      const {hostname} = window.location;
      const isLocal = (hostname === 'localhost');
      let connectionInfo: ConnectionInfo;

      try {
        if (isLocal) {
          connectionInfo = {
            host: 'localhost',
            port: 4000,
            transportType: 'tcp',
            status: 'active'
          };
        }
        else {
          connectionInfo = await waitForConnection(HathoraPhaser, roomId);
        }

        const connection = new HathoraConnection(roomId, connectionInfo);

        connection.connect(HathoraPhaser.token);
        
        clearInterval(this.pollId);
        HathoraPhaser.onJoin!(connection);
        history.pushState({}, "", `/${roomId}`);
      }
      catch (e) {
        HathoraPhaser.onError!(e);
      }
    };

    const pollPublicLobbies = async () => {
      const publicLobbies = await HathoraPhaser.lobbyClient.listActivePublicLobbies(HathoraPhaser.appId, HathoraPhaser.selectedRegion);
      let listHTML = ``;

      if (publicLobbies.length > 0) {
        publicLobbies.forEach((lobby) => {
          listHTML += `
            <div class="ha-join-public__game">
              <label>${lobby.roomId}</label>
              <button data-join-room-id="${lobby.roomId}" class="ha-btn ha-btn--join">
                Join
              </button>
            </div>
          `;
        });
        list!.classList.add('ha-join-public__list--filled');
      }
      else {
        listHTML = `<div class="ha-join-public__nogames">No active games in ${HathoraPhaser.selectedRegion} region.</div>`;
        list!.classList.remove('ha-join-public__list--filled');
      }

      list!.innerHTML = listHTML;

      list!.querySelectorAll('[data-join-room-id]').forEach((btn) => {
        btn.addEventListener('click', joinPublicGame);
      });
    };

    HathoraPhaser.pollId = setInterval(pollPublicLobbies, pollRate);
    pollPublicLobbies();

    return ele;
  }
}

export {
  HathoraPhaser,
  HathoraConnection
};