import { Plugins, Scene } from "phaser";
import { AuthV1Api, LobbyV2Api, DiscoveryV1Api, DiscoveryResponseInner, RoomV1Api } from "@hathora/hathora-cloud-sdk";
import { HathoraConnection } from "@hathora/client-sdk";
import { v4 as uuid } from 'uuid';
// @ts-ignore
import css from './styles.css?raw';

const STORAGE_KEY_CREATING_PUBLIC_GAME = 'hathora-phaser3:creating_public_game';
const STORAGE_KEY_DEFAULT_REGION = 'hathora-phaser3:default_region';

class HathoraPhaser extends Plugins.ScenePlugin {
  // Hathora clients
  private lobbyClient: LobbyV2Api = new LobbyV2Api();
  private authClient: AuthV1Api = new AuthV1Api();
  private discoveryClient: DiscoveryV1Api = new DiscoveryV1Api();
  private roomClient: RoomV1Api = new RoomV1Api();

  // Create game configuration
  public isCreatingPublicGame: boolean = (['true', null].includes(window.localStorage.getItem(STORAGE_KEY_CREATING_PUBLIC_GAME)));
  public selectedRegion: string = (window.localStorage.getItem(STORAGE_KEY_DEFAULT_REGION) || 'Seattle');
  public onRegionsLoad: Promise<void>[] = [];
  public onJoin?: Function;
  
  // Current game's appId
  private appId!: string;
  private token!: string;
  // List of all available server regions
  // private regions: string[] = [
  //   'Seattle',
  //   'Washington_DC',
  //   'Chicago',
  //   'London',
  //   'Frankfurt',
  //   'Mumbai',
  //   'Singapore',
  //   'Tokyo',
  //   'Sydney',
  //   'Sao_Paulo'
  // ];
  // Currently selected region, defaults to Seattle
  // private region: Region = 'Seattle';

  // DOM node id tracking
  // private domPublicLobbyListIDs: string[] = [];

  constructor(scene: Scene, manager: Plugins.PluginManager) {
    super(scene, manager, 'HathoraPhaser3');
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

    console.log(this.authClient);
    console.log(this.lobbyClient);
    console.log(this.discoveryClient);
    console.log(this.token);
  }

  public async startUI(appId: string, onJoin: Function, onError: Function, useUrl: boolean = true) {
    if (this.appId) {
      console.error('You should only call startUI once.');
      return;
    }

    const { token } = await this.authClient.loginAnonymous(appId);
    
    this.appId = appId;
    this.token = token;
    this.onJoin = onJoin;

    const {pathname} = window.location;
    const roomId = pathname.substring(1);

    if (useUrl && roomId !== '') {
      try {
        const connectionInfo = await this.roomClient.getConnectionInfo(
          appId,
          roomId
        );
        
        onJoin(new HathoraConnection(roomId, connectionInfo));
      }
      catch (e) {
        onError(e);
      }
    }
  }

