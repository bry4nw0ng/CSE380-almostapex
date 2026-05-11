import PositionGraph from "../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import Actor from "../../Wolfie2D/DataTypes/Interfaces/Actor";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../Wolfie2D/Nodes/Graphics/Line";
import IsometricTilemap from "../../Wolfie2D/Nodes/Tilemaps/IsometricTilemap";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import DirectStrategy from "../../Wolfie2D/Pathfinding/Strategies/DirectStrategy";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import Timer from "../../Wolfie2D/Timing/Timer";
import Color from "../../Wolfie2D/Utils/Color";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import NPCActor from "../Actors/NPCActor";
import PlayerActor from "../Actors/PlayerActor";
import GuardBehavior from "../AI/NPC/NPCBehavior/GaurdBehavior";
import { AAControls } from "../AAControls";
import { ItemEvent, PlayerEvent, BattlerEvent, AbilityEvent, CheatEvent, HudEvent, AAEvents } from "../Events";
import Battler from "../GameSystems/BattleSystem/Battler";
import BattlerBase from "../GameSystems/BattleSystem/BattlerBase";
import HealthbarHUD from "../GameSystems/HUD/HealthbarHUD";
import InventoryHUD from "../GameSystems/HUD/InventoryHUD";
import RelicTrayHUD from "../GameSystems/HUD/RelicTrayHUD";
import ActionSlotsHUD from "../GameSystems/HUD/ActionSlotsHUD";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import Item from "../GameSystems/ItemSystem/Item";
import Healthpack from "../GameSystems/ItemSystem/Items/Healthpack";
import LaserGun from "../GameSystems/ItemSystem/Items/LaserGun";
import { ClosestPositioned } from "../GameSystems/Searching/SMReducers";
import BasicTargetable from "../GameSystems/Targeting/BasicTargetable";
import Position from "../GameSystems/Targeting/Position";
import AstarStrategy from "../Pathfinding/AstarStrategy";
import SMScene from "./SMScene";
import PlayerController from "../AI/Player/PlayerController";
import Shield from "../GameSystems/ItemSystem/Items/Shield";
import RedHat from "../GameSystems/ItemSystem/Items/RedHat";
import RaccoonTail from "../GameSystems/ItemSystem/Items/RaccoonTail";
import JetPack from "../GameSystems/ItemSystem/Items/Jetpack";
import Gum from "../GameSystems/ItemSystem/Items/Gum";
import DaNeedle from "../GameSystems/ItemSystem/Items/DaNeedle";
import Antennas from "../GameSystems/ItemSystem/Items/Antennas";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import RaccoonBehavior from "../AI/NPC/NPCBehavior/RaccoonBehavior";
import MainMenu from "./MainMenu";
import GameOver from "./GameOver";
import OceanLevel from "./OceanLevel";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Input from "../../Wolfie2D/Input/Input";
import Arrow from "../GameSystems/HUD/LastEnemyArrow";
import WaveAlerts from "../GameSystems/HUD/WaveAlerts";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import TimerManager from "../../Wolfie2D/Timing/TimerManager";
import Crystal from "../GameSystems/ItemSystem/Items/Crystal";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import AudioManager, { AudioChannelType } from "../../Wolfie2D/Sound/AudioManager";
import SeedSlingerBehavior from "../AI/NPC/NPCBehavior/SeedSlingerBehavior";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import EndArrow from "../GameSystems/HUD/NextLevelArrow";
import {
    BossDef,
    EndLevelSpriteDef,
    EnemyDef,
    ItemKey,
    LayerDepthMap,
    SceneCtor,
    WaveDef,
} from "./LevelTypes";

const BattlerGroups = {
    RED: 1,
    BLUE: 2
} as const;

export default class CityLevel extends SMScene {

    private treasure: { sprite: Sprite, stillCookin: boolean }[];
    private bases: BattlerBase[];

