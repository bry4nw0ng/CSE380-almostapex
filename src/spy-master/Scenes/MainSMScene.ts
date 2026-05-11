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

export default class MainSMScene extends SMScene {

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
        // Load the player and enemy spritesheets
        this.load.spritesheet("player1", "game_assets/spritesheets/blob-fullsheet-manual.json");

        // Load in the enemy sprites
        this.load.spritesheet("rollermouse", "game_assets/spritesheets/scabbers2.json");
        this.load.spritesheet("pigeon", "game_assets/spritesheets/pigeon.json");
        this.load.spritesheet("raccoon", "game_assets/spritesheets/raccoon-all-sprites-finished.json");  

        //Wave Alerts
        this.load.spritesheet("wave_alerts", "game_assets/spritesheets/wave-alerts.json");

        this.load.image("DumpsterSprite", "game_assets/spritesheets/dumpster.png");

        // Load the tilemap
        this.load.tilemap("level", "game_assets/tilemaps/city-map-revised.tmj");
        this.load.image("tiles", "game_assets/tilemaps/city-tileset-completed.png");

        // Load the enemy locations
        this.load.object("red", "game_assets/data/enemies/red.json");
        this.load.object("blue", "game_assets/data/enemies/blue.json");

        this.load.object("dumpster", "game_assets/data/enemies/dumpster.json");

        this.load.spritesheet("manhole", "game_assets/spritesheets/manhole.json");

        // Load the healthpack and lasergun loactions
        //this.load.object("healthpacks", "game_assets/data/items/healthpacks.json");
        //this.load.object("laserguns", "game_assets/data/items/laserguns.json");
        //this.load.object("equippables", "game_assets/data/items/equippables.json");

        // Load the healthpack, inventory slot, and laser gun sprites
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
        this.load.image("Crystal", "game_assets/sprites/crystal.png");

        this.load.image("generic-shadow", "game_assets/sprites/shadow.png")

        //raccoon bullets
        this.load.image("trash-paper", "game_assets/sprites/trash-paper.png");
        this.load.image("trash-banana", "game_assets/sprites/trash-banana.png");

        this.load.image("seed", "game_assets/sprites/seed.png");

        //your bullets
        this.load.image("spitball", "game_assets/sprites/spitball.png")

        // TODO: replace temp pages with final about/help/controls page assets when designed
/*         this.load.image("about-page",    "game_assets/ui/menu/temp/tempabout.png");
        this.load.image("help-page",     "game_assets/ui/menu/temp/temphelp.png");
        this.load.image("controls-page", "game_assets/ui/menu/temp/tempcontrols.png"); */
        this.load.image("about1",    "game_assets/ui/book/about1.png");
        this.load.image("about2",    "game_assets/ui/book/about2.png");
        this.load.image("about3",    "game_assets/ui/book/about3.png");
        this.load.image("help",     "game_assets/ui/book/help.png");
        this.load.image("controls", "game_assets/ui/book/controls.png");
        this.load.image("cheats", "game_assets/ui/book/cheats.png");

        this.load.image("back-button", "game_assets/ui/menu/back-button.png");

        //New hud changes
        this.load.spritesheet("healthbar", "game_assets/ui/hud/healthbar.json");
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

        this.load.spritesheet("wave_crest", "game_assets/ui/hud/wave-crest.json");

        this.load.spritesheet("merchant", "game_assets/spritesheets/demo_slime2.json");

        //MUSIC
        this.load.audio("CITY_MUSIC", "game_assets/sounds/songs/city-cleaned.mp3");

        //SOUND STUFF
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
     * @see Scene.startScene
     */
    protected override initLevelContent(player: PlayerActor): void {
        this.initializeNPCs(player);
    }

    protected override handleUsedRaccoonTail(): void {
        this.treasure.forEach(cache => {
            if (cache.sprite.position.distanceTo(this.player.position) < 100) {
                this.dropOrChooseItem(cache.sprite.position, 999);
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

        // Get the object data for the red enemies
        //let red = this.load.getObject("red");
        //For debug
/* 
        for (let i = 0; i < red.enemies.length; i++) {
            console.log("spawned mouse");
            let npc = this.add.animatedSprite(NPCActor, "rollermouse", "primary");
            npc.position.set(red.enemies[i][0], red.enemies[i][1]);
            npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(4, 4)), null, false);
            npc.scale.set(0.25, 0.25);

            // Give the NPC a healthbar
            let healthbar = new HealthbarHUD(this, npc, "primary", {size: npc.size.clone().scaled(1, 1/4), offset: npc.size.clone().scaled(0, -1/2)});
            this.healthbars.set(npc, healthbar);
            healthbar.visible = false;
            
            // Set the NPCs stats
            npc.battleGroup = 1
            npc.speed = 30;
            npc.health = 10;
            npc.maxHealth = 10;
            npc.navkey = "navmesh";

            npc.addAI(GuardBehavior, {target: player, range: 100});

            // Play the NPCs "IDLE" animation 
            npc.animation.play("IDLE");
            
            // Add the NPC to the battlers array
            this.battlers.push(npc);
        }
         */

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

    public getEnemyTypes(): EnemyDef[] { return []; }

    public getBoss(): BossDef | null { return null; }

    public getWaveConfig(): WaveDef[] { return []; }

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

    public getNextLevel(): SceneCtor | null { return null; }

    public override getMerchantPosition(): Vec2 { return this.MERCHANT_LOCATION; }
}