  private factoryVisibilityToggle(x: number, y: number) {
    // @ts-ignore
    const {HathoraPhaser3} = this.scene;
    const {isCreatingPublicGame: publicGame} = HathoraPhaser3;
    const publicId = `public_${uuid()}`;
    const privateId = `private_${uuid()}`;


    this.scene.add.dom(x, y).createFromHTML(`
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
      HathoraPhaser3.isCreatingPublicGame = true;
    });

    btnPrivate.addEventListener('click', () => {
      btnPublic.classList.remove('on');
      btnPrivate.classList.remove('on');

      btnPrivate.classList.add('on');
      window.localStorage.setItem(STORAGE_KEY_CREATING_PUBLIC_GAME, 'false');
      HathoraPhaser3.isCreatingPublicGame = false;
    });

    return [btnPrivate, btnPublic];
  }

  private factoryRegionSelect(x: number, y: number) {
    // @ts-ignore
    const {HathoraPhaser3} = this.scene;
    const selectId = `region_${uuid()}`;

    this.scene.add.dom(x, y).createFromHTML(`
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
      HathoraPhaser3.discoveryClient.getPingServiceEndpoints().then((regions: DiscoveryResponseInner[]) => {
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
              select.value = HathoraPhaser3.selectedRegion;
              resolve();
            }
          });
        });
      });
    });

    HathoraPhaser3.onRegionsLoad.push(pingingRegionsPromise);
    
    select.addEventListener('change', (e) => {
      // @ts-ignore
      const {value: region} = e.target;
      
      window.localStorage.setItem(STORAGE_KEY_DEFAULT_REGION, region);
      HathoraPhaser3.selectedRegion = region;
    });

    return select;
  }

  private factoryCreateGameButton(x: number, y: number, label: string = 'Create Game') {
    // @ts-ignore
    const {HathoraPhaser3} = this.scene;
    const btnId = `create_${uuid()}`;

    this.scene.add.dom(x, y).createFromHTML(`
      <button id="${btnId}" class="ha-btn">
        ${label}
      </button>
    `).setOrigin(0.5);

    const btn = document.getElementById(btnId)! as HTMLButtonElement;

    btn.disabled = true;

    Promise.all(HathoraPhaser3.onRegionsLoad).then(() => {
      btn.disabled = false;
    });

    btn.addEventListener('click', async () => {
      const {hostname} = window.location;
      const isLocal = (hostname === 'localhost');

      const lobby = await HathoraPhaser3.lobbyClient.createLobby(
        HathoraPhaser3.appId,
        HathoraPhaser3.token,
        {
          visibility: isLocal ? 'local' : HathoraPhaser3.isCreatingPublicGame ? 'public' : 'private',
          region: HathoraPhaser3.selectedRegion,
          initialConfig: {}
        }
      );

      const {roomId} = lobby;

      console.log(roomId);
      console.log(isLocal ? 'local' : HathoraPhaser3.isCreatingPublicGame ? 'public' : 'private');
      
      // const connectionInfo = await HathoraPhaser3.roomClient.getConnectionInfo(
      //   HathoraPhaser3.appId,
      //   roomId
      // );
      
      // HathoraPhaser3.onJoin(connectionInfo);
    });

    return btn;
  }

  private factoryJoinPrivateInput(x: number, y: number, label: string = 'Join') {
    const txtId = `join_private_${uuid()}`;
    const btnId = `join_private_${uuid()}`;

    this.scene.add.dom(x, y).createFromHTML(`
      <div class="ha-join-private">
        <input id="${txtId}" class="ha-text ha-text--join" />
        <button id="${btnId}" class="ha-btn ha-btn--join">
          ${label}
        </button>
      </div>
    `).setOrigin(0.5);

    const btn = document.getElementById(btnId)! as HTMLButtonElement;
    const txt = document.getElementById(txtId)! as HTMLInputElement;

    btn.addEventListener('click', () => {
      // alert(select.value);
      alert(txt.value);
    });

    return [btn, txt];
  }

  private factoryJoinPublicList(x: number, y: number, width: number = 200, height: number = 350, label: string = 'Join Public Game') {
    const listId = `public_list_${uuid()}`;

    // this.domPublicLobbyListIDs.push(listId);

    return this.scene.add.dom(x, y).createFromHTML(`
      <div class="ha-join-public" style="width: ${width}px; height: ${height}px;">
        <header class="ha-join-public__header">
          ${label}
        </header>

        <div id="${listId}" class="ha-join-public__list">
          <div class="ha-loader"></div>
      </div>
    `).setOrigin(0.5);
  }

  // private async refreshPublicLobbyLists() {
  //   // Show spinners on all lobby lists
  //   this.domPublicLobbyListIDs.forEach((id) => {
  //     const lobbyListDiv = document.getElementById(id);
      
  //     if (lobbyListDiv) {
  //       lobbyListDiv.innerHTML = `<div class="ha-loader"></div>`;
  //     }
  //   });

  //   const publicLobbies = await this.lobbyClient.listActivePublicLobbies(this.appId!, this.region);

  //   this.domPublicLobbyListIDs.forEach((id) => {
  //     const lobbyListDiv = document.getElementById(id);
  //     let listHTML = '';
      
  //     if (lobbyListDiv) {
  //       publicLobbies.forEach((lobby) => {
  //         // const 
  //         listHTML += `
  //         <div class="ha-join-public__game">
  //           <label>1d7lxrzfagao8</label>
  //           <button data-join-room-id="${lobby.roomId}" class="ha-btn ha-btn--join">
  //             Join
  //           </button>
  //         </div>
  //         `;
  //       });
  //     }
  //   });
  // }
}

export {
  HathoraPhaser,
  HathoraConnection
}