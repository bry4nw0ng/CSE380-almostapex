import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Actor from "../../Wolfie2D/DataTypes/Interfaces/Actor";
import PositionGraph from "../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import IsometricTilemap from "../../Wolfie2D/Nodes/Tilemaps/IsometricTilemap";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import Scene from "../../Wolfie2D/Scene/Scene";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import DirectStrategy from "../../Wolfie2D/Pathfinding/Strategies/DirectStrategy";
import AstarStrategy from "../Pathfinding/AstarStrategy";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import { AudioChannelType } from "../../Wolfie2D/Sound/AudioManager";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Color from "../../Wolfie2D/Utils/Color";
import TimerManager from "../../Wolfie2D/Timing/TimerManager";
import Input from "../../Wolfie2D/Input/Input";
import Timer from "../../Wolfie2D/Timing/Timer";
import { AAControls } from "../AAControls";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import NPCActor from "../Actors/NPCActor";
import PlayerActor from "../Actors/PlayerActor";
import PlayerController from "../AI/Player/PlayerController";
import Battler from "../GameSystems/BattleSystem/Battler";
import HealthbarHUD from "../GameSystems/HUD/HealthbarHUD";
import InventoryHUD from "../GameSystems/HUD/InventoryHUD";
import RelicTrayHUD from "../GameSystems/HUD/RelicTrayHUD";
import ActionSlotsHUD from "../GameSystems/HUD/ActionSlotsHUD";
import Arrow from "../GameSystems/HUD/LastEnemyArrow";
import EndArrow from "../GameSystems/HUD/NextLevelArrow";
import WaveAlerts from "../GameSystems/HUD/WaveAlerts";
import Item from "../GameSystems/ItemSystem/Item";
import Antennas from "../GameSystems/ItemSystem/Items/Antennas";
import Crystal from "../GameSystems/ItemSystem/Items/Crystal";
import DaNeedle from "../GameSystems/ItemSystem/Items/DaNeedle";
import Gum from "../GameSystems/ItemSystem/Items/Gum";
import Healthpack from "../GameSystems/ItemSystem/Items/Healthpack";
import JetPack from "../GameSystems/ItemSystem/Items/Jetpack";
import RaccoonTail from "../GameSystems/ItemSystem/Items/RaccoonTail";
import RedHat from "../GameSystems/ItemSystem/Items/RedHat";
import Shield from "../GameSystems/ItemSystem/Items/Shield";
import Kelpstache from "../GameSystems/ItemSystem/Items/Kelpstache";
import Coral from "../GameSystems/ItemSystem/Items/Coral";
import Sharkfin from "../GameSystems/ItemSystem/Items/SharkFin";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import { ClosestPositioned } from "../GameSystems/Searching/SMReducers";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import { AAEvents, AbilityEvent, BattlerEvent, CheatEvent, HudEvent, ItemEvent, PlayerEvent } from "../Events";
import MainMenu from "./MainMenu";
import GameOver from "./GameOver";
import {
    BossDef,
    EndLevelSpriteDef,
    EnemyDef,
    ItemKey,
    LayerDepthMap,
    PlayerSnapshot,
    SceneCtor,
    WaveDef,
} from "./LevelTypes";

export const PLAYER_SNAPSHOT_INIT_KEY = "playerSnapshot";

export default abstract class SMScene extends Scene {
    protected battlers: (Battler & Actor & GameNode)[];
    protected healthbars: Map<Battler & Actor & GameNode, HealthbarHUD>;
    protected shadows: Map<Battler & Actor & GameNode, Sprite>;
    protected enemyTypeMap: Map<Battler & Actor & GameNode, EnemyDef>;

    protected player: PlayerActor;

    protected walls: IsometricTilemap;
    protected wallsNC: IsometricTilemap;
    protected bothWalls: IsometricTilemap[];

    protected graph: PositionGraph;
    protected navmesh: Navmesh;
    protected spawnableNodes: number[];

    // Projectiles + damage
    protected trash: { sprite: Sprite; velocity: Vec2; stillCookin: boolean }[] = [];
    protected spitballs: { sprite: Sprite; velocity: Vec2; stillCookin: boolean }[] = [];
    protected sceneCrystals: Crystal[] = [];

    protected closestEnemy: NPCActor | null = null;
    protected needle: DaNeedle | null = null;

    protected CHEATINVINCIBLE: boolean = false;
    protected CHEATPOWGUN: boolean = false;

    // Wave runner state
    protected curWave: number;
    protected leftInCurWave: number;
    protected totSpawned: number;
    protected totInCurWave: number;
    protected curDelay: number;

    protected playerDead: boolean = false;
    protected bossDead: boolean;

    protected spawnDelayTimer: Timer;
    protected waveDelayTimer: Timer;
    protected waveTweenTimer: Timer;

    protected boss: NPCActor;

    protected waveAlerts: WaveAlerts;
    protected waveCrestSprite: AnimatedSprite | null = null;

    // HUD
    protected inventoryHud: InventoryHUD;
    protected relicTray: RelicTrayHUD;
    protected actionSlots: ActionSlotsHUD;
    protected arrow: Arrow;
    protected endArrow: EndArrow;

    protected bmZoneLabel: Label;
    protected elZoneLabel: Label;
    protected fadeOverlay: Rect;
    protected endLevelSprite: AnimatedSprite;

    // Pause menu state
    protected paused: boolean = false;
    protected pauseDim: Graphic;
    protected pauseTitle: Button;
    protected pauseButtons: Button[] = [];

    protected pauseHelpOpen: boolean = false;
    protected pauseHelpPages: Sprite[] = [];
    protected pauseHelpClose: Sprite;
    protected aboutPrev: Sprite;
    protected aboutNext: Sprite;
    protected curAboutPage: number = 0;

    protected readonly PAUSE_CLOSE_HIT = 25;

    // Shop state
    protected shopOpen: boolean = false;
    protected shopState: string;
    protected shopTitle: Button;
    protected mainButtons: Button[] = [];
    protected sellButtons: Button[] = [];
    protected buyButtons: Button[] = [];
    protected merchantSprites: Sprite[] = [];
    protected sellables: Item[] = [];
    protected forSale: Item[] = [];

    //Equippable logic
    protected sceneEquippables: Item[] = [];
    protected sharkfin: AnimatedSprite;

    protected treasure: { sprite: Sprite, stillCookin: boolean }[];

    protected pendingSnapshot: PlayerSnapshot | null = null;

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
        this.battlers = new Array<Battler & Actor & GameNode>();
        this.healthbars = new Map<Battler & Actor & GameNode, HealthbarHUD>();
        this.shadows = new Map<Battler & Actor & GameNode, Sprite>();
        this.enemyTypeMap = new Map<Battler & Actor & GameNode, EnemyDef>();
        this.spawnableNodes = [];
        this.treasure = [];

        // Wave runner state + timers. Callbacks close over `this`; HUD refs
        // (waveAlerts, waveCrestSprite) get populated in startScene before
        // any timer fires.
        this.curDelay = 0;
        this.totSpawned = 0;
        this.curWave = 0;
        this.leftInCurWave = 0;
        this.totInCurWave = 0;
        this.closestEnemy = null;
        this.bossDead = false;
        this.shopState = "main";

        this.sharkfin = null;

