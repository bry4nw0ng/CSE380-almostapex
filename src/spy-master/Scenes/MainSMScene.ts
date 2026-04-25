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

const BattlerGroups = {
    RED: 1,
    BLUE: 2
} as const;

export default class MainSMScene extends SMScene {

    /** GameSystems in the SM Scene */
    private inventoryHud: InventoryHUD;
    private relicTray: RelicTrayHUD;
    private actionSlots: ActionSlotsHUD;

    private arrow: Arrow;

    /** All the battlers in the SMScene (including the player) */
    private battlers: (Battler & Actor & GameNode)[];
    /** Healthbars for the battlers */
    //Changed to map to battler instead (dont want to have to find every time)
    private healthbars: Map<Battler & Actor & GameNode, HealthbarHUD>;



    //bullets trash/player
    private trash: {sprite: Sprite, velocity: Vec2, stillCookin: boolean}[] = [];
    private spitballs: {sprite: Sprite, velocity: Vec2, stillCookin: boolean}[] = [];
    private sceneCrystals: Crystal[] = [];


    private treasure: {sprite: Sprite, stillCookin: boolean}[];

    private bases: BattlerBase[];

    private sceneEquippables: Array<Item>;

    private player: PlayerActor;
    private boss: NPCActor;

    // The wall layer of the tilemap
    private walls: IsometricTilemap;
    //Non collidable walls, have to add to navmesh so that enemies dont spawn there, but not collidable
    private wallsNC: IsometricTilemap;
    private bothWalls: IsometricTilemap[];

    // The position graph for the navmesh
    private graph: PositionGraph;
    private navmesh: Navmesh;

    private spawnableNodes: number[];


    //Spawn Logic
    private playerDead: boolean = false;
    private curWave: number;
    private leftInCurWave: number;
    private totSpawned: number;
    private totInCurWave: number;
    private curDelay: number;

    private spawnDelayTimer: Timer;
    private waveDelayTimer: Timer;
    private waveTweenTimer: Timer;

    private bossDead: boolean;

    private closestEnemy: NPCActor | null;

    private needle: DaNeedle | null;

    private waveAlerts: WaveAlerts;
    private finalAlertPlayed: boolean;
    private waveCrestSprite: AnimatedSprite | null;

    //Cheats
    private CHEATINVINCIBLE = false;
    private CHEATPOWGUN = false;

    // Pause menu state
    private paused: boolean = false;
    private pauseDim: Graphic;
    private pauseTitle: Button;
    private pauseButtons: Button[] = [];

    // Pause help/about/controls sub-overlay
    private pauseHelpOpen: boolean = false;
    private pauseHelpPages: Sprite[] = [];
    private pauseHelpClose: Sprite;
    private aboutPrev: Sprite;
    private aboutNext: Sprite;
    private curAboutPage: number;

    private readonly PAUSE_CLOSE_HIT = 25;

    private readonly MERCHANT_LOCATION = new Vec2(1920, 1000);
    private bmZoneLabel: Label;
    private shopOpen: boolean = false;
    private shopState: string;
    private shopTitle: Button;
    private mainButtons: Button[] = [];
    private sellButtons: Button[] = [];
    private buyButtons: Button[] = [];
    private merchantSprites: Sprite[] = [];
    private sellables: Item[] = [];
    private forSale: Item[] = [];

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
        this.spawnableNodes = [];

        this.battlers = new Array<Battler & Actor & GameNode>();
        this.healthbars = new Map<Battler & Actor & GameNode, HealthbarHUD>();
        this.treasure = [];       
        this.sceneEquippables = new Array<Item>();

        this.curAboutPage = 0;

        this.waveCrestSprite = null;

        this.finalAlertPlayed = false;
        this.curDelay = 0;
        this.totSpawned = 0;
        this.curWave = 0;
        this.leftInCurWave = 0;
        this.totInCurWave = 0;
        this.waveTweenTimer = new Timer(3000, () => this.startWave(this.curWave), false);
        this.waveDelayTimer = new Timer(4000, () => {
            if (this.curWave == 0) {
                this.waveAlerts.playWave1Incoming();
            }
            else if (this.curWave == 1) {
                this.waveAlerts.playWave2Incoming();
                this.waveCrestSprite.animation.playIfNotAlready("WAVE_2", true);
            }
            else if (this.curWave == 2) {
                this.waveAlerts.playWave3Incoming();
                this.waveCrestSprite.animation.playIfNotAlready("WAVE_3", true);
            }
            else if (this.curWave == 3) {
                this.waveAlerts.playBossIncoming();
                this.waveCrestSprite.animation.playIfNotAlready("WAVE_4", true);
            }
            this.waveTweenTimer.start()
        }, false);

        this.spawnDelayTimer = new Timer(this.curDelay, () => {
            if (!this.bossDead && this.totSpawned < this.totInCurWave) {
                this.spawnEnemies();
                this.totSpawned += 1;
                console.log("Total enemies left to spawn: ", this.totSpawned, "/", this.leftInCurWave);
            }
            else if (this.totSpawned == this.totInCurWave) {
                this.spawnDelayTimer.pause()
                console.log("All enemies spawned ", this.curWave);
            }
            else if (this.bossDead) {
                this.spawnDelayTimer.pause()
                if (!this.finalAlertPlayed) {
                    this.waveAlerts.playBossDefeated();
                    this.waveCrestSprite.animation.playIfNotAlready("WAVE_5", true);
                    console.log("You beat the boss!")
                }
            }
        }, true);

        this.closestEnemy = null;
        this.bossDead = false;