    private readonly END_LEVEL_LOCATION = new Vec2(-60, 1670);
    private readonly MERCHANT_LOCATION = new Vec2(1920, 1000);

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
        this.treasure = [];
    }

    /**
     * @see Scene.update()
     */
    public override loadScene() {
        this.loadSharedAssets();

        // City-specific enemies + their projectile sprites
        this.load.spritesheet("rollermouse", "game_assets/spritesheets/scabbers2.json");
        this.load.spritesheet("pigeon", "game_assets/spritesheets/pigeon.json");
        this.load.spritesheet("raccoon", "game_assets/spritesheets/raccoon-all-sprites-finished.json");
        this.load.image("trash-paper", "game_assets/sprites/trash-paper.png");
        this.load.image("trash-banana", "game_assets/sprites/trash-banana.png");
        this.load.image("seed", "game_assets/sprites/seed.png");

        // City tileset image
        this.load.image("tiles", "game_assets/tilemaps/city-tileset-completed.png");

        // City treasure
        this.load.image("DumpsterSprite", "game_assets/spritesheets/dumpster.png");
        this.load.object("dumpster", "game_assets/data/enemies/dumpster.json");

        // City end-level sprite (manhole)
        this.load.spritesheet("manhole", "game_assets/spritesheets/manhole.json");
    }
    /**
     * @see Scene.startScene
     */
    protected override initLevelContent(player: PlayerActor): void {
        this.initializeNPCs(player);
    }

    protected override handleUsedRaccoonTail(): void {
        this.treasure.forEach(cache => {
            if (cache.sprite.position.distanceTo(this.player.position) < 100) {
                this.dropOrChooseItem(cache.sprite.position, 999, null);
                this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: "TREASURE", loop: false, holdReference: false});
                cache.sprite.destroy();
                return;
            }
        });
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: "UNPICKUPPABLE", loop: false, holdReference: false});
    }

    /**
     * Initialize the NPCs
     */
    protected initializeNPCs(player): void {
        console.log("spawned merchant");
        let merchant = this.add.animatedSprite(AnimatedSprite, "merchant", "primary");
        merchant.position.copy(this.MERCHANT_LOCATION);
        let merchantShadow = this.add.sprite("generic-shadow", "shadow");
        merchantShadow.position.set(this.MERCHANT_LOCATION.x - 4, this.MERCHANT_LOCATION.y + 13);
        merchantShadow.scale.set(1.15, 1);
        merchantShadow.alpha = 0.8;
        merchantShadow.visible = true;

        merchant.scale.set(0.25, 0.25);
        merchant.animation.play("Idle", true);

        let dumpster = this.load.getObject("dumpster");

        for (let i = 0; i < dumpster.dumpsters.length; i++) {
            console.log("spawned dumpster");
            let treasure = this.add.sprite("DumpsterSprite", "arrowLayer");
            treasure.position.set(dumpster.dumpsters[i][0], dumpster.dumpsters[i][1]);
            treasure.scale.set(1, 1);

            this.treasure.push({sprite: treasure, stillCookin: true});

        }
        //this.spawnBoss();
        this.sharkfin = this.add.animatedSprite(AnimatedSprite, "Underwater_Sharkfin", "primary");
        this.sharkfin.scale.set(0.75,0.75);
        this.sharkfin.visible = false;

    }

    public getLevelKey(): string { return "city"; }

    public getTilemapKey(): string { return "level"; }

    public getTilemapPath(): string { return "game_assets/tilemaps/city-map-revised.tmj"; }

    public getSpawnPosition(): Vec2 { return new Vec2(-1500, 1000); }

    public getLayerDepthMap(): LayerDepthMap {
        return { floor: 0, wall: 3, wallNC: 5, transparent: 6 };
    }

    public getMusicKey(): string { return "CITY_MUSIC"; }

    public getMusicPath(): string { return "game_assets/sounds/songs/city-cleaned.mp3"; }

    public getEnemyTypes(): EnemyDef[] {
        return [
            {
                key: "rollermouse",
                spritesheetKey: "rollermouse",
                spritesheetPath: "game_assets/spritesheets/scabbers2.json",
                health: 9,
                maxHealth: 9,
                speed: 50,
                scale: new Vec2(0.25, 0.25),
                battleGroup: 1,
                hitbox: new AABB(Vec2.ZERO, new Vec2(4, 4)),
                shadow: { offset: new Vec2(-3, 6), scale: new Vec2(0.5, 0.5), alpha: 0.8 },
                ai: { ctor: GuardBehavior, opts: { range: 200 } },
                crystalDrops: 1,
            },
            {
                key: "pigeon",
                spritesheetKey: "pigeon",
                spritesheetPath: "game_assets/spritesheets/pigeon.json",
                health: 20,
                maxHealth: 20,
                speed: 50,
                scale: new Vec2(0.5, 0.5),
                battleGroup: 1,
                hitbox: new AABB(Vec2.ZERO, new Vec2(8, 8)),
                shadow: { offset: new Vec2(-15, 25), scale: new Vec2(1, 0.75), alpha: 0.5 },
                ai: { ctor: SeedSlingerBehavior, opts: { range: 75 } },
                crystalDrops: 3,
                shotSprites: ["seed"],
            },
        ];
    }

    public getBoss(): BossDef | null {
        return {
            key: "raccoon",
            spritesheetKey: "raccoon",
            spritesheetPath: "game_assets/spritesheets/raccoon-all-sprites-finished.json",
            health: 75,
            maxHealth: 75,
            speed: 0,
            scale: new Vec2(1, 1),
            battleGroup: 1,
            hitbox: new AABB(Vec2.ZERO, new Vec2(40, 120)),
            shadow: { offset: new Vec2(0, 0), scale: new Vec2(1, 1), alpha: 0 },
            ai: { ctor: RaccoonBehavior, opts: { range: 750 } },
            crystalDrops: 10,
            shotSprites: ["trash-paper", "trash-banana"],
            spawnTrigger: "after_final_wave",
            spawnPosition: new Vec2(230, 1000),
            deathDropItem: "RaccoonTail",
        };
    }

    public getWaveConfig(): WaveDef[] {
        return [
            {
                count: 5,
                types: [{ key: "rollermouse", count: 5 }],
                delayMs: 1000,
                alertKey: "WAVE_1",
                crestKey: "WAVE_1",
                startSfx: "WAVE_START",
            },
            {
                count: 10,
                types: [{ key: "rollermouse", count: 7 }, { key: "pigeon", count: 3 }],
                delayMs: 700,
                alertKey: "WAVE_2",
                crestKey: "WAVE_2",
                startSfx: "WAVE_START",
            },
            {
                count: 30,
                types: [{ key: "rollermouse", count: 24 }, { key: "pigeon", count: 6 }],
                delayMs: 300,
                alertKey: "WAVE_3",
                crestKey: "WAVE_3",
                startSfx: "WAVE_START",
            },
            {
                count: 1000,
                types: [{ key: "rollermouse", count: 1000 }],
                delayMs: 3000,
                alertKey: "BOSS",
                crestKey: "WAVE_4",
                startSfx: "BOSS_SPAWNED",
            },
        ];
    }

    public getShopInventory(): Item[] { return []; }

    public getDropItemPool(): ItemKey[] {
        return ["Shield", "RedHat", "JetPack", "Healthpack", "Gum", "DaNeedle", "Antennas"];
    }

    public getEndLevelLocation(): Vec2 { return this.END_LEVEL_LOCATION; }

    public getEndLevelLabel(): string { return "[E] To Go to the Ocean"; }

    public getEndLevelSprite(): EndLevelSpriteDef {
        return {
            spritesheetKey: "manhole",
            idleClosed: "IDLE_CLOSE",
            opening: "OPEN",
            idleOpen: "IDLE_OPEN",
            closing: "CLOSE",
        };
    }

    public getNextLevel(): SceneCtor | null { return OceanLevel; }

    public override getMerchantPosition(): Vec2 { return this.MERCHANT_LOCATION; }

    protected override handleLevelEvent(event: GameEvent): boolean {
        switch(event.type) {
            case CheatEvent.CHEAT_CITY: {
                return true;   
            }
            case CheatEvent.CHEAT_OCEAN: {
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
                this.sceneManager.changeToScene(OceanLevel);
                return true;
            }
        }
        return false;
    }
}