        this.waveTweenTimer = new Timer(3000, () => this.startWave(this.curWave), false);
        this.waveDelayTimer = new Timer(4000, () => {
            const waves = this.getWaveConfig();
            if (this.curWave >= waves.length) return;
            const wave = waves[this.curWave];
            this.playWaveAlert(wave.alertKey);
            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: wave.startSfx, loop: false, holdReference: false });
            // Original behavior: crest animation only plays from wave 2 onward
            if (this.curWave > 0 && this.waveCrestSprite) {
                this.waveCrestSprite.animation.playIfNotAlready(wave.crestKey, true);
            }
            this.waveTweenTimer.start();
        }, false);

        this.spawnDelayTimer = new Timer(this.curDelay, () => {
            if (!this.bossDead && this.totSpawned < this.totInCurWave) {
                const waves = this.getWaveConfig();
                const waveIdx = this.curWave - 1;
                if (waveIdx < 0 || waveIdx >= waves.length) {
                    this.spawnDelayTimer.pause();
                    return;
                }
                const typeKey = SMScene.pickEnemyType(waves[waveIdx].types, this.totSpawned);
                if (!typeKey) {
                    this.spawnDelayTimer.pause();
                    return;
                }
                this.spawnEnemies(typeKey);
                this.totSpawned += 1;
                console.log("Total enemies left to spawn: ", this.totSpawned, "/", this.totInCurWave);
            }
            else if (this.totSpawned == this.totInCurWave) {
                this.spawnDelayTimer.pause();
                console.log("All enemies spawned ", this.curWave);
            }
            else if (this.bossDead) {
                this.spawnDelayTimer.pause();
            }
        }, true);
    }

    public override initScene(init: Record<string, any>): void {
        super.initScene(init);
        if (init && init[PLAYER_SNAPSHOT_INIT_KEY]) {
            this.pendingSnapshot = init[PLAYER_SNAPSHOT_INIT_KEY] as PlayerSnapshot;
        }
    }

    public toggleCheatPow(): void { this.CHEATPOWGUN = !this.CHEATPOWGUN; }
    public toggleCheatInvincible(): void { this.CHEATINVINCIBLE = !this.CHEATINVINCIBLE; }

    public spawnSpitball(position: Vec2, direction: Vec2): void {
        if (this.player.sharkfinActive) {
            return;
        }
        const spitball = this.add.sprite("spitball", "primary");
        spitball.position.set(position.x, position.y);
        spitball.scale.set(1, 1);
        this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "SPITBALL", loop: false, holdReference: false });
        this.spitballs.push({ sprite: spitball, velocity: direction.scaled(120), stillCookin: true });
    }

    public spawnEnemyShot(position: Vec2, direction: Vec2, shooter: string, speed: number): void {
        const def = this.findDefByKey(shooter);
        if (!def?.shotSprites?.length) return;
        const shotSprite = def.shotSprites[Math.floor(Math.random() * def.shotSprites.length)];

        const trash = this.add.sprite(shotSprite, "primary");
        trash.position.set(position.x, position.y);
        trash.scale.set(1, 1);
        this.trash.push({ sprite: trash, velocity: direction.scaled(speed), stillCookin: true });
    }

    /** Find an EnemyDef (or BossDef) by its key. */
    protected findDefByKey(key: string): EnemyDef | null {
        const enemy = this.getEnemyTypes().find(d => d.key === key);
        if (enemy) return enemy;
        const boss = this.getBoss();
        if (boss?.key === key) return boss;
        return null;
    }

    public updateSpitballs(deltaT: number): void {
        this.spitballs.forEach((shot) => {
            if (shot.stillCookin) {
                this.battlers.forEach((battler) => {
                    if (battler instanceof NPCActor && shot.sprite.position.distanceTo(battler.position) < 20) {
                        if (this.CHEATPOWGUN) {
                            battler.health = battler.health - 500;
                        }
                        else {
                            battler.health = battler.health - 2 * this.player.damageIncrease;
                            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "ENEMY_HURT", loop: false, holdReference: false });
                        }
                        shot.sprite.visible = false;
                        shot.stillCookin = false;
                    }
                    else if (shot.sprite.position.distanceTo(this.player.position) > 1000) {
                        shot.sprite.visible = false;
                        shot.stillCookin = false;
                    }
                });
                shot.sprite.position.add(shot.velocity.clone().scaled(deltaT));
                shot.sprite.rotation = shot.sprite.rotation + deltaT * 2;
            }
            else {
                shot.sprite.destroy();
            }
        });

        this.spitballs = this.spitballs.filter((shot) => shot.stillCookin == true);
    }

    public updateEnemyShots(deltaT: number): void {
        this.trash.forEach((shot) => {
            if (shot.stillCookin) {
                if (this.player.health > 0 && !(this.player.invincible) && shot.sprite.position.distanceTo(this.player.position) < 20 && !this.CHEATINVINCIBLE) {
                    const antennas = this.player.equippables.find((equippable) => equippable instanceof Antennas);
                    if (antennas) {
                        if (antennas.curStack > 1) {
                            antennas.curStack -= 1;
                        }
                        else {
                            this.player.equippables.remove(antennas.id);
                            antennas.visible = false;
                        }
                        this.player.startIFrames();
                    }
                    else {
                        this.player.health = this.player.health - 3 * this.player.damageReduction;
                        this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "HURT", loop: false, holdReference: false, channel: AudioChannelType.CUSTOM_1 });
                        shot.sprite.visible = false;
                        shot.stillCookin = false;
                        this.player.animation.play("DAMAGE", false);
                        this.player.startIFrames();
                    }
                }
                else if (shot.sprite.position.distanceTo(this.player.position) > 2000) {
                    shot.sprite.visible = false;
                    shot.stillCookin = false;
                }
                shot.sprite.position.add(shot.velocity.clone().scaled(deltaT));
                shot.sprite.rotation = shot.sprite.rotation + deltaT * 2;
            }
            else {
                shot.sprite.destroy();
            }
        });
        this.trash = this.trash.filter((shot) => shot.stillCookin == true);
    }

    public updateShadows(): void {
        this.shadows.forEach((shadow, battler) => {
            if (battler instanceof PlayerActor) {
                if (this.player.sharkfinActive) {
                    shadow.position.set(-2000, 0);
                }  
                else {
                    shadow.position.set(battler.position.x - 4, battler.position.y + 13);
                }
            }
            else {
                const def = this.enemyTypeMap.get(battler);
                if (def) {
                    shadow.position.set(
                        battler.position.x + def.shadow.offset.x,
                        battler.position.y + def.shadow.offset.y,
                    );
                }
            }

            shadow.visible = battler.battlerActive;
        });
    }

    public updateCrystals(): void {
        this.sceneCrystals.forEach((crystal) => {
            if (crystal.position.distanceTo(this.player.position) <= 30) {
                this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "PICKUP_COIN", loop: false, holdReference: false });
                this.player.crystals += crystal.value;
                crystal.visible = false;
            }
        });
        this.sceneCrystals = this.sceneCrystals.filter((crystal) => crystal.visible);
    }

    protected handleDaNeedleUsed(needlePosition: Vec2): void {
        this.battlers.forEach((battler) => {
            if (battler instanceof NPCActor) {
                if (battler.position.distanceTo(needlePosition) < 70) {
                    battler.health = battler.health - 0.1 + (this.player.damageIncrease - 1);
                }
            }
        });
    }

    protected handleUsedGum(): void {
        this.battlers.forEach((battler) => {
            if (battler instanceof NPCActor) {
                const prevSpeed = battler.speed;
                battler.speed = battler.speed / 2;
                const activeTimer = new Timer(5000, () => battler.speed = prevSpeed, false);
                this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "GUM", loop: false, holdReference: false });
                activeTimer.start();
            }
        });
    }

    protected handleSharkFin() {
        this.player.visible = false;
        this.player.sharkfinActive = true;
        this.sharkfin.animation.play("MOVING", true);
        this.sharkfin.visible = true;
        
        this.player.toggleInvincible(true);
        let equippables = [...this.player.equippables.items()];
        console.log("equippables to hide:", equippables.length, equippables.map(e => e.constructor.name));
        equippables.forEach(equippable => {
            equippable.visible = false;
        });
        let sharkfinTimer = new Timer(5000, () => {
            this.player.visible = true;
            this.sharkfin.visible = false;
            let equippables = [...this.player.equippables.items()];
            equippables.forEach(equippable => {
                equippable.visible = true;
            });
            this.player.sharkfinActive = false;
            this.player.toggleInvincible(false);
        }, false);
        sharkfinTimer.start();
    }

    protected initLayers(): void {
        this.addLayer("primary", 3);
        this.addLayer("shadow", 2);
        this.addLayer("equippables", 5);
        this.addUILayer("fade");
        this.addUILayer("slots");
        this.addUILayer("items");
        this.getLayer("slots").setDepth(1);
        this.getLayer("items").setDepth(2);
        this.getLayer("fade").setDepth(10);
        this.getLayer("slots").setHidden(true);
        this.getLayer("items").setHidden(true);
        this.addUILayer("hud");
        this.addLayer("arrowLayer", 8);
    }

    protected initializeNavmesh(graph: PositionGraph, walls: IsometricTilemap[]): void {
        const dim: Vec2 = walls[0].getDimensions();
        for (let i = 0; i < dim.y; i++) {
            for (let j = 0; j < dim.x; j++) {
                const collider = walls[0].getTileCollider(j, i);
                graph.addPositionedNode(collider.center);
            }
        }

        let rc: Vec2;
        for (let i = 0; i < graph.numVertices; i++) {
            rc = walls[0].getTileColRow(i);
            if (!this.isWall(rc.x, rc.y) &&
                !this.isWall(MathUtils.clamp(rc.x - 1, 0, dim.x - 1), rc.y) &&
                !this.isWall(MathUtils.clamp(rc.x + 1, 0, dim.x - 1), rc.y) &&
                !this.isWall(rc.x, MathUtils.clamp(rc.y - 1, 0, dim.y - 1)) &&
                !this.isWall(rc.x, MathUtils.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !this.isWall(MathUtils.clamp(rc.x + 1, 0, dim.x - 1), MathUtils.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !this.isWall(MathUtils.clamp(rc.x - 1, 0, dim.x - 1), MathUtils.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !this.isWall(MathUtils.clamp(rc.x + 1, 0, dim.x - 1), MathUtils.clamp(rc.y - 1, 0, dim.y - 1)) &&
                !this.isWall(MathUtils.clamp(rc.x - 1, 0, dim.x - 1), MathUtils.clamp(rc.y - 1, 0, dim.y - 1))
            ) {
                rc = walls[0].getTileColRow(i + 1);
                if ((i + 1) % dim.x !== 0 && !this.isWall(rc.x, rc.y)) {
                    graph.addEdge(i, i + 1);
                }
                rc = walls[0].getTileColRow(i + dim.x);
                if (i + dim.x < graph.numVertices && !this.isWall(rc.x, rc.y)) {
                    graph.addEdge(i, i + dim.x);
                }
                this.spawnableNodes.push(i);
            }
        }

        this.navmesh = new Navmesh(graph);
        this.navmesh.registerStrategy("direct", new DirectStrategy(this.navmesh));
        this.navmesh.registerStrategy("astar", new AstarStrategy(this.navmesh));
        this.navmesh.setStrategy("astar");
        this.navManager.addNavigableEntity("navmesh", this.navmesh);
    }

    public getRandomNodePosition(): Vec2 {
        const angle = Math.PI * 2 * Math.random();
        const spawnPosX = this.player.position.x + Math.cos(angle) * 400;
        const spawnPosY = this.player.position.y + Math.sin(angle) * 400;
        const spawnPos = new Vec2(spawnPosX, spawnPosY);

        const spawnOptions = this.spawnableNodes.filter((node) => {
            return this.navmesh.graph.getNodePosition(node).distanceTo(spawnPos) < 200;
        });

        const lenOpts = spawnOptions.length;
        let choice: number;
        if (lenOpts > 0) {
            choice = spawnOptions[Math.floor(Math.random() * lenOpts)];
        }
        else {
            choice = this.spawnableNodes[Math.floor(Math.random() * this.spawnableNodes.length)];
        }
        return this.navmesh.graph.getNodePosition(choice);
    }

    // TODO: replace hardcoded pool with getDropItemPool() + ItemRegistry.itemFromKey()
    // TODO: split into dropItemAtPosition(pos) and setShopSlot(i) to kill the 999 sentinel
    //Added a choice to also drop a chosen item
    public dropOrChooseItem(position: Vec2, i: number, abilityChoice: Item | number | null): void {
        let choice;

        if (abilityChoice instanceof Item) {
            choice = this.getAbilityNumber(abilityChoice);
        }
        else if (typeof abilityChoice === "number") {
            choice = abilityChoice
        }
        else {
            choice = Math.floor(Math.random() * 7);
        }

        let sprite: Sprite;
        let newOb: Item;
        switch (choice) {
            case 0:
                sprite = this.add.sprite("Shield", "equippables");
                newOb = new Shield(sprite);
                break;
            case 1:
                sprite = this.add.sprite("RedHat", "equippables");
                newOb = new RedHat(sprite);
                break;
            case 2:
                sprite = this.add.sprite("JetPack", "equippables");
                newOb = new JetPack(sprite);
                break;
            case 3:
                sprite = this.add.sprite("healthpack", "equippables");
                newOb = new Healthpack(sprite);
                break;
            case 4:
                sprite = this.add.sprite("Gum", "equippables");
                newOb = new Gum(sprite);
                break;
            case 5:
                sprite = this.add.sprite("DaNeedle", "equippables");
                newOb = new DaNeedle(sprite);
                break;
            case 6:
                sprite = this.add.sprite("Antennas", "equippables");
                newOb = new Antennas(sprite);
                break;
            //Make sure random never reaches the boss items, just for drop mechanics
            case 100:
                sprite = this.add.sprite("Sharkfin", "equippables");
                sprite.rotation = Math.PI / 8;
                sprite.scale.set(0.5, 0.5);
                newOb = new Sharkfin(sprite);
                break;
            case 200:
                sprite = this.add.sprite("RaccoonTail", "equippables");
                newOb = new RaccoonTail(sprite);
                break;
            default:
                return;
        }
        if (i == 999) {
            newOb.position.set(position.x, position.y);
            this.sceneEquippables.push(newOb);
        }
        else {
            sprite.visible = false;
            newOb.position.set(0, -500);
            this.forSale[i] = newOb;
        }
    }

    protected getAbilityNumber(item: Item): number {
        if (item instanceof Gum) {
            return 4;
        }
        else if (item instanceof JetPack) {
            return 2;
        }
        else if (item instanceof RaccoonTail) {
            return 200;
        }
        else if (item instanceof Sharkfin) {
            return 100;
        }
    }

    private makeItemFromKey(key: ItemKey): Item | null {
        let sprite: Sprite;
        switch (key) {
            case "Shield":
                sprite = this.add.sprite("Shield", "equippables");
                return new Shield(sprite);
            case "RedHat":
                sprite = this.add.sprite("RedHat", "equippables");
                return new RedHat(sprite);
            case "JetPack":
                sprite = this.add.sprite("JetPack", "equippables");
                return new JetPack(sprite);
            case "Gum":
                sprite = this.add.sprite("Gum", "equippables");
                return new Gum(sprite);
            case "DaNeedle":
                sprite = this.add.sprite("DaNeedle", "equippables");
                return new DaNeedle(sprite);
            case "Antennas":
                sprite = this.add.sprite("Antennas", "equippables");
                return new Antennas(sprite);
            case "RaccoonTail":
                sprite = this.add.sprite("RaccoonTail", "equippables");
                return new RaccoonTail(sprite);
            case "Coral":
                sprite = this.add.sprite("Coral", "equippables");
                sprite.scale.set(0.75, 0.75);
                return new Coral(sprite);
            case "Sharkfin":
                sprite = this.add.sprite("Sharkfin", "equippables");
                sprite.rotation = Math.PI / 8;
                sprite.scale.set(0.5, 0.5);
                return new Sharkfin(sprite);
            case "Kelpstache":
                sprite = this.add.sprite("Kelpstache", "equippables");
                return new Kelpstache(sprite);
            default:
                return null;
        }
    }

    private getItemKey(item: Item): ItemKey | null {
        if (item instanceof Shield) return "Shield";
        if (item instanceof RedHat) return "RedHat";
        if (item instanceof JetPack) return "JetPack";
        if (item instanceof Gum) return "Gum";
        if (item instanceof DaNeedle) return "DaNeedle";
        if (item instanceof Antennas) return "Antennas";
        if (item instanceof RaccoonTail) return "RaccoonTail";
        if (item instanceof Coral) return "Coral";
        if (item instanceof Sharkfin) return "Sharkfin";
        if (item instanceof Kelpstache) return "Kelpstache";
        return null;
    }

    protected buildPlayerSnapshot(): PlayerSnapshot {
        const equippables: PlayerSnapshot["equippables"] = [];
        for (const item of this.player.equippables.items()) {
            const key = this.getItemKey(item);
            if (key !== null) {
                equippables.push({ key, stack: item.curStack });
            }
        }
        return {
            health: this.player.health,
            crystals: this.player.crystals,
            equippables,
        };
    }

    protected applyPlayerSnapshot(player: PlayerActor, snapshot: PlayerSnapshot): void {
        player.health = Math.min(snapshot.health, player.maxHealth);
        player.crystals = snapshot.crystals;
        for (const entry of snapshot.equippables) {
            const item = this.makeItemFromKey(entry.key);
            if (item === null) continue;
            item.curStack = entry.stack;
            player.equip(item);
        }
    }

    protected initShopMenu(): void {
        const cx = 256;
        const cy = 256;

        this.shopTitle = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
            position: new Vec2(cx, cy - 90),
            text: "Shhh...",
        });
        this.shopTitle.size.set(200, 30);
        this.shopTitle.borderWidth = 0;
        this.shopTitle.backgroundColor = new Color(0, 0, 0, 0);
        this.shopTitle.textColor = Color.WHITE;
        this.shopTitle.fontSize = 24;
        this.shopTitle.visible = false;
        this.shopTitle.position.set(256, 100);

        const shhButtons: [string, string][] = [
            ["Buy", "buy"],
            ["Sell", "sell"],
            ["Resume", "resume"],
        ];

        const buyerButtons: [string, string | null][] = [
            ["", null],
            ["", null],
            ["", null],
            ["Reset Shop for 100 crystals", "reset_shop"],
        ];

        const startY = cy - 126;
        const spacing = 35;

        for (let i = 0; i < shhButtons.length; i++) {
            const [label, eventId] = shhButtons[i];
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
                position: new Vec2(cx, startY + i * spacing),
                text: label,
            });
            btn.size.set(200, 28);
            btn.borderWidth = 2;
            btn.borderColor = Color.WHITE;
            btn.backgroundColor = new Color(60, 60, 60, 200);
            btn.textColor = Color.WHITE;
            btn.fontSize = 16;
            if (eventId) {
                btn.onClickEventId = eventId;
            }
            btn.visible = false;
            this.mainButtons.push(btn);
        }

        for (let i = 0; i < buyerButtons.length; i++) {
            const [label, eventId] = buyerButtons[i];
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
                position: new Vec2(cx, startY + i * spacing),
                text: label,
            });
            btn.size.set(200, 40);
            btn.borderWidth = 2;
            btn.borderColor = Color.WHITE;
            btn.backgroundColor = new Color(60, 60, 60, 200);
            btn.textColor = Color.WHITE;
            btn.fontSize = 16;
            btn.onClickEventId = eventId;
            btn.visible = false;
            this.buyButtons.push(btn);
        }

        this.buyButtons[3].size.set(500, 40);

        this.receiver.subscribe("buy");
        this.receiver.subscribe("sell");
        this.receiver.subscribe("reset_shop");

        this.pauseHelpClose = this.add.sprite("back-button", "pauseOverlay");
        this.pauseHelpClose.position.set(50, 50);
        this.pauseHelpClose.scale.set(3, 3);
        this.pauseHelpClose.visible = false;

        this.setBuyItems();
    }

    public openBuyMenu(): void {
        this.shopState = "buy";

        for (const btn of this.mainButtons) btn.visible = false;

        this.shopTitle.text = "Buy";

        const cx = 256;
        const startY = 130;
        const spacing = 35;

        for (let i = 0; i < 3; i++) {
            const equippable = this.forSale[i];
            let tray: Sprite;
            if (equippable) {
                this.buyButtons[i].text = `Buy for ${equippable.value}`;
                if (equippable instanceof DaNeedle) {
                    this.buyButtons[i].textColor = Color.RED;
                    tray = this.add.sprite("tray_red", "pauseOverlay");
                }
                else if (equippable.isAbility) {
                    this.buyButtons[i].textColor = Color.BLUE;
                    tray = this.add.sprite("tray_blue", "pauseOverlay");
                }
                else {
                    this.buyButtons[i].textColor = Color.WHITE;
                    tray = this.add.sprite("tray_gray", "pauseOverlay");
                }
                tray.position.set(cx - 90, startY + i * spacing);
                this.merchantSprites.push(tray);

                const sprite = equippable.getSprite().imageId;
                const spriteOverlay = this.add.sprite(sprite, "pauseOverlay");
                spriteOverlay.position.set(cx - 90, startY + i * spacing);
                this.merchantSprites.push(spriteOverlay);
            }
            else {
                this.buyButtons[i].text = "GONE...SOLD";
            }
        }
        for (const btn of this.buyButtons) btn.visible = true;
        this.pauseHelpClose.visible = true;
    }

    public openSellMenu(): void {
        this.shopState = "sell";

        for (const btn of this.mainButtons) btn.visible = false;
        for (const btn of this.sellButtons) btn.destroy();
        this.sellButtons = [];
        for (const sprite of this.merchantSprites) sprite.destroy();
        this.merchantSprites = [];
        this.sellables = [];

        this.shopTitle.text = "Sell";
        this.pauseHelpClose.visible = true;

        const cx = 256;
        const startY = 130;
        const spacing = 35;

        let i = 0;

        const equippables = [...this.player.equippables.items()];
        equippables.forEach((equippable) => {
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
                position: new Vec2(cx + 50, startY + i * spacing),
                text: `Sell for ${Math.floor(equippable.value / 2)} crystals?`,
            });
            btn.size.set(400, 28);
            btn.borderWidth = 2;
            btn.borderColor = Color.WHITE;
            btn.backgroundColor = new Color(60, 60, 60, 200);
            let tray: Sprite;
            if (equippable instanceof DaNeedle) {
                btn.textColor = Color.RED;
                tray = this.add.sprite("tray_red", "pauseOverlay");
            }
            else if (equippable.isAbility) {
                btn.textColor = Color.BLUE;
                tray = this.add.sprite("tray_blue", "pauseOverlay");
            }
            else {
                btn.textColor = Color.WHITE;
                tray = this.add.sprite("tray_gray", "pauseOverlay");
            }
            btn.fontSize = 16;
            btn.visible = true;
            this.sellables.push(equippable);
            this.sellButtons.push(btn);

            tray.position.set(cx - 90, startY + i * spacing);
            this.merchantSprites.push(tray);

            const sprite = equippable.getSprite().imageId;
            const spriteOverlay = this.add.sprite(sprite, "pauseOverlay");
            spriteOverlay.position.set(cx - 90, startY + i * spacing);
            this.merchantSprites.push(spriteOverlay);

            i++;
        });
    }

    public sellEquippable(id: number): void {
        const equippable = this.player.equippables.find(b => b.id === id);
        this.player.crystals += Math.floor(equippable.value / 2);
        if (equippable instanceof DaNeedle) {
            this.needle = null;
            this.player.hasNeedle = false;
        }
        if (equippable.curStack > 1) {
            equippable.curStack -= 1;
            equippable.removeBuff(this.player);
        }
        else {
            this.player.unEquip(equippable);
            equippable.visible = false;
        }
        this.openSellMenu();
    }

    public buyEquippable(equippable: Item, i: number): void {
        if (!equippable || this.player.crystals < equippable.value) {
            return;
        }
        this.player.crystals -= equippable.value;
        equippable.position.set(this.player.position.x, this.player.position.y);
        equippable.visible = true;
        this.sceneEquippables.push(equippable);

        this.forSale[i] = null;
        this.buyButtons[i].text = "GONE...SOLD";
    }

    protected setBuyItems(): void {
        for (let i = 0; i < 3; i++) {
            this.dropOrChooseItem(new Vec2(0, 0), i, null);
        }
    }

    protected initPauseMenu(): void {
        this.addUILayer("pause");
        this.getLayer("pause").setDepth(10);
        this.addUILayer("pauseOverlay");
        this.getLayer("pauseOverlay").setDepth(11);

        const cx = 256;
        const cy = 256;

        this.pauseDim = this.add.graphic(GraphicType.RECT, "pause", {
            position: new Vec2(cx, cy),
            size: new Vec2(512, 512),
        });
        this.pauseDim.color = new Color(0, 0, 0, 0.7);
        this.pauseDim.visible = false;

        this.pauseTitle = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
            position: new Vec2(cx, cy - 90),
            text: "PAUSED",
        });
        this.pauseTitle.size.set(300, 40);
        this.pauseTitle.borderWidth = 0;
        this.pauseTitle.backgroundColor = new Color(0, 0, 0, 0);
        this.pauseTitle.textColor = Color.WHITE;
        this.pauseTitle.fontSize = 24;
        this.pauseTitle.visible = false;

        const buttonDefs: [string, string][] = [
            ["Resume",          "resume"],
            ["RESET to menu",   "pause_mainmenu"],
            ["Controls",        "pause_controls"],
            ["About",           "pause_about"],
            ["Help",            "pause_help"],
            ["Cheats",          "pause_cheats"],
        ];

        const startY = cy - 50;
        const spacing = 35;

        for (let i = 0; i < buttonDefs.length; i++) {
            const [label, eventId] = buttonDefs[i];
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
                position: new Vec2(cx, startY + i * spacing),
                text: label,
            });
            btn.size.set(300, 35);
            btn.borderWidth = 2;
            btn.borderColor = Color.WHITE;
            btn.backgroundColor = new Color(60, 60, 60, 200);
            btn.textColor = Color.WHITE;
            btn.fontSize = 16;
            btn.onClickEventId = eventId;
            btn.visible = false;
            this.pauseButtons.push(btn);
        }

        this.receiver.subscribe("resume");
        this.receiver.subscribe("pause_mainmenu");
        this.receiver.subscribe("pause_controls");
        this.receiver.subscribe("pause_about");
        this.receiver.subscribe("pause_help");
        this.receiver.subscribe("pause_cheats");

        this.pauseHelpPages = [
            this.add.sprite("about1",   "pauseOverlay"),
            this.add.sprite("about2",   "pauseOverlay"),
            this.add.sprite("about3",   "pauseOverlay"),
            this.add.sprite("help",     "pauseOverlay"),
            this.add.sprite("controls", "pauseOverlay"),
            this.add.sprite("cheats",   "pauseOverlay"),
        ];
        for (const page of this.pauseHelpPages) {
            page.position.set(cx, cy);
            page.scale.set(1.5, 1.5);
            page.visible = false;
        }

        this.pauseHelpClose = this.add.sprite("back-button", "pauseOverlay");
        this.pauseHelpClose.position.set(50, 50);
        this.pauseHelpClose.scale.set(3, 3);
        this.pauseHelpClose.visible = false;

        this.aboutNext = this.add.sprite("back-button", "pauseOverlay");
        this.aboutNext.invertX = true;
        this.aboutNext.position.set(cx + 200, cy);
        this.aboutNext.scale.set(2, 2);
        this.aboutNext.visible = false;

        this.aboutPrev = this.add.sprite("back-button", "pauseOverlay");
        this.aboutPrev.position.set(cx - 200, cy);
        this.aboutPrev.scale.set(2, 2);
        this.aboutPrev.visible = false;
    }

    protected pauseGame(): void {
        this.paused = true;

        TimerManager.getInstance().pauseAllTimers();
        this.getLayer("primary").setPaused(true);
        this.getLayer("equippables").setPaused(true);

        for (const battler of this.battlers) {
            battler.freeze();
            battler.aiActive = false;
        }

        this.pauseDim.visible = true;
        if (this.shopOpen) {
            this.shopTitle.visible = true;
            for (const btn of this.mainButtons) btn.visible = true;
        }
        else {
            this.pauseTitle.visible = true;
            for (const btn of this.pauseButtons) btn.visible = true;
        }
    }

    protected resumeGame(): void {
        this.paused = false;
        TimerManager.getInstance().unpauseAllTimers();

        this.getLayer("primary").setPaused(false);
        this.getLayer("equippables").setPaused(false);

        for (const battler of this.battlers) {
            battler.unfreeze();
            battler.aiActive = true;
        }

        this.pauseDim.visible = false;
        this.aboutNext.visible = false;
        this.aboutPrev.visible = false;

        if (this.shopOpen) {
            this.shopOpen = false;
            this.shopTitle.visible = false;
            for (const btn of this.mainButtons) btn.visible = false;
            for (const btn of this.sellButtons) btn.destroy();
            for (const btn of this.buyButtons) btn.visible = false;
            for (const sprite of this.merchantSprites) sprite.visible = false;
            this.pauseHelpClose.visible = false;
            this.shopState = "main";
            this.sellButtons = [];
            this.sellables = [];
            this.merchantSprites = [];
        }
        else {
            this.pauseTitle.visible = false;
            for (const btn of this.pauseButtons) btn.visible = false;
        }

        if (this.pauseHelpOpen) {
            this.pauseHelpOpen = false;
            for (const page of this.pauseHelpPages) page.visible = false;
            this.pauseHelpClose.visible = false;
        }
    }

    protected openPauseHelp(page: number): void {
        this.pauseHelpOpen = true;
        this.pauseTitle.visible = false;
        for (const btn of this.pauseButtons) btn.visible = false;
        for (let i = 0; i < this.pauseHelpPages.length; i++) {
            this.pauseHelpPages[i].visible = i === page;
        }
        this.pauseHelpClose.visible = true;

        if (page < 3 && page >= 0) {
            this.aboutPrev.visible = this.curAboutPage > 0;
            this.aboutNext.visible = this.curAboutPage < 2;
        }
    }

    protected closePauseHelp(): void {
        this.pauseHelpOpen = false;
        for (const page of this.pauseHelpPages) page.visible = false;
        this.pauseHelpClose.visible = false;
        this.pauseTitle.visible = true;
        this.aboutNext.visible = false;
        this.aboutPrev.visible = false;
        for (const btn of this.pauseButtons) btn.visible = true;
    }

    public startWave(waveNum: number): void {
        const waves = this.getWaveConfig();
        if (waveNum < 0 || waveNum >= waves.length) return;
        const wave = waves[waveNum];

        console.log(`Wave ${waveNum + 1} starting`);
        this.curWave = waveNum + 1;
        this.totSpawned = 0;
        this.leftInCurWave = wave.count;
        this.totInCurWave = wave.count;
        this.curDelay = wave.delayMs;
        this.spawnDelayTimer.start(this.curDelay);

        const boss = this.getBoss();
        if (boss && boss.spawnTrigger === "after_final_wave" && waveNum === waves.length - 1) {
            this.spawnBoss();
        }
    }

    public spawnBoss(): void {
        const def = this.getBoss();
        if (!def) return;

        const boss = this.add.animatedSprite(NPCActor, def.spritesheetKey, "primary");
        boss.position.copy(def.spawnPosition);
        boss.addPhysics(def.hitbox, null, false);
        boss.scale.copy(def.scale);

        const healthbar = new HealthbarHUD(this, boss, "primary", {
            size: boss.size.clone().scaled(1, 1 / 4),
            offset: boss.size.clone().scaled(0, -1 / 2),
        });
        this.healthbars.set(boss, healthbar);
        healthbar.visible = false;

        boss.battleGroup = def.battleGroup;
        boss.speed = def.speed;
        boss.health = def.health;
        boss.maxHealth = def.maxHealth;
        boss.navkey = "navmesh";
        boss.addAI(def.ai.ctor, { ...def.ai.opts, target: this.player });
        boss.animation.play("IDLE");

        this.boss = boss;
        this.battlers.push(boss);
        // Boss intentionally has no shadow (matches original behavior).
    }

    public spawnEnemies(typeKey: string): void {
        const def = this.getEnemyTypes().find(d => d.key === typeKey);
        if (!def) {
            console.error(`spawnEnemies: no EnemyDef found for "${typeKey}"`);
            return;
        }

        const spawnPos = this.getRandomNodePosition();
        const npc = this.add.animatedSprite(NPCActor, def.spritesheetKey, "primary");
        npc.position.set(spawnPos.x, spawnPos.y);
        npc.battleGroup = def.battleGroup;
        npc.speed = def.speed;
        npc.health = def.health;
        npc.maxHealth = def.maxHealth;
        npc.addPhysics(def.hitbox, null, false);
        npc.navkey = "navmesh";
        npc.addAI(def.ai.ctor, { ...def.ai.opts, target: this.player });
        npc.scale.copy(def.scale);

        const npcShadow = this.add.sprite("generic-shadow", "shadow");
        npcShadow.position.set(spawnPos.x + def.shadow.offset.x, spawnPos.y + def.shadow.offset.y);
        npcShadow.scale.copy(def.shadow.scale);
        npcShadow.alpha = def.shadow.alpha;
        npcShadow.visible = false;

        const healthbar = new HealthbarHUD(this, npc, "primary", {
            size: npc.size.clone().scaled(1, 1 / 4),
            offset: npc.size.clone().scaled(0, -1 / 2),
        });
        this.healthbars.set(npc, healthbar);
        this.shadows.set(npc, npcShadow);
        this.enemyTypeMap.set(npc, def);
        healthbar.visible = false;

        npc.animation.play("WALK");

        this.battlers.push(npc);
    }

    /**
     * Picks the enemy type to spawn at a given index within a wave, based on
     * the cumulative distribution in WaveDef.types. Returns null if index
     * exceeds the wave's total count.
     */
    protected static pickEnemyType(types: { key: string; count: number }[], spawnIndex: number): string | null {
        let cumulative = 0;
        for (const t of types) {
            cumulative += t.count;
            if (spawnIndex < cumulative) return t.key;
        }
        return null;
    }

    /**
     * Plays the wave-incoming alert by key. Wave alerts are part of the HUD
     * and use enumerated method names on WaveAlerts — this maps the key to
     * the right call.
     */
    protected playWaveAlert(alertKey: string): void {
        if (!this.waveAlerts) return;
        switch (alertKey) {
            case "WAVE_1": this.waveAlerts.playWave1Incoming(); break;
            case "WAVE_2": this.waveAlerts.playWave2Incoming(); break;
            case "WAVE_3": this.waveAlerts.playWave3Incoming(); break;
            case "BOSS":   this.waveAlerts.playBossIncoming(); break;
        }
    }

    public updateContactDamage(): void {
        this.closestEnemy = null;
        this.battlers.forEach((battler) => {
            if (!(battler instanceof NPCActor)) {
                return;
            }

            const distToPlayer = battler.position.distanceTo(this.player.position);
            if (!this.closestEnemy || this.player.position.distanceTo(this.closestEnemy.position) > this.player.position.distanceTo(battler.position)) {
                this.closestEnemy = battler;
            }

            if (this.CHEATINVINCIBLE) {
                return;
            }

            if (this.player.health > 0 && !(this.player.invincible) && distToPlayer < 20) {
                const antennas = this.player.equippables.find((equippable) => equippable instanceof Antennas);
                if (antennas) {
                    if (antennas.curStack > 1) {
                        antennas.curStack -= 1;
                    }
                    else {
                        this.player.equippables.remove(antennas.id);
                        antennas.visible = false;
                    }
                    this.player.startIFrames();
                }
                else {
                    if (battler.health > 0) {
                        this.player.health = this.player.health - 3 * this.player.damageReduction;
                        this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "HURT", loop: false, holdReference: false });
                        this.player.animation.play("DAMAGE", false);
                        this.player.startIFrames();
                    }
                }
            }
        });
    }

    public getBattlers(): Battler[] { return this.battlers; }

    public getWalls(): IsometricTilemap { return this.walls; }

    public getNavmesh(): Navmesh { return this.navmesh; }

    public getPlayer(): PlayerActor { return this.player; }

    protected isWall(col: number, row: number): boolean {
        if (!this.bothWalls) return false;
        let isReallyWall = false;
        this.bothWalls.forEach((walltype) => {
            if (walltype.getTile(col, row) !== 0) {
                isReallyWall = true;
            }
        });
        return isReallyWall;
    }

    public isTargetVisible(position: Vec2, target: Vec2): boolean {
        const walls = this.getWalls();
        if (!walls) return true;

        const start = position.clone();
        const delta = target.clone().sub(start);

        const minX = Math.min(start.x, target.x);
        const maxX = Math.max(start.x, target.x);
        const minY = Math.min(start.y, target.y);
        const maxY = Math.max(start.y, target.y);

        const minIndex = walls.getTilemapPosition(minX, minY);
        const maxIndex = walls.getTilemapPosition(maxX, maxY);
        const tileSize = walls.getScaledTileSize();

        for (let col = minIndex.x; col <= maxIndex.x; col++) {
            for (let row = minIndex.y; row <= maxIndex.y; row++) {
                if (this.isWall(col, row)) {
                    const tilePos = walls.getWorldPosition(col, row);
                    const collider = new AABB(tilePos, tileSize.scaled(1 / 2));
                    const hit = collider.intersectSegment(start, delta, Vec2.ZERO);
                    if (hit !== null && start.distanceSqTo(hit.pos) < start.distanceSqTo(target)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    public abstract getLevelKey(): string;

    public abstract getTilemapKey(): string;

    public abstract getTilemapPath(): string;

    public abstract getSpawnPosition(): Vec2;

    public abstract getLayerDepthMap(): LayerDepthMap;

    public abstract getMusicKey(): string;

    public abstract getMusicPath(): string;

    public abstract getEnemyTypes(): EnemyDef[];

    public abstract getBoss(): BossDef | null;

    public abstract getWaveConfig(): WaveDef[];

    public abstract getShopInventory(): Item[];

    public abstract getDropItemPool(): ItemKey[];

    public abstract getEndLevelLocation(): Vec2;

    public abstract getEndLevelLabel(): string;

    public abstract getEndLevelSprite(): EndLevelSpriteDef;

    public abstract getNextLevel(): SceneCtor | null;

    // Optional level overrides

    /**
     * Position of the merchant. Subclasses override to enable shop interaction.
     * Returning null disables the teleport-to-merchant cheat.
     */
    public getMerchantPosition(): Vec2 | null { return null; }

    /**
     * Hook for subclasses to handle level-specific events. Return true to
     * indicate the event was handled, false to fall through to the default
     * SMScene handler (which throws on unknown events).
     */
    protected handleLevelEvent(_event: GameEvent): boolean { return false; }

    /**
     * Initialize the player, HUD, and arrows. Spawn position from getSpawnPosition().
     */
    protected initializePlayer(): PlayerActor {
        const player = this.add.animatedSprite(PlayerActor, "player1", "primary");
        const playerShadow = this.add.sprite("generic-shadow", "shadow");
        const spawnPos = this.getSpawnPosition();
        player.position.copy(spawnPos);

        playerShadow.position.set(spawnPos.x + 8, spawnPos.y + 6);
        playerShadow.scale.set(1.15, 1);
        playerShadow.alpha = 0.8;
        this.shadows.set(player, playerShadow);

        player.battleGroup = 2;
        player.health = 10;
        player.maxHealth = 10;

        player.abilities.onChange = ItemEvent.INVENTORY_CHANGED;
        this.inventoryHud = new InventoryHUD(this, player.abilities, "inventorySlot", {
            start: new Vec2(232, 24),
            slotLayer: "slots",
            padding: 3,
            itemLayer: "items",
        });

        player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), Vec2.ZERO, true, false);
        player.scale.set(1, 1);

        const healthbar = new HealthbarHUD(this, player, "hud", {
            size: new Vec2(400, 25),
            offset: Vec2.ZERO,
            static: true,
            staticPosition: new Vec2(115, 25),
        });
        this.healthbars.set(player, healthbar);

        const healthbarSprite = this.add.animatedSprite(AnimatedSprite, "healthbar", "hud");
        healthbarSprite.scale.set(1.6, 1.8);
        healthbar.switchToAnimatedHB(healthbarSprite);

        const waveCrest = this.add.animatedSprite(AnimatedSprite, "wave_crest", "hud");
        waveCrest.position.set(125, -38);
        waveCrest.scale.set(1.6, 1.8);
        waveCrest.animation.play("WAVE_1", true);
        this.waveCrestSprite = waveCrest;

        this.relicTray = new RelicTrayHUD(this, player.equippables, "hud", {
            position: new Vec2(115, 50),
            size: new Vec2(400, 60),
            iconSize: 25,
            padding: 8,
        });

        this.actionSlots = new ActionSlotsHUD(this, "hud", player.equippables, player.abilities, {
            startX: 200,
            topY: -4,
            height: 92,
            boxWidth: 92,
            weaponAbilityGap: 20,
            abilityGap: -35,
        }, player);

        player.addAI(PlayerController);
        player.animation.play("IDLE");

        this.battlers.push(player);
        this.viewport.follow(player);

        this.player = player;

        if (this.pendingSnapshot !== null) {
            this.applyPlayerSnapshot(player, this.pendingSnapshot);
            this.pendingSnapshot = null;
        }

        const arrowSprite = this.add.sprite("arrowSprite", "arrowLayer");
        const endArrowSprite = this.add.sprite("endArrowSprite", "arrowLayer");
        this.arrow = new Arrow(arrowSprite, this.player);
        this.endArrow = new EndArrow(endArrowSprite, this.player);

        return player;
    }

    public override updateScene(deltaT: number): void {
        if (this.handlePauseInput()) return;

        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }

        this.inventoryHud.update(deltaT);
        this.relicTray.update(deltaT);
        this.actionSlots.update(deltaT);

        // Merchant proximity
        const merchantPos = this.getMerchantPosition();
        if (merchantPos) {
            if (this.player.position.distanceTo(merchantPos) < 30) {
                this.bmZoneLabel.visible = true;
                if (Input.isJustPressed(AAControls.INTERACT) && this.shopOpen == false) {
                    this.shopOpen = true;
                    this.pauseGame();
                }
            }
            else {
                this.bmZoneLabel.visible = false;
            }
        }

        // End-level proximity
        const exitPos = this.getEndLevelLocation();
        const exitSpec = this.getEndLevelSprite();
        if (this.endLevelSprite) {
            if (this.player.position.distanceTo(exitPos) < 30) {
                this.elZoneLabel.visible = true;
                if (!this.endLevelSprite.animation.isPlaying(exitSpec.opening) &&
                    !this.endLevelSprite.animation.isPlaying(exitSpec.idleOpen)) {
                    this.endLevelSprite.animation.playIfNotAlready(exitSpec.opening, false);
                    this.endLevelSprite.animation.queue(exitSpec.idleOpen, true);
                }
                if (Input.isJustPressed(AAControls.INTERACT) && this.bossDead) {
                    const next = this.getNextLevel();
                    if (next) {
                        this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
                        this.sceneManager.changeToScene(next, {
                            [PLAYER_SNAPSHOT_INIT_KEY]: this.buildPlayerSnapshot(),
                        });
                    }
                }
            }
            else {
                if (!this.endLevelSprite.animation.isPlaying(exitSpec.closing) &&
                    !this.endLevelSprite.animation.isPlaying(exitSpec.idleClosed)) {
                    this.endLevelSprite.animation.playIfNotAlready(exitSpec.closing, false);
                    this.endLevelSprite.animation.queue(exitSpec.idleClosed, true);
                }
                this.elZoneLabel.visible = false;
            }
        }

        // Healthbars: only update those visible (cheaper than every frame).
        this.healthbars.forEach((healthbar, battler) => {
            if (battler instanceof PlayerActor) {
                healthbar.update(deltaT);
                return;
            }
            if (battler.position.distanceTo(this.player.position) < 300 && battler.health < battler.maxHealth) {
                healthbar.visible = true;
            }
            if (healthbar.visible) {
                healthbar.update(deltaT);
            }
            else {
                healthbar.followNPC();
            }
        });

        this.updateEnemyShots(deltaT);
        this.updateSpitballs(deltaT);
        this.updateContactDamage();
        this.updateCrystals();
        this.updateShadows();

        if (this.closestEnemy && this.player.position.distanceTo(this.closestEnemy.position) > 300) {
            this.arrow.update(deltaT, this.closestEnemy);
        }
        else {
            this.arrow.visible = false;
        }

        if (this.bossDead && this.player.position.distanceTo(exitPos) > 100) {
            this.endArrow.update(deltaT, exitPos);
        }
        else {
            this.endArrow.visible = false;
        }

        if (this.player.hasNeedle && this.needle.isSpinning) {
            this.handleDaNeedleUsed(this.needle.position);
        }

        if (this.player.sharkfinActive) {
            this.sharkfin.position.copy(this.player.position);
        }
    }

    /**
     * Handles ESC + paused-state mouse input (help nav, shop clicks).
     * Returns true if the game is paused — caller should skip remaining
     * gameplay updates for this frame.
     */
    protected handlePauseInput(): boolean {
        if (Input.isKeyJustPressed("escape")) {
            if (this.pauseHelpOpen) {
                this.closePauseHelp();
            } else if (this.paused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        }

        if (!this.paused) return false;

        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
        const mouse = Input.getMousePressPosition();
        const close = this.pauseHelpClose.position;

        if (this.pauseHelpOpen && Input.isMouseJustPressed()) {
            if (Math.abs(mouse.x - close.x) <= this.PAUSE_CLOSE_HIT &&
                Math.abs(mouse.y - close.y) <= this.PAUSE_CLOSE_HIT) {
                this.closePauseHelp();
                return true;
            }

            const next = this.aboutNext.position;
            if (this.aboutNext.visible &&
                Math.abs(mouse.x - next.x) <= this.PAUSE_CLOSE_HIT &&
                Math.abs(mouse.y - next.y) <= this.PAUSE_CLOSE_HIT) {
                this.curAboutPage += 1;
                this.openPauseHelp(this.curAboutPage);
                return true;
            }

            const prev = this.aboutPrev.position;
            if (this.aboutPrev.visible &&
                Math.abs(mouse.x - prev.x) <= this.PAUSE_CLOSE_HIT &&
                Math.abs(mouse.y - prev.y) <= this.PAUSE_CLOSE_HIT) {
                this.curAboutPage -= 1;
                this.openPauseHelp(this.curAboutPage);
                return true;
            }
        }

        if (this.shopOpen && Input.isMouseJustPressed()) {
            if (Math.abs(mouse.x - close.x) <= this.PAUSE_CLOSE_HIT &&
                Math.abs(mouse.y - close.y) <= this.PAUSE_CLOSE_HIT) {
                for (const btn of this.sellButtons) btn.destroy();
                for (const btn of this.buyButtons) btn.visible = false;
                for (const sprite of this.merchantSprites) sprite.visible = false;
                for (const btn of this.mainButtons) btn.visible = true;
                this.pauseHelpClose.visible = false;
                this.shopTitle.text = "Shhh...";
                this.shopState = "main";
                this.sellButtons = [];
                this.sellables = [];
                this.merchantSprites = [];
                return true;
            }
            if (this.shopState == "sell") {
                let i = 0;
                this.sellButtons.forEach((btn) => {
                    if (Math.abs(mouse.x - btn.position.x) <= btn.size.x / 2 &&
                        Math.abs(mouse.y - btn.position.y) <= btn.size.y / 2) {
                        this.sellEquippable(this.sellables[i].id);
                    }
                    i++;
                });
            }
            else if (this.shopState == "buy") {
                let i = 0;
                this.buyButtons.forEach((btn) => {
                    if (Math.abs(mouse.x - btn.position.x) <= btn.size.x / 2 &&
                        Math.abs(mouse.y - btn.position.y) <= btn.size.y / 2) {
                        this.buyEquippable(this.forSale[i], i);
                    }
                    i++;
                });
            }
        }
        return true;
    }

    /**
     * Loads assets shared across all levels (player, HUD, items, pause book,
     * audio, merchant, etc.). Driven by getTilemapKey/Path and getMusicKey/Path
     * for the per-level tilemap and music.
     */
    protected loadSharedAssets(): void {
        // Tilemap + music driven by per-level getters
        this.load.tilemap(this.getTilemapKey(), this.getTilemapPath());
        this.load.audio(this.getMusicKey(), this.getMusicPath());

        // Player + generic sprites
        this.load.spritesheet("player1", "game_assets/spritesheets/blob-fullsheet-manual.json");
        this.load.image("generic-shadow", "game_assets/sprites/shadow.png");
        this.load.image("spitball", "game_assets/sprites/spitball.png");

        // Merchant
        this.load.spritesheet("merchant", "game_assets/spritesheets/demo_slime2.json");

        // Items
        this.load.image("healthpack", "game_assets/sprites/healthpack.png");
        this.load.image("inventorySlot", "game_assets/sprites/inventory.png");
        this.load.image("laserGun", "game_assets/sprites/laserGun.png");
        this.load.image("RedHat", "game_assets/sprites/red-hat.png");
        this.load.image("Shield", "game_assets/sprites/cardboard-shield.png");
        this.load.image("RaccoonTail", "game_assets/sprites/raccoon-tail.png");
        this.load.image("JetPack", "game_assets/sprites/cokepack.png");
        this.load.image("Gum", "game_assets/sprites/used-gum.png");
        this.load.image("DaNeedle", "game_assets/sprites/da-needle.png");
        this.load.image("Antennas", "game_assets/sprites/cockroach-antennas.png");
        
        this.load.image("Coral", "game_assets/sprites/horn-coral.png");
        this.load.image("Sharkfin", "game_assets/sprites/shark-fin.png");
        this.load.image("Kelpstache", "game_assets/sprites/kelpstache.png");

        this.load.image("Crystal", "game_assets/sprites/crystal.png");

        this.load.spritesheet("Underwater_Sharkfin", "game_assets/spritesheets/underwater-sharkfin.json");

        // HUD
        this.load.spritesheet("wave_alerts", "game_assets/spritesheets/wave-alerts.json");
        this.load.spritesheet("healthbar", "game_assets/ui/hud/healthbar.json");
        this.load.spritesheet("wave_crest", "game_assets/ui/hud/wave-crest.json");
        this.load.image("arrowSprite", "game_assets/sprites/last-enemy-arrow.png");
        this.load.image("endArrowSprite", "game_assets/sprites/level-trans-arrow.png");
        this.load.image("tray_red", "game_assets/ui/hud/tray-red.png");
        this.load.image("tray_blue", "game_assets/ui/hud/tray-blue.png");
        this.load.image("tray_gray", "game_assets/ui/hud/tray-gray.png");
        this.load.image("tray_long", "game_assets/ui/hud/tray-long.png");
        this.load.image("spacebar", "game_assets/ui/hud/spacebar.png");
        this.load.image("key-one", "game_assets/ui/hud/key-one.png");
        this.load.image("key-two", "game_assets/ui/hud/key-two.png");
        this.load.image("key-three", "game_assets/ui/hud/key-three.png");

        // Pause book pages
        this.load.image("about1", "game_assets/ui/book/about1.png");
        this.load.image("about2", "game_assets/ui/book/about2.png");
        this.load.image("about3", "game_assets/ui/book/about3.png");
        this.load.image("help", "game_assets/ui/book/help.png");
        this.load.image("controls", "game_assets/ui/book/controls.png");
        this.load.image("cheats", "game_assets/ui/book/cheats.png");
        this.load.image("back-button", "game_assets/ui/menu/back-button.png");

        // Audio
        this.load.audio("TRANSACTION", "game_assets/sounds/buy-sell-item.wav");
        this.load.audio("UNPICKUPPABLE", "game_assets/sounds/cant-pick-up.wav");
        this.load.audio("PICKUP_COIN", "game_assets/sounds/coin-pickup.wav");
        this.load.audio("PICKUP_ITEM", "game_assets/sounds/item-pickup.wav");
        this.load.audio("DEATH", "game_assets/sounds/death.wav");
        this.load.audio("ENEMY_DEATH", "game_assets/sounds/enemy-death.wav");
        this.load.audio("HURT", "game_assets/sounds/hurt.wav");
        this.load.audio("ENEMY_HURT", "game_assets/sounds/enemy-hit.wav");
        this.load.audio("SPITBALL", "game_assets/sounds/shoot.wav");
        this.load.audio("HEAL", "game_assets/sounds/heal.wav");
        this.load.audio("SWING", "game_assets/sounds/swing-sword.wav");
        this.load.audio("GUM", "game_assets/sounds/gum.wav");
        this.load.audio("COKEPACK", "game_assets/sounds/jetpack.wav");
        this.load.audio("TREASURE", "game_assets/sounds/open-treasure.wav");
        this.load.audio("WAVE_START", "game_assets/sounds/wave-beginning.wav");
        this.load.audio("WAVE_DEFEATED", "game_assets/sounds/wave-defeated.wav");
        this.load.audio("BOSS_SPAWNED", "game_assets/sounds/boss-spawning.wav");
        this.load.audio("BOSS_DEFEATED", "game_assets/sounds/boss-defeat.wav");
        this.load.audio("TP_NEW_LEVEL", "game_assets/sounds/teleport-to-new-level.wav");
    }

    /**
     * Hook for subclasses to spawn level-specific content after the player is
     * created (e.g. merchant + treasure caches in the city).
     */
    protected initLevelContent(_player: PlayerActor): void {}

    /**
     * Spawns the level-exit sprite from getEndLevelSprite(). No-op if the
     * subclass returns an empty spritesheetKey (e.g. ocean stub).
     */
    protected initLevelEnd(): void {
        const spec = this.getEndLevelSprite();
        if (!spec.spritesheetKey) return;
        const sprite = this.add.animatedSprite(AnimatedSprite, spec.spritesheetKey, "primary");
        sprite.position.copy(this.getEndLevelLocation());
        this.endLevelSprite = sprite;
        sprite.animation.play(spec.idleClosed, true);
    }

    public override startScene(): void {
        // Tilemap + walls
        const tilemapLayers = this.add.tilemap(this.getTilemapKey());
        const depths = this.getLayerDepthMap();

        // Layer indices differ between 4-layer (city: Floor/Wall/WallNC/Transparent)
        // and 5-layer (ocean: Floor/Props/Wall/WallNC/Transparent) tilemaps.
        const hasProps = depths.props !== undefined;
        const idxFloor = 0;
        const idxProps = hasProps ? 1 : -1;
        const idxWall = hasProps ? 2 : 1;
        const idxWallNC = hasProps ? 3 : 2;
        const idxTransparent = hasProps ? 4 : 3;

        tilemapLayers[idxFloor].setDepth(depths.floor);
        if (hasProps) tilemapLayers[idxProps].setDepth(depths.props!);
        tilemapLayers[idxWall].setDepth(depths.wall);
        tilemapLayers[idxWallNC].setDepth(depths.wallNC);
        tilemapLayers[idxTransparent].setDepth(depths.transparent);

        this.walls = <IsometricTilemap>tilemapLayers[idxWall].getItems()[0];
        this.wallsNC = <IsometricTilemap>tilemapLayers[idxWallNC].getItems()[0];
        this.bothWalls = [this.walls, this.wallsNC];

        const midCol = Math.floor(this.walls.getDimensions().x / 2);
        const midRow = Math.floor(this.walls.getDimensions().y / 2);
        const centerMap = this.walls.getWorldPosition(midCol, midRow);

        this.viewport.setBounds(
            -this.walls.size.x,
            -this.walls.size.y,
            this.walls.size.x * 2,
            this.walls.size.y * 2,
        );

        // Audio
        AudioManager.setVolume(AudioChannelType.SFX, 0.05);
        AudioManager.setVolume(AudioChannelType.CUSTOM_1, 3);

        this.viewport.setZoomLevel(2);

        // Layers + HUD scaffolding
        this.initLayers();
        this.initTweenGraphics();
        this.initializeNavmesh(new PositionGraph(), [this.walls, this.wallsNC]);

        // Player first, then level-specific content (subclass hook).
        const player = this.initializePlayer();
        this.initLevelContent(player);

        // Receiver subscriptions
        this.receiver.subscribe("enemyDied");
        this.receiver.subscribe(ItemEvent.ITEM_REQUEST);
        this.receiver.subscribe(AbilityEvent.OPEN_TREASURE);
        this.receiver.subscribe(AbilityEvent.USED_GUM);
        this.receiver.subscribe(ItemEvent.DANEEDLE_USED);
        this.receiver.subscribe(AbilityEvent.SHARK_FIN);

        this.addUILayer("health");

        this.receiver.subscribe(PlayerEvent.PLAYER_KILLED);
        this.receiver.subscribe(BattlerEvent.BATTLER_KILLED);
        this.receiver.subscribe(BattlerEvent.BATTLER_RESPAWN);

        this.receiver.subscribe(CheatEvent.CHEAT_POW_CANNON);
        this.receiver.subscribe(CheatEvent.CHEAT_INVINCIBLE);
        this.receiver.subscribe(CheatEvent.CHEAT_GIVE_ITEMS);
        this.receiver.subscribe(CheatEvent.CHEAT_GIVE_CRYSTALS);
        this.receiver.subscribe(CheatEvent.CHEAT_SPAWN_BOSS);
        this.receiver.subscribe(CheatEvent.CHEAT_TELEPORT_TO_MERCHANT);
        this.receiver.subscribe(CheatEvent.CHEAT_CONSOLE_LOCATION);
        this.receiver.subscribe(CheatEvent.CHEAT_CITY);
        this.receiver.subscribe(CheatEvent.CHEAT_OCEAN);

        this.receiver.subscribe(HudEvent.WAVE_IN_CENTER);
        this.receiver.subscribe(HudEvent.WAVE_DONE);
        this.receiver.subscribe(AAEvents.WAVE_CHANGE);

        this.viewport.setCenter(centerMap.x, centerMap.y);
        this.viewport.setFocus(new Vec2(centerMap.x, centerMap.y));

        this.waveDelayTimer.start();

        this.initPauseMenu();
        this.initShopMenu();
        this.initLevelEnd();

        // Zone labels
        this.bmZoneLabel = <Label>this.add.uiElement(UIElementType.LABEL, "hud", {
            position: new Vec2(256, 275),
            text: "[E] To Speak",
        });
        this.bmZoneLabel.textColor = Color.WHITE;
        this.bmZoneLabel.fontSize = 24;
        this.bmZoneLabel.visible = false;

        this.elZoneLabel = <Label>this.add.uiElement(UIElementType.LABEL, "hud", {
            position: new Vec2(256, 275),
            text: this.getEndLevelLabel(),
        });
        this.elZoneLabel.textColor = Color.WHITE;
        this.elZoneLabel.fontSize = 24;
        this.elZoneLabel.visible = false;

        // Music
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, { key: this.getMusicKey(), loop: true, holdReference: true });

        // Fade-in overlay
        this.fadeOverlay = <Rect>this.add.graphic(GraphicType.RECT, "fade", {
            position: new Vec2(this.viewport.getHalfSize().x, this.viewport.getHalfSize().x),
            size: new Vec2(this.viewport.getHalfSize().x * 2, this.viewport.getHalfSize().y * 2),
        });
        this.fadeOverlay.color = Color.BLACK;
        this.fadeOverlay.alpha = 1;

        this.fadeOverlay.tweens.add("fadeIn", {
            startDelay: 0,
            duration: 800,
            effects: [{
                property: TweenableProperties.alpha,
                start: 1,
                end: 0,
                ease: EaseFunctionType.IN_OUT_SINE,
            }],
            onEnd: "fade-in-done",
        });

        this.fadeOverlay.tweens.add("fadeOut", {
            startDelay: 0,
            duration: 800,
            effects: [{
                property: TweenableProperties.alpha,
                start: 0,
                end: 1,
                ease: EaseFunctionType.IN_OUT_SINE,
            }],
            onEnd: "fade-out-done",
        });

        this.fadeOverlay.tweens.play("fadeIn");
    }

    protected initTweenGraphics(): void {
        const alertSprite = this.add.animatedSprite(AnimatedSprite, "wave_alerts", "hud");
        const size = this.viewport.getHalfSize().scaled(2);
        this.waveAlerts = new WaveAlerts(alertSprite, size);
        alertSprite.animation.playIfNotAlready("WAVE_1");
    }

    // Event dispatcher
    public handleEvent(event: GameEvent): void {
        if (this.handleLevelEvent(event)) {
            return;
        }

        switch (event.type) {
            case ItemEvent.ITEM_REQUEST: {
                console.log("Request recieved");
                this.handleItemRequest(event.data.get("player"), event.data.get("inventory"));
                break;
            }
            case ItemEvent.DANEEDLE_USED: {
                this.handleDaNeedleUsed(event.data.get("position"));
                break;
            }
            case AbilityEvent.USED_GUM: {
                this.handleUsedGum();
                break;
            }
            case AbilityEvent.SHARK_FIN: {
                this.handleSharkFin();
                break;
            }
            case AbilityEvent.OPEN_TREASURE: {
                this.handleUsedRaccoonTail();
                break;
            }
            case BattlerEvent.BATTLER_KILLED: {
                this.handleBattlerKilled(event);
                break;
            }
            case BattlerEvent.BATTLER_RESPAWN: {
                break;
            }
            case CheatEvent.CHEAT_INVINCIBLE: {
                this.toggleCheatInvincible();
                break;
            }
            case CheatEvent.CHEAT_POW_CANNON: {
                this.toggleCheatPow();
                break;
            }
            case CheatEvent.CHEAT_GIVE_ITEMS: {
                this.cheatGiveItems();
                break;
            }
            case CheatEvent.CHEAT_GIVE_CRYSTALS: {
                this.player.crystals += 10000;
                break;
            }
            case CheatEvent.CHEAT_TELEPORT_TO_MERCHANT: {
                const merchantPos = this.getMerchantPosition();
                if (merchantPos) {
                    this.player.position.copy(merchantPos);
                }
                break;
            }
            case CheatEvent.CHEAT_CONSOLE_LOCATION: {
                console.log("Player at X: ", this.player.position.x, ", Y: ", this.player.position.y);
                break;
            }
            case CheatEvent.CHEAT_SPAWN_BOSS: {
                this.spawnBoss();
                break;
            }
            case HudEvent.WAVE_IN_CENTER: {
                this.waveAlerts.alertLeave();
                break;
            }
            case HudEvent.WAVE_DONE: {
                break;
            }
            case "resume": {
                this.resumeGame();
                break;
            }
            case "buy": {
                this.openBuyMenu();
                break;
            }
            case "sell": {
                this.openSellMenu();
                break;
            }
            case "reset_shop": {
                if (this.player.crystals >= 100) {
                    this.player.crystals -= 100;
                    this.setBuyItems();
                    this.openBuyMenu();
                }
                break;
            }
            case "pause_mainmenu": {
                TimerManager.getInstance().unpauseAllTimers();
                this.paused = false;
                this.pendingSnapshot = null;
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
                this.sceneManager.changeToScene(MainMenu);
                break;
            }
            case "pause_controls": {
                this.openPauseHelp(4);
                break;
            }
            case "pause_about": {
                this.curAboutPage = 0;
                this.openPauseHelp(this.curAboutPage);
                break;
            }
            case "pause_help": {
                this.openPauseHelp(3);
                break;
            }
            case "pause_cheats": {
                this.openPauseHelp(5);
                break;
            }
            default: {
                throw new Error(`Unhandled event type "${event.type}" caught in SMScene event handler`);
            }
        }
    }

    protected handleBattlerKilled(event: GameEvent): void {
        const id: number = event.data.get("id");
        const battler = this.battlers.find(b => b.id === id);

        if (!battler) return;

        const deathSpot = battler.position.clone();
        if (battler instanceof PlayerActor) {
            if (this.playerDead) {
                return;
            }
            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "DEATH", loop: false, holdReference: false });
            this.playerDead = true;
            this.player.crystals = Math.floor(this.player.crystals / 2);
            battler.animation.play("DYING", false, "DEAD");
            const deathTimer = new Timer(2500, () => {
                this.sceneManager.changeToScene(GameOver);
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
            }, false);
            deathTimer.start();
        }
        else if (battler == this.boss) {
            let drop = this.curBossDrop();
            this.dropOrChooseItem(deathSpot, 999, drop)

            for (let i = 0; i < 10; i++) {
                const crystalSprite = this.add.sprite("Crystal", "primary");
                crystalSprite.scale.set(0.75, 0.75);
                const crystal = new Crystal(crystalSprite);
                crystal.position.copy(deathSpot.clone().add(new Vec2(Math.random() * 15, Math.random() * 15)));
                this.sceneCrystals.push(crystal);
            }

            this.bossDead = true;
            battler.battlerActive = false;
            this.healthbars.get(battler).visible = false;
            this.healthbars.delete(battler);
            this.battlers = this.battlers.filter(b => b.id !== id);
            this.waveAlerts.playBossDefeated();
            this.waveCrestSprite.animation.playIfNotAlready("WAVE_5", true);
            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "BOSS_DEFEATED", loop: false, holdReference: false });
            this.spawnDelayTimer.pause();
            this.waveDelayTimer.pause();
        }
        else {
            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "ENEMY_DEATH", loop: false, holdReference: false });
            this.leftInCurWave -= 1;
            console.log("Enemy Killed: ", this.leftInCurWave, " of ", this.totSpawned, " spawned enemies left");
            battler.battlerActive = false;
            this.healthbars.get(battler).visible = false;
            this.healthbars.delete(battler);
            this.shadows.get(battler).visible = false;
            this.shadows.delete(battler);
            this.battlers = this.battlers.filter(b => b.id !== id);
            if (Math.random() * this.player.luck >= 0.85) {
                this.dropOrChooseItem(deathSpot, 999, null);
                console.log("Item dropped!");
            }

            const def = this.enemyTypeMap.get(battler);
            const crystalCount = def?.crystalDrops ?? 1;
            for (let i = 0; i < crystalCount; i++) {
                const crystalSprite = this.add.sprite("Crystal", "primary");
                crystalSprite.scale.set(0.75, 0.75);
                const crystal = new Crystal(crystalSprite);
                crystal.position.copy(deathSpot.clone().add(new Vec2(Math.random() * 15, Math.random() * 15)));
                this.sceneCrystals.push(crystal);
            }
            this.enemyTypeMap.delete(battler);

            if (this.leftInCurWave < 1 && this.totSpawned >= this.totInCurWave && !this.bossDead) {
                this.waveAlerts.playWaveDefeated();
                this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "WAVE_DEFEATED", loop: false, holdReference: false });
                this.waveDelayTimer.start();
            }
        }
    }

    protected handleItemRequest(player: PlayerActor, _inventory: Inventory): void {
        console.log("Total equippables:", this.sceneEquippables.length);
        const items: Item[] = this.sceneEquippables.filter((item: Item) => {
            const alreadyHas = player.equippables.find((equippable) => equippable.constructor === item.constructor);
            if (item.inventory !== null || item.position.distanceTo(player.position) > 100 ||
                (alreadyHas && alreadyHas.curStack >= alreadyHas.maxStack)) {
                return false;
            }
            return true;
        });
        if (items.length > 0) {
            const closestItem = items.reduce(ClosestPositioned(player));
            if (closestItem instanceof Healthpack) {
                if (player.maxHealth == player.health) {
                    return;
                }
                const newHealth = player.maxHealth < player.health + 5 ? player.maxHealth : player.health + 5;
                player.health = newHealth;
                this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "HEAL", loop: false, holdReference: false });
                closestItem.visible = false;
                this.sceneEquippables = this.sceneEquippables.filter((equippable) => equippable !== closestItem);
                return;
            }

            const alreadyHas = player.equippables.find((equippable) => equippable.constructor === closestItem.constructor);

            if (alreadyHas) {
                if (alreadyHas.maxStack <= alreadyHas.curStack) {
                    this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "UNPICKUPPABLE", loop: false, holdReference: false });
                    return;
                }
                else {
                    alreadyHas.curStack += 1;
                    closestItem.visible = false;
                    this.sceneEquippables = this.sceneEquippables.filter((equippable) => equippable !== closestItem);
                    alreadyHas.applyBuff(this.player);
                    this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "PICKUP_ITEM", loop: false, holdReference: false });
                    return;
                }
            }
            if (closestItem.isAbility) {
                let abilityCount = [...this.player.abilities.items()].length;
                if (abilityCount >= 3) {
                    this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "UNPICKUPPABLE", loop: false, holdReference: false });
                    return;
                }
            }
            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "PICKUP_ITEM", loop: false, holdReference: false });
            player.equip(closestItem);
            if (closestItem instanceof DaNeedle) {
                this.needle = closestItem as DaNeedle;
            }
        }
    }

    public cheatGiveItems(): void {
        const playerAt = this.player.position;

        const shieldSprite = this.add.sprite("Shield", "equippables");
        const shield = new Shield(shieldSprite);
        shield.position.copy(new Vec2(playerAt.x + 100, playerAt.y + 100));
        this.sceneEquippables.push(shield);

        const redHatSprite = this.add.sprite("RedHat", "equippables");
        const redHat = new RedHat(redHatSprite);
        redHat.position.copy(new Vec2(playerAt.x - 100, playerAt.y + 100));
        this.sceneEquippables.push(redHat);

        const raccoonTailSprite = this.add.sprite("RaccoonTail", "equippables");
        const raccoonTail = new RaccoonTail(raccoonTailSprite);
        raccoonTail.position.copy(new Vec2(playerAt.x + 100, playerAt.y - 100));
        this.sceneEquippables.push(raccoonTail);

        const jetPackSprite = this.add.sprite("JetPack", "equippables");
        const jetPack = new JetPack(jetPackSprite);
        jetPack.position.copy(new Vec2(playerAt.x, playerAt.y + 100));
        this.sceneEquippables.push(jetPack);

        const healthPackSprite = this.add.sprite("healthpack", "equippables");
        const healthPack = new Healthpack(healthPackSprite);
        healthPack.position.copy(new Vec2(playerAt.x + 100, playerAt.y));
        this.sceneEquippables.push(healthPack);

        const gumSprite = this.add.sprite("Gum", "equippables");
        const gum = new Gum(gumSprite);
        gum.position.copy(new Vec2(playerAt.x + 100, playerAt.y + 200));
        this.sceneEquippables.push(gum);

        const daNeedleSprite = this.add.sprite("DaNeedle", "equippables");
        const daNeedle = new DaNeedle(daNeedleSprite);
        daNeedle.position.copy(new Vec2(playerAt.x + 200, playerAt.y + 100));
        this.sceneEquippables.push(daNeedle);

        const antennaSprite = this.add.sprite("Antennas", "equippables");
        const antennas = new Antennas(antennaSprite);
        antennas.position.copy(new Vec2(playerAt.x - 100, playerAt.y - 100));
        this.sceneEquippables.push(antennas);

        let coralSprite = this.add.sprite("Coral", "equippables");
        coralSprite.scale.set(0.75, 0.75);
        let coral = new Coral(coralSprite);
        coral.position.copy(new Vec2(playerAt.x + 200, playerAt.y - 100));
        this.sceneEquippables.push(coral);

        let sharkfinSprite = this.add.sprite("Sharkfin", "equippables");
        sharkfinSprite.rotation = Math.PI / 8;
        sharkfinSprite.scale.set(0.5, 0.5);
        let sharkfin = new Sharkfin(sharkfinSprite);
        sharkfin.position.copy(new Vec2(playerAt.x - 200, playerAt.y + 100));

        this.sceneEquippables.push(sharkfin);

        let kelpstacheSprite = this.add.sprite("Kelpstache", "equippables");
        let kelpstache = new Kelpstache(kelpstacheSprite);
        kelpstache.position.copy(new Vec2(playerAt.x - 200, playerAt.y - 100));
        this.sceneEquippables.push(kelpstache);
    }

    /**
     * Subclasses override this for level-specific treasure abilities (e.g.
     * city's RaccoonTail opens dumpsters). Default does nothing.
     */
    protected handleUsedRaccoonTail(): void {}

    public getSharkFin(): AnimatedSprite | null {
        return this.sharkfin;
    }

    //default the raccoon
    protected curBossDrop(): number | null {
        return 200;
    }
}