        this.shopState = "main";
    }

    /**
     * @see Scene.update()
     */
    public override loadScene() {
        // Load the player and enemy spritesheets
        this.load.spritesheet("player1", "game_assets/spritesheets/blob-fullsheet-manual.json");

        // Load in the enemy sprites
        this.load.spritesheet("BlueEnemy", "game_assets/spritesheets/BlueEnemy.json");
        this.load.spritesheet("RedEnemy", "game_assets/spritesheets/scabbers2.json");
        this.load.spritesheet("BlueHealer", "game_assets/spritesheets/BlueHealer.json");
        this.load.spritesheet("RedHealer", "game_assets/spritesheets/RedHealer.json");
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

        //raccoon bullets
        this.load.image("trash-paper", "game_assets/sprites/trash-paper.png");
        this.load.image("trash-banana", "game_assets/sprites/trash-banana.png");

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
    }
    /**
     * @see Scene.startScene
     */
    public override startScene() {
        // Add in the tilemap
        let tilemapLayers = this.add.tilemap("level");

        tilemapLayers[2].setDepth(5); // Wall-NonCollidable
        tilemapLayers[0].setDepth(0); // Floor  
        tilemapLayers[1].setDepth(1); // Wall
        tilemapLayers[3].setDepth(6); // Transparent, player at 3, so should be above

        this.walls = <IsometricTilemap>tilemapLayers[1].getItems()[0];
        this.wallsNC = <IsometricTilemap>tilemapLayers[2].getItems()[0];

        this.bothWalls = [this.walls, this.wallsNC];

        let midCol = Math.floor(this.walls.getDimensions().x / 2);
        let midRow = Math.floor(this.walls.getDimensions().y / 2);

        let centerMap = this.walls.getWorldPosition(midCol, midRow);

        this.viewport.setBounds(
            -this.walls.size.x,
            -this.walls.size.y,
            this.walls.size.x * 2,
            this.walls.size.y * 2
        );

        this.viewport.setZoomLevel(2);

        this.initLayers();
        
        this.initTweenGraphics();

        this.initializeNavmesh(new PositionGraph(), [this.walls, this.wallsNC]);

        // Create the Player/NPCS
        this.initializeNPCs(this.initializePlayer());

        // Subscribe to relevant events
        this.receiver.subscribe("enemyDied");

        //Pickup
        this.receiver.subscribe(ItemEvent.ITEM_REQUEST);

        //Abilities
        this.receiver.subscribe(AbilityEvent.OPEN_TREASURE);
        this.receiver.subscribe(AbilityEvent.USED_GUM);

        //Weapons
        this.receiver.subscribe(ItemEvent.DANEEDLE_USED);


        // Add a UI for health
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

        this.receiver.subscribe(CheatEvent.CHEAT_CITY);
        this.receiver.subscribe(CheatEvent.CHEAT_MOUNTAIN);
        this.receiver.subscribe(CheatEvent.CHEAT_OCEAN);
        this.receiver.subscribe(CheatEvent.CHEAT_TOP_LEVEL);

        this.receiver.subscribe(HudEvent.WAVE_IN_CENTER);
        this.receiver.subscribe(HudEvent.WAVE_DONE);

        this.receiver.subscribe(AAEvents.WAVE_CHANGE);


        this.viewport.setCenter(centerMap!.x, centerMap!.y);
        this.viewport.setFocus(new Vec2(centerMap!.x, centerMap!.y));

        this.waveDelayTimer.start();
        // init pause menu UI
        this.initPauseMenu();
        this.initShopMenu();

        this.bmZoneLabel = <Label>this.add.uiElement(UIElementType.LABEL, "hud", {
            position: new Vec2(256, 275),
            text: "[E] To Speak"
        });
        this.bmZoneLabel.textColor = Color.WHITE;
        this.bmZoneLabel.fontSize = 24;
        this.bmZoneLabel.visible = false;
    }



    /**
     * @see Scene.updateScene
     * UPDATER +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
     */
    public override updateScene(deltaT: number): void {
        // ESC toggles pause / closes help overlay
        if (Input.isKeyJustPressed("escape")) {
            if (this.pauseHelpOpen) {
                this.closePauseHelp();
            } else if (this.paused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        }

        // While paused, only process UI events and help nav clicks
        if (this.paused) {
            while (this.receiver.hasNextEvent()) {
                this.handleEvent(this.receiver.getNextEvent());
            }
            const mouse = Input.getMousePressPosition();
            const close = this.pauseHelpClose.position;

            // mouse click for help page close button
            if (this.pauseHelpOpen && Input.isMouseJustPressed()) {
                if (Math.abs(mouse.x - close.x) <= this.PAUSE_CLOSE_HIT &&
                    Math.abs(mouse.y - close.y) <= this.PAUSE_CLOSE_HIT) {
                    this.closePauseHelp();
                    return;
                }

                const next = this.aboutNext.position;
                if (this.aboutNext.visible &&
                    Math.abs(mouse.x - next.x) <= this.PAUSE_CLOSE_HIT &&
                    Math.abs(mouse.y - next.y) <= this.PAUSE_CLOSE_HIT) {
                    this.curAboutPage += 1;
                    this.openPauseHelp(this.curAboutPage);
                    return;
                }

                const prev = this.aboutPrev.position;
                if (this.aboutPrev.visible &&
                    Math.abs(mouse.x - prev.x) <= this.PAUSE_CLOSE_HIT &&
                    Math.abs(mouse.y - prev.y) <= this.PAUSE_CLOSE_HIT) {
                    this.curAboutPage -= 1;
                    this.openPauseHelp(this.curAboutPage);
                    return;
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
                        return;
                    }
                //Doom and despair, gotta be a better way to do all of this
                if (this.shopState == "sell") {
                    let i = 0;
                    this.sellButtons.forEach((btn) => {
                        //So if hovering over the button[i] when clicked, should send to that instance?? Hopefully???
                        if (Math.abs(mouse.x - btn.position.x) <= btn.size.x / 2 &&
                            Math.abs(mouse.y - btn.position.y) <= btn.size.y / 2) {
                            this.sellEquippable(this.sellables[i].id);
                        }
                        i++;
                    })
                }
                else if (this.shopState == "buy") {
                    let i = 0;
                    this.buyButtons.forEach((btn) => {
                        //So if hovering over the button[i] when clicked, should send to that instance?? Hopefully???
                        if (Math.abs(mouse.x - btn.position.x) <= btn.size.x / 2 &&
                            Math.abs(mouse.y - btn.position.y) <= btn.size.y / 2) {
                            this.buyEquippable(this.forSale[i], i);
                        }
                        i++;
                    })
                }
            }
            return; // skip all gameplay updates while paused
        }

        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }


        this.inventoryHud.update(deltaT);
        this.relicTray.update(deltaT);
        this.actionSlots.update(deltaT);

        
        if (this.player.position.distanceTo(this.MERCHANT_LOCATION) < 30) {
            this.bmZoneLabel.visible = true;
            if (Input.isJustPressed(AAControls.INTERACT) && this.shopOpen == false) {
                this.shopOpen = true;
                this.pauseGame();
            }
        }
        else {
            this.bmZoneLabel.visible = false;
        }

        //Rendering the heathbars was getting expensive, needed to change to only update if needed (Now doesnt show if max health)
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

        this.updateTrash(deltaT);
        this.updateSpitballs(deltaT);
        this.updateContactDamage();
        this.updateCrystals();

        if (this.closestEnemy && this.player.position.distanceTo(this.closestEnemy.position) > 300) {
            this.arrow.update(deltaT, this.closestEnemy);
        }
        else {
            this.arrow.visible = false;
        }

        if (this.player.hasNeedle && this.needle.isSpinning) {
            this.handleDaNeedleUsed(this.needle.position);
        }
    }

    public updateTrash(deltaT) {           
        if (!this.CHEATINVINCIBLE) {
            this.trash.forEach((shot) => {
                if (shot.stillCookin) {
                    if (this.player.health > 0 && !(this.player.invincible) && shot.sprite.position.distanceTo(this.player.position) < 20 ) {
                        let antennas = this.player.equippables.find((equippable) => equippable instanceof Antennas)
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
                            shot.sprite.visible = false;
                            shot.stillCookin = false;
                            this.player.animation.playIfNotAlready("DAMAGE", false);
                            this.player.startIFrames();
                        }

                    }
                    //Check if 2000 necessary
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
            })
        }
        this.trash = this.trash.filter((shot) => shot.stillCookin == true);
    }

    public updateSpitballs(deltaT) {
        this.spitballs.forEach((shot) => {
            if (shot.stillCookin){    
                this.battlers.forEach((battler) => {           
                    if (battler instanceof NPCActor && shot.sprite.position.distanceTo(battler.position) < 20 ) {
                        if (this.CHEATPOWGUN) {
                            battler.health = battler.health - 500;
                        }
                        else {
                            battler.health = battler.health - 1;  
                            battler.animation.playIfNotAlready("HURT", false);                     
                        }
                        shot.sprite.visible = false;
                        shot.stillCookin = false;

                    }
                    else if (shot.sprite.position.distanceTo(this.player.position) > 1000) {
                        shot.sprite.visible = false;
                        shot.stillCookin = false;
                    }
                    })
                shot.sprite.position.add(shot.velocity.clone().scaled(deltaT));                    
                shot.sprite.rotation = shot.sprite.rotation + deltaT * 2;

            }
            else {
                shot.sprite.destroy();
            }
        })

        this.spitballs = this.spitballs.filter((shot) => shot.stillCookin == true);
    }

    public updateContactDamage() {
        this.closestEnemy = null;
        this.battlers.forEach((battler) => {
            if (!(battler instanceof NPCActor)) {
                return;
            }

            let distToPlayer = battler.position.distanceTo(this.player.position);
            if (!this.closestEnemy || this.player.position.distanceTo(this.closestEnemy.position) > this.player.position.distanceTo(battler.position)) {
                this.closestEnemy = battler;
            }

            if (this.CHEATINVINCIBLE) {
                return;
            }

            if (this.player.health > 0 && !(this.player.invincible) && distToPlayer < 20) {
                let antennas = this.player.equippables.find((equippable) => equippable instanceof Antennas)
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
                        console.log(this.player.health);
                        this.player.animation.playIfNotAlready("DAMAGE", false);
                        this.player.startIFrames();
                    }
                }
            }
        })
    }

    public updateCrystals() {
        this.sceneCrystals.forEach((crystal) => {
            if (crystal.position.distanceTo(this.player.position) <= 30) {
                this.player.crystals += crystal.value;
                crystal.visible = false;
            }
        });
        this.sceneCrystals = this.sceneCrystals.filter((crystal) => crystal.visible);
    }

    /**
     * Handle events from the rest of the game
     * @param event a game event
     */
    public handleEvent(event: GameEvent): void {
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
                this.player.position.copy(this.MERCHANT_LOCATION);
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

    protected handleDaNeedleUsed(needlePosition) {
        this.battlers.forEach(battler => {
            if (battler instanceof NPCActor) {
                if (battler.position.distanceTo(needlePosition) < 70) {
                    battler.health = battler.health - 0.1;
                    battler.animation.playIfNotAlready("HURT", false);
                }
            }
        });
    }
    protected handleUsedGum() {
        this.battlers.forEach(battler => {
            if (battler instanceof NPCActor) {
                let prevSpeed = battler.speed;
                battler.speed = battler.speed / 2;
                let activeTimer = new Timer(5000, () => battler.speed = prevSpeed, false);
                activeTimer.start();
            }
        });
    }

    protected handleUsedRaccoonTail() {
        this.treasure.forEach(cache => {
            if (cache.sprite.position.distanceTo(this.player.position) < 100) {
                this.dropOrChooseItem(cache.sprite.position, 999);
                cache.sprite.destroy();
            }
        })
    }

    protected handleItemRequest(player: PlayerActor, inventory: Inventory): void {
        console.log("Total equippables:", this.sceneEquippables.length);
        //changed so i only really consider the items i need to, otherwise you cant pickup items in the same spot as max stacked
        let items: Item[] = this.sceneEquippables.filter((item: Item) => {
            //Couldnt figure out how else to do this other than just twice
            let alreadyHas = player.equippables.find((equippable) => equippable.constructor === item.constructor);
            if (item.inventory !== null || item.position.distanceTo(player.position) > 100 ||
                (alreadyHas && alreadyHas.curStack >= alreadyHas.maxStack)) {
                return false;
            }

            if (item instanceof Healthpack) {
                return true;
            }

            return true;
        });
        if (items.length > 0) {
            let closestItem = items.reduce(ClosestPositioned(player));
            if (closestItem instanceof Healthpack) {
                let newHealth;
                if (player.maxHealth < player.health + 5) {
                    newHealth = player.maxHealth;
                }
                else {
                    newHealth = player.health + 5;
                }
                player.health = newHealth;
                closestItem.visible = false;
                this.sceneEquippables = this.sceneEquippables.filter((equippable) => equippable !== closestItem);
                return;
            }

            //If has item, then constructor will be same (implementing stack system), i think this actually needs ===?
            let alreadyHas = player.equippables.find((equippable) => equippable.constructor === closestItem.constructor);

            if (alreadyHas) {
                if (alreadyHas.maxStack <= alreadyHas.curStack) {
                    //probably should add some sorta noise so it isnt frustrating
                    return;
                }
                else {
                    alreadyHas.curStack += 1;
                    closestItem.visible = false;
                    this.sceneEquippables = this.sceneEquippables.filter((equippable) => equippable !== closestItem);
                    alreadyHas.applyBuff(this.player);
                    return;
                }
            }
            //OTHERWISE JUST EQUIP AS NORMAL
            player.equip(closestItem);
            if (closestItem instanceof DaNeedle) {
                this.needle = closestItem as DaNeedle;
            }
        }
    } 

    /**
     * Handles an NPC being killed by unregistering the NPC from the scenes subsystems
     * @param event an NPC-killed event
     */
    protected handleBattlerKilled(event: GameEvent): void {
        let id: number = event.data.get("id");
        let battler = this.battlers.find(b => b.id === id);

        if (battler) {
            let deathSpot = battler.position.clone();
            if (battler instanceof PlayerActor) {
                if (this.playerDead) return; // already dying, ignore repeated events
                this.playerDead = true;
                this.player.crystals = Math.floor(this.player.crystals / 2);
                battler.animation.play("DYING", false, "DEAD");
                let deathTimer = new Timer(2500, () => this.sceneManager.changeToScene(GameOver), false);
                deathTimer.start();
            }
            else if (battler == this.boss) {
                let raccoonTailSprite = this.add.sprite("RaccoonTail", "primary");
                let raccoonTail = new RaccoonTail(raccoonTailSprite);
                raccoonTail.position.copy(deathSpot);
                this.sceneEquippables.push(raccoonTail);

                let crystalSprite;
                let crystal;
                for (let i = 0; i < 10; i++) {
                    crystalSprite = this.add.sprite("Crystal", "primary");
                    crystalSprite.scale.set(0.75, 0.75);
                    crystal = new Crystal(crystalSprite);
                    crystal.position.copy(deathSpot.clone().add( new Vec2(Math.random() * 15, Math.random() * 15)));
                    this.sceneCrystals.push(crystal);
                }
                this.bossDead = true;
            }
            else {
                this.leftInCurWave -= 1;
                console.log("Enemy Killed: ", this.leftInCurWave, " of ", this.totSpawned, " spawned enemies left")
                battler.battlerActive = false;
                this.healthbars.get(battler).visible = false;
                this.healthbars.delete(battler);
                this.battlers = this.battlers.filter(b => b.id !== id);
                if (Math.random() * this.player.luck >= 0.85) {
                    this.dropOrChooseItem(deathSpot, 999);
                    console.log("Item dropped!")
                }

                let crystalSprite = this.add.sprite("Crystal", "primary");
                crystalSprite.scale.set(0.75, 0.75);
                let crystal = new Crystal(crystalSprite);
                crystal.position.copy(deathSpot.clone().add( new Vec2(Math.random() * 15, Math.random() * 15)));
                this.sceneCrystals.push(crystal);

                if (this.leftInCurWave < 1 && this.totSpawned >= this.totInCurWave) {
                    this.waveAlerts.playWaveDefeated();
                    this.waveDelayTimer.start();
                }

            }
        }
 
    }

    protected dropOrChooseItem(position: Vec2, i: number) {
        let choice = Math.floor(Math.random() * 7);

        let sprite;
        let newOb;
        switch(choice) {
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
            default:
                break;
        }
        if (i == 999) {
            newOb.position.set(position.x, position.y);
            this.sceneEquippables.push(newOb);
        }
        else {
            sprite.visible = false;
            newOb.position.set(0, -500)
            this.forSale[i] = newOb;
        }
    }

    /** Initializes the layers in the scene */
    protected initLayers(): void {
        this.addLayer("primary", 3); //Trying to make player render behind overlayed walls
        this.addLayer("equippables", 5);
        this.addUILayer("slots");
        this.addUILayer("items");
        this.getLayer("slots").setDepth(1);
        this.getLayer("items").setDepth(2);
        this.getLayer("slots").setHidden(true);
        this.getLayer("items").setHidden(true);
        this.addUILayer("hud");
        this.addLayer("arrowLayer", 8)
    }

    /** all pause menu UI elements (hidden by default) */
    protected initPauseMenu(): void {
        // pause UI layers rendered above everything
        this.addUILayer("pause");
        this.getLayer("pause").setDepth(10);
        this.addUILayer("pauseOverlay");
        this.getLayer("pauseOverlay").setDepth(11);

        const cx = 256;
        const cy = 256;

        // dim overlay
        this.pauseDim = this.add.graphic(GraphicType.RECT, "pause", {
            position: new Vec2(cx, cy),
            size: new Vec2(512, 512)
        });
        this.pauseDim.color = new Color(0, 0, 0, 0.7);
        this.pauseDim.visible = false;

        // "PAUSED" title label
        this.pauseTitle = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
            position: new Vec2(cx, cy - 90),
            text: "PAUSED"
        });
        this.pauseTitle.size.set(300, 40);
        this.pauseTitle.borderWidth = 0;
        this.pauseTitle.backgroundColor = new Color(0, 0, 0, 0);
        this.pauseTitle.textColor = Color.WHITE;
        this.pauseTitle.fontSize = 24;
        this.pauseTitle.visible = false;

        // Button definitions: [label, eventId]
        const buttonDefs: [string, string][] = [
            ["Resume",          "resume"],
            ["Return to Menu",  "pause_mainmenu"],
            ["Controls",        "pause_controls"],
            ["About",           "pause_about"],
            ["Help",            "pause_help"],
            ["Cheats",            "pause_cheats"],
        ];

        const startY = cy - 50;
        const spacing = 35;

        for (let i = 0; i < buttonDefs.length; i++) {
            const [label, eventId] = buttonDefs[i];
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
                position: new Vec2(cx, startY + i * spacing),
                text: label
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

        // subscribe to pause button events
        this.receiver.subscribe("resume");
        this.receiver.subscribe("pause_mainmenu");
        this.receiver.subscribe("pause_controls");
        this.receiver.subscribe("pause_about");
        this.receiver.subscribe("pause_help");
        this.receiver.subscribe("pause_cheats");

        // TODO: replace temp pages with final about/help/controls page sprites when designed
        this.pauseHelpPages = [
/*             this.add.sprite("about-page",    "pauseOverlay"),
            this.add.sprite("help-page",     "pauseOverlay"),
            this.add.sprite("controls-page", "pauseOverlay"), */
            this.add.sprite("about1",    "pauseOverlay"),
            this.add.sprite("about2",    "pauseOverlay"),
            this.add.sprite("about3",    "pauseOverlay"),
            this.add.sprite("help",     "pauseOverlay"),
            this.add.sprite("controls", "pauseOverlay"),
            this.add.sprite("cheats",    "pauseOverlay")
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

    /** pause menu */
    protected pauseGame(): void {
        this.paused = true;

        //Found that if I could just access the TimerManager itself and stop its changes, it would just pause all progression
        TimerManager.getInstance().pauseAllTimers();
        this.getLayer("primary").setPaused(true);
        this.getLayer("equippables").setPaused(true);

        // Freeze all AI (AIManager updates independently of layer pause)
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

    /** resume the game and hides all pause UI */
    protected resumeGame(): void {
        this.paused = false;
        TimerManager.getInstance().unpauseAllTimers();

        this.getLayer("primary").setPaused(false);
        this.getLayer("equippables").setPaused(false);

        // reenable all AI
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

        // close help overlay if open
        if (this.pauseHelpOpen) {
            this.pauseHelpOpen = false;
            for (const page of this.pauseHelpPages) page.visible = false;
            this.pauseHelpClose.visible = false;
        }
    }

    /** open a help/about/controls page from the pause menu */
    protected openPauseHelp(page: number): void {
        this.pauseHelpOpen = true;
        // hide pause buttons
        this.pauseTitle.visible = false;
        for (const btn of this.pauseButtons) btn.visible = false;
        // show requested page and close button
        for (let i = 0; i < this.pauseHelpPages.length; i++) {
            this.pauseHelpPages[i].visible = i === page;
        }
        this.pauseHelpClose.visible = true;

        if (page < 3 && page >= 0) {
            if (this.curAboutPage > 0) {
                this.aboutPrev.visible = true;
            }
            else {
                this.aboutPrev.visible = false;
            }
            if (this.curAboutPage < 2) {
                this.aboutNext.visible = true;
            }
            else {
                this.aboutNext.visible = false;
            }
        }
    }

    /** close help overlay and return to pause buttons */
    protected closePauseHelp(): void {
        this.pauseHelpOpen = false;
        for (const page of this.pauseHelpPages) page.visible = false;
        this.pauseHelpClose.visible = false;
        // Show pause buttons again
        this.pauseTitle.visible = true;
        this.aboutNext.visible = false;
        this.aboutPrev.visible = false;
        for (const btn of this.pauseButtons) btn.visible = true;
    }

        /**  merchant menu init - mostly copied from pauseinit */
    protected initShopMenu(): void {
        const cx = 256;
        const cy = 256;

        //Title label
        this.shopTitle = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
            position: new Vec2(cx, cy - 90),
            text: "Shhh..."
        });
        this.shopTitle.size.set(200, 30);
        this.shopTitle.borderWidth = 0;
        this.shopTitle.backgroundColor = new Color(0, 0, 0, 0);
        this.shopTitle.textColor = Color.WHITE;
        this.shopTitle.fontSize = 24;
        this.shopTitle.visible = false;
        this.shopTitle.position.set(256, 100);

        // Button definitions: [label, eventId]
        const shhButtons: [string, string][] = [
            ["Buy", "buy"],
            ["Sell", "sell"],
            ["Resume", "resume"],
        ];

        const buyerButtons: [string, string][] = [
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
                text: label
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
                text: label
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
        // subscribe to pause button events
        this.receiver.subscribe("buy");
        this.receiver.subscribe("sell");
        this.receiver.subscribe("reset_shop");         

        this.pauseHelpClose = this.add.sprite("back-button", "pauseOverlay");
        this.pauseHelpClose.position.set(50, 50);
        this.pauseHelpClose.scale.set(3, 3);
        this.pauseHelpClose.visible = false;

        //Populated the buy itemsfor merchant
        this.setBuyItems();
    }
    
    public openBuyMenu() {
        this.shopState = "buy";

        //Hide mainbuttons
        for (const btn of this.mainButtons) btn.visible = false;

        //Buy buttons/back button/change title
        this.shopTitle.text = "Buy"

        const cx = 256
        const startY = 130;
        const spacing = 35;
        
        for (let i = 0; i < 3; i++) {
            let equippable = this.forSale[i];
            let tray;
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

                //For adding little icon to the left so you know what you are selling
                let sprite = equippable.getSprite().imageId;
                let spriteOverlay = this.add.sprite(sprite, "pauseOverlay");
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

    //absolute shit show
    public openSellMenu() {
        this.shopState = "sell";

        //Hide mainbuttons/last merchant sprites
        for (const btn of this.mainButtons) btn.visible = false;
        for (const btn of this.sellButtons) btn.destroy();
        this.sellButtons = [];
        for (const sprite of this.merchantSprites) sprite.destroy();
        this.merchantSprites = [];
        this.sellables = [];
        //back button/change title
        
        this.shopTitle.text = "Sell"
        this.pauseHelpClose.visible = true;

        const cx = 256
        const startY = 130;
        const spacing = 35;

        let i = 0;

        //Gotta add support to just iterate over inventories 
        let equippables = [...this.player.equippables.items()];
        equippables.forEach((equippable) => {
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "pauseOverlay", {
                position: new Vec2(cx + 50, startY + i * spacing),
                text: `Sell for ${Math.floor(equippable.value / 2)} crystals?`
            });
            btn.size.set(400, 28);
            btn.borderWidth = 2;
            btn.borderColor = Color.WHITE;
            btn.backgroundColor = new Color(60, 60, 60, 200);
            let tray;
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

            //For adding little icon to the left so you know what you are selling
            let sprite = equippable.getSprite().imageId;
            let spriteOverlay = this.add.sprite(sprite, "pauseOverlay");
            spriteOverlay.position.set(cx - 90, startY + i * spacing);
            this.merchantSprites.push(spriteOverlay);
        
            i++;
        });
    }

    public sellEquippable(id) {
        let equippable = this.player.equippables.find(b => b.id === id);
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

    public buyEquippable(equippable: Item, i: number) {
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

    /**
     * Initializes the player in the scene
     */
    protected initializePlayer(): PlayerActor {
        let player = this.add.animatedSprite(PlayerActor, "player1", "primary");
        let spawnPos = new Vec2(-1500, 1000);
        player.position.copy(spawnPos);
        player.battleGroup = 2;

        player.health = 10;
        player.maxHealth = 10;

        player.abilities.onChange = ItemEvent.INVENTORY_CHANGED
        this.inventoryHud = new InventoryHUD(this, player.abilities, "inventorySlot", {
            start: new Vec2(232, 24),
            slotLayer: "slots",
            padding: 3,
            itemLayer: "items"
        });

        // Give the player physics
        player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), Vec2.ZERO, true, false);
        player.scale.set(1, 1);

        // player hp bar
        let healthbar = new HealthbarHUD(this, player, "hud", {size: new Vec2(400, 25), offset: Vec2.ZERO, static: true, staticPosition: new Vec2(115, 25)});
        this.healthbars.set(player, healthbar);

        let healthbarSprite = this.add.animatedSprite(AnimatedSprite, "healthbar", "hud");
        healthbarSprite.scale.set(1.6, 1.8);
        healthbar.switchToAnimatedHB(healthbarSprite);


        let waveCrest = this.add.animatedSprite(AnimatedSprite, "wave_crest", "hud");
        waveCrest.position.set(125, -38);
        waveCrest.scale.set(1.6, 1.8);
        waveCrest.animation.play("WAVE_1", true);
        this.waveCrestSprite = waveCrest;



        // passive relic tray (below hp bar)
        this.relicTray = new RelicTrayHUD(this, player.equippables, "hud", {
            position: new Vec2(115, 50),
            size: new Vec2(400, 60),
            iconSize: 25,
            padding: 8
        });

        // weapon + ability slots (right of hp bar/tray)
        this.actionSlots = new ActionSlotsHUD(this, "hud", player.equippables, player.abilities, {
            startX: 200,
            topY: -4,
            height: 92,
            boxWidth: 92,
            weaponAbilityGap: 20,
            abilityGap: -35
        }, player);


        // Give the player PlayerAI
        player.addAI(PlayerController);

        // Start the player in the "IDLE" animation
        player.animation.play("IDLE");

        this.battlers.push(player);
        this.viewport.follow(player);

        this.player = player;

        let arrowSprite = this.add.sprite("arrowSprite", "arrowLayer");
        this.arrow = new Arrow(arrowSprite, this.player);


        return player;
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
            let npc = this.add.animatedSprite(NPCActor, "RedEnemy", "primary");
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
        merchant.scale.set(0.25, 0.25);
        merchant.animation.playIfNotAlready("Idle", true);

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
    protected initTweenGraphics() {
        let alertSprite = this.add.animatedSprite(AnimatedSprite, "wave_alerts", "hud");
        let size = this.viewport.getHalfSize().scaled(2);
        this.waveAlerts = new WaveAlerts(alertSprite, size);
        alertSprite.animation.playIfNotAlready("WAVE_1");
    }

    protected setBuyItems() {
        for (let i = 0; i < 3; i++) {
            this.dropOrChooseItem(new Vec2(0,0), i);
        }
    }
    


    public cheatGiveItems(): void{
        let playerAt = new Vec2(-1500, 1000);

        let shieldSprite = this.add.sprite("Shield", "primary");
        let shield = new Shield(shieldSprite);
        shield.position.copy(new Vec2(playerAt.x + 100, playerAt.y + 100));
        this.sceneEquippables.push(shield);

        let redHatSprite = this.add.sprite("RedHat", "primary");
        let redHat = new RedHat(redHatSprite);
        redHat.position.copy(new Vec2(playerAt.x - 100, playerAt.y + 100));
        this.sceneEquippables.push(redHat);

        let raccoonTailSprite = this.add.sprite("RaccoonTail", "primary");
        let raccoonTail = new RaccoonTail(raccoonTailSprite);
        raccoonTail.position.copy(new Vec2(playerAt.x + 100, playerAt.y - 100));
        this.sceneEquippables.push(raccoonTail);

        let jetPackSprite = this.add.sprite("JetPack", "primary");
        let jetPack = new JetPack(jetPackSprite);
        jetPack.position.copy(new Vec2(playerAt.x, playerAt.y + 100));
        this.sceneEquippables.push(jetPack);

        let healthPackSprite = this.add.sprite("healthpack", "primary");
        let healthPack = new Healthpack(healthPackSprite);
        healthPack.position.copy(new Vec2(playerAt.x + 100, playerAt.y));
        this.sceneEquippables.push(healthPack);

        let gumSprite = this.add.sprite("Gum", "primary");
        let gum = new Gum(gumSprite);
        gum.position.copy(new Vec2(playerAt.x + 100, playerAt.y + 200));
        this.sceneEquippables.push(gum);

        let daNeedleSprite = this.add.sprite("DaNeedle", "primary");
        let daNeedle = new DaNeedle(daNeedleSprite);
        daNeedle.position.copy(new Vec2(playerAt.x + 200, playerAt.y + 100));
        this.sceneEquippables.push(daNeedle);

        let antennaSprite = this.add.sprite("Antennas", "primary");
        let antennas = new Antennas(antennaSprite);
        antennas.position.copy(new Vec2(playerAt.x - 100, playerAt.y - 100));
        this.sceneEquippables.push(antennas);
    }

    public spawnTrash(position: Vec2, direction: Vec2) {
        let choice = Math.random();
        let trashSprite;
        if (choice > 0.5) {
            trashSprite = "trash-paper"
        }
        else {
            trashSprite = "trash-banana"
        }

        let trash = this.add.sprite(trashSprite, "primary");
        trash.position.set(position.x, position.y);
        trash.scale.set(1, 1);
        this.trash.push({sprite: trash, velocity: direction.scaled(100), stillCookin: true})

    }

    public spawnSpitball(position: Vec2, direction: Vec2) {
        let spitball = this.add.sprite("spitball", "primary");
        spitball.position.set(position.x, position.y);
        spitball.scale.set(1, 1);
        this.spitballs.push({sprite: spitball, velocity: direction.scaled(120), stillCookin: true})

    }

    /**
     * Initializes the navmesh graph used by the NPCs in the SMScene. This method is a little buggy, and
     * and it skips over some of the positions on the tilemap. If you can fix my navmesh generation algorithm,
     * go for it.
     * 
     */
    protected initializeNavmesh(graph: PositionGraph, walls: IsometricTilemap[]): void {
        let dim: Vec2 = walls[0].getDimensions();
        for (let i = 0; i < dim.y; i++) {
            for (let j = 0; j < dim.x; j++) {
                let collider = walls[0].getTileCollider(j, i);
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
                // Create edge to the left
                rc = walls[0].getTileColRow(i + 1);
                if ((i + 1) % dim.x !== 0 && !this.isWall(rc.x, rc.y)) {
                    graph.addEdge(i, i + 1);
                    //this.add.graphic(GraphicType.LINE, "graph", {start: this.navmesh.graph.getNodePosition(i), end: this.graph.getNodePosition(i + 1)})
                }
                // Create edge below
                rc = walls[0].getTileColRow(i + dim.x);
                if (i + dim.x < graph.numVertices && !this.isWall(rc.x, rc.y)) {
                    graph.addEdge(i, i + dim.x);
                    //this.add.graphic(GraphicType.LINE, "graph", {start: this.navmesh.graph.getNodePosition(i), end: this.graph.getNodePosition(i + dim.x)})
                }
                this.spawnableNodes.push(i);
            }
        }

        // Set this graph as a navigable entity
        this.navmesh = new Navmesh(graph);
        
        // Add different strategies to use for this navmesh
        this.navmesh.registerStrategy("direct", new DirectStrategy(this.navmesh));
        this.navmesh.registerStrategy("astar", new AstarStrategy(this.navmesh));

        // TODO set the strategy to use A* pathfinding
        this.navmesh.setStrategy("astar");

        // Add this navmesh to the navigation manager
        this.navManager.addNavigableEntity("navmesh", this.navmesh);
    }

    protected isWall(col: number, row: number) {
        let isReallyWall = false;
        this.bothWalls.forEach((walltype) => {
            if (walltype.getTile(col, row) !== 0) {
                isReallyWall = true
            }
        });
        return isReallyWall;
    }
    
    public getRandomNodePosition() {
        let angle = Math.PI * 2 * Math.random();
        let spawnPosX = this.player.position.x + Math.cos(angle) * 300;
        let spawnPosY = this.player.position.y + Math.sin(angle) * 300;
        let spawnPos = new Vec2(spawnPosX, spawnPosY);

        let spawnOptions = this.spawnableNodes.filter((node) => {
            return this.navmesh.graph.getNodePosition(node).distanceTo(spawnPos) < 200;
        });

        let lenOpts = spawnOptions.length;
        let choice;
        if (lenOpts > 0) {
            choice = spawnOptions[Math.floor(Math.random() * lenOpts)];
        }
        else {
            choice = this.spawnableNodes[Math.floor(Math.random() * this.spawnableNodes.length)];
        }

        return this.navmesh.graph.getNodePosition(choice);

    }

    public startWave(waveNum) {
        this.totSpawned = 0;
        this.totInCurWave = 0;
        if (waveNum == 0) {
            console.log("Wave 1 starting");

            this.curWave = 1;
            this.leftInCurWave = 5;
            this.totInCurWave = 5;
            this.curDelay = 1000;

            this.spawnDelayTimer.start(this.curDelay)
        }
        else if (waveNum == 1) {
            console.log("Wave 2 starting");
            this.curWave = 2;
            this.leftInCurWave = 10;
            this.totInCurWave = 10;
            this.curDelay = 700;
            this.spawnDelayTimer.start(this.curDelay);
        }
        else if (waveNum == 2) {
            console.log("Wave 3 starting");
            this.curWave = 3;
            this.leftInCurWave = 30;
            this.totInCurWave = 30;
            this.curDelay = 300;
            this.spawnDelayTimer.start(this.curDelay);
        }
        //Boss wave
        else if (waveNum == 3) {
            console.log("Final wave starting");
            this.curWave = 4;
            this.leftInCurWave = 1000;
            this.totInCurWave = 1000;
            this.curDelay = 1000;
            this.spawnDelayTimer.start(this.curDelay);
            this.spawnBoss();
        }
    }

    public spawnBoss() {     
        let boss = this.add.animatedSprite(NPCActor, "raccoon", "primary");
        boss.position.set(230, 1000);
        boss.addPhysics(new AABB(Vec2.ZERO, new Vec2(30, 53)), null, false);
        boss.scale.set(1, 1);

        // Give the NPC a healthbar
        let healthbar = new HealthbarHUD(this, boss, "primary", {size: boss.size.clone().scaled(1, 1/4), offset: boss.size.clone().scaled(0, -1/2)});
        this.healthbars.set(boss, healthbar);
        healthbar.visible = false;
        
        // Set the NPCs stats
        boss.battleGroup = 1
        boss.speed = 0;
        boss.health = 30;
        boss.maxHealth = 30;
        boss.navkey = "navmesh";


        boss.addAI(RaccoonBehavior, {target: this.player, range: 750});

        // Play the NPCs "IDLE" animation 
        boss.animation.play("IDLE");

        this.boss = boss;

        // Add the NPC to the battlers array
        this.battlers.push(boss);
      
    }

    public spawnEnemies() {
        let spawnPos = this.getRandomNodePosition();

        console.log("spawned mouse");
        let npc = this.add.animatedSprite(NPCActor, "RedEnemy", "primary");
        npc.position.set(spawnPos.x, spawnPos.y);
        console.log("spawned mouse at x:", spawnPos.x, "y:", spawnPos.y)
        npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(3, 3)), null, false);
        npc.scale.set(0.25, 0.25);

        // Give the NPC a healthbar
        let healthbar = new HealthbarHUD(this, npc, "primary", {size: npc.size.clone().scaled(1, 1/4), offset: npc.size.clone().scaled(0, -1/2)});
        this.healthbars.set(npc, healthbar);
        healthbar.visible = false;
        
        // Set the NPCs stats
        npc.battleGroup = 1
        npc.speed = 50;
        npc.health = 10;
        npc.maxHealth = 10;
        npc.navkey = "navmesh";

        npc.addAI(GuardBehavior, {target: this.player, range: 100});

        // Play the NPCs "IDLE" animation 
        npc.animation.play("IDLE");
        
        // Add the NPC to the battlers array
        this.battlers.push(npc);

    }

    public getBattlers(): Battler[] { return this.battlers; }

    public getPlayer(): PlayerActor { return this.player}

    public getWalls(): IsometricTilemap { return this.walls; }

    public getNavmesh(): Navmesh {return this.navmesh;}

    public toggleCheatPow(): void {this.CHEATPOWGUN = !this.CHEATPOWGUN};
    public toggleCheatInvincible(): void {this.CHEATINVINCIBLE = !this.CHEATINVINCIBLE};

    /**
     * Checks if the given target position is visible from the given position.
     * @param position 
     * @param target 
     * @returns 
     */
    public isTargetVisible(position: Vec2, target: Vec2): boolean {

        // Get the new player location
        let start = position.clone();
        let delta = target.clone().sub(start);

        // Iterate through the tilemap region until we find a collision
        let minX = Math.min(start.x, target.x);
        let maxX = Math.max(start.x, target.x);
        let minY = Math.min(start.y, target.y);
        let maxY = Math.max(start.y, target.y);

        // Get the wall tilemap
        let walls = this.getWalls();

        let minIndex = walls.getTilemapPosition(minX, minY);
        let maxIndex = walls.getTilemapPosition(maxX, maxY);

        let tileSize = walls.getScaledTileSize();

        for (let col = minIndex.x; col <= maxIndex.x; col++) {
            for (let row = minIndex.y; row <= maxIndex.y; row++) {
                if (this.isWall(col, row)) {
                    // Get the position of this tile
                    //let tilePos = new Vec2(col * tileSize.x + tileSize.x / 2, row * tileSize.y + tileSize.y / 2);
                    let tilePos = walls.getWorldPosition(col, row);
                    // Create a collider for this tile
                    let collider = new AABB(tilePos, tileSize.scaled(1 / 2));

                    let hit = collider.intersectSegment(start, delta, Vec2.ZERO);

                    if (hit !== null && start.distanceSqTo(hit.pos) < start.distanceSqTo(target)) {
                        // We hit a wall, we can't see the player
                        return false;
                    }
                }
            }
        }
        return true;

    }
}