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
import { ItemEvent, PlayerEvent, BattlerEvent, AbilityEvent, CheatEvent } from "../Events";
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

const BattlerGroups = {
    RED: 1,
    BLUE: 2
} as const;

export default class MainSMScene extends SMScene {

    /** GameSystems in the SM Scene */
    private inventoryHud: InventoryHUD;
    private relicTray: RelicTrayHUD;
    private actionSlots: ActionSlotsHUD;

    /** All the battlers in the SMScene (including the player) */
    private battlers: (Battler & Actor)[];
    /** Healthbars for the battlers */
    //Changed to map to battler instead (dont want to have to find every time)
    private healthbars: Map<Battler & Actor, HealthbarHUD>;



    //bullets trash/player
    private trash: {sprite: Sprite, velocity: Vec2, stillCookin: boolean}[] = [];
    private spitballs: {sprite: Sprite, velocity: Vec2, stillCookin: boolean}[] = [];


    private treasure: {sprite: Sprite, stillCookin: boolean}[];

    private bases: BattlerBase[];

    private sceneEquippables: Array<Item>;

    private player: PlayerActor;
    private boss: NPCActor;

    // The wall layer of the tilemap
    private walls: IsometricTilemap;

    // The position graph for the navmesh
    private graph: PositionGraph;
    private navmesh: Navmesh;


    //Spawn Logic
    private playerDead: boolean = false;
    private curWave: number;
    private leftInCurWave: number;
    private totSpawned: number;
    private curDelay: number;

    private spawnDelayTimer: Timer;
    private waveDelayTimer: Timer;

    private bossDead: boolean;

    private closestEnemy: NPCActor | null;

    private needle: DaNeedle | null;

    //Cheats
    private CHEATINVINCIBLE = false;
    private CHEATPOWGUN = false;

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);

        this.battlers = new Array<Battler & Actor>();
        this.healthbars = new Map<Battler & Actor, HealthbarHUD>();
        this.treasure = [];

        this.sceneEquippables = new Array<Item>();

        this.curDelay = 0;
        this.totSpawned = 0;
        this.curWave = 0;
        this.leftInCurWave = 0;
        this.waveDelayTimer = new Timer(5000, () => this.startWave(this.curWave), false);

        this.spawnDelayTimer = new Timer(this.curDelay, () => {
            if (!this.bossDead && this.totSpawned < this.leftInCurWave) {
                this.spawnEnemies();
                this.totSpawned += 1;
                console.log("Total enemies left to spawn: ", this.totSpawned, "/", this.leftInCurWave);
            }
            else if (this.totSpawned == this.leftInCurWave) {
                console.log("All enemies spawned ", this.curWave);
                this.spawnDelayTimer.pause()
            }
            else if (this.bossDead) {
                console.log("You beat the boss!")
                this.spawnDelayTimer.pause()
            }
        }, true);

        this.bossDead = false;
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

        //raccoon bullets
        this.load.image("trash-paper", "game_assets/sprites/trash-paper.png");
        this.load.image("trash-banana", "game_assets/sprites/trash-banana.png");

        //your bullets
        this.load.image("spitball", "game_assets/sprites/spitball.png")
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
        let midCol = Math.floor(this.walls.getDimensions().x / 2);
        let midRow = Math.floor(this.walls.getDimensions().y / 2);
        let midMap = new Vec2(midCol, midRow);
        let centerMap = this.walls.getWorldPosition(midCol, midRow);
        //this.viewport.setCenter(centerMap!.x, centerMap!.y);

        this.viewport.setBounds(
            -this.walls.size.x,
            -this.walls.size.y,
            this.walls.size.x * 2,
            this.walls.size.y * 2
        );

        this.viewport.setZoomLevel(2);

        this.initLayers();
        
        this.initializeNavmesh(new PositionGraph(), this.walls);

        // Create the Player/NPCS
        this.initializeNPCs(this.initializePlayer());
        // Create the player
        this.initializeItems();

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
        this.receiver.subscribe(CheatEvent.CHEAT_SPAWN_BOSS);

        this.receiver.subscribe(CheatEvent.CHEAT_CITY);
        this.receiver.subscribe(CheatEvent.CHEAT_MOUNTAIN);
        this.receiver.subscribe(CheatEvent.CHEAT_OCEAN);
        this.receiver.subscribe(CheatEvent.CHEAT_TOP_LEVEL);


        this.viewport.setCenter(centerMap!.x, centerMap!.y);
        this.viewport.setFocus(new Vec2(centerMap!.x, centerMap!.y));

        this.waveDelayTimer.start();
    }
    /**
     * @see Scene.updateScene
     * UPDATER +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
     */
    public override updateScene(deltaT: number): void {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }

/*         this.inventoryHud.update(deltaT);
        this.relicTray.update(deltaT);
        this.actionSlots.update(deltaT);
        this.healthbars.forEach(healthbar => healthbar.update(deltaT)); */

    this.inventoryHud.update(deltaT);
    this.relicTray.update(deltaT);
    this.actionSlots.update(deltaT);
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
        this.updateContactDamage(deltaT);


        if (this.player.hasNeedle && this.needle.isSpinning) {
            this.handleDaNeedleUsed(this.needle.position);
        }
    }

    public updateTrash(deltaT) {           
        if (!this.CHEATINVINCIBLE) {
            this.trash.forEach((shot) => {
                if (shot.stillCookin) {
                    if (this.player.health > 0 && !(this.player.invincible) && shot.sprite.position.distanceTo(this.player.position) < 20 ) {
                        let antennas = this.player.equippables.find((equippable) => equippable instanceof Antennas);
                        if (antennas) {
                            this.player.equippables.remove(antennas.id);
                            antennas.visible = false;
                            this.player.startIFrames();
                        }
                        else {
                            let shield = this.player.equippables.find((equippable) => equippable instanceof Shield);
                            let dr = 1;
                            if (shield) {
                                dr = 0.8
                            }
                            this.player.health = this.player.health - 3 * dr;
                            shot.sprite.visible = false;
                            shot.stillCookin = false;
                            this.player.animation.playIfNotAlready("DAMAGE", false);
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
                    shot.sprite.position.add(shot.velocity.clone().scaled(deltaT));

                    shot.sprite.rotation = shot.sprite.rotation + deltaT * 2;
                })
            }
            else {
                shot.sprite.destroy();
            }
        })

        this.spitballs = this.spitballs.filter((shot) => shot.stillCookin == true);
    }

    public updateContactDamage(deltaT) {
        if (!this.CHEATINVINCIBLE) {
            this.battlers.forEach((battler) => {
                if (this.player.health > 0 && !(this.player.invincible) && battler instanceof NPCActor && battler.position.distanceTo(this.player.position) < 20) {
                    let antennas = this.player.equippables.find((equippable) => equippable instanceof Antennas)
                    if (antennas) {
                        this.player.equippables.remove(antennas.id);
                        antennas.visible = false;
                        this.player.startIFrames();
                    }
                    else {
                        let shield = this.player.equippables.find((equippable) => equippable instanceof Shield);
                        let dr = 1;
                        if (shield) {
                            dr = 0.8
                        }
                        if (battler.health > 0) {
                            this.player.health = this.player.health - 3 * dr;
                            console.log(this.player.health);
                            this.player.animation.playIfNotAlready("DAMAGE", false);
                            this.player.startIFrames();
                        }
                    }
                }
            })
        }
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
            case CheatEvent.CHEAT_SPAWN_BOSS: {
                this.spawnBoss();
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
                this.dropItem(cache.sprite.position);
                cache.sprite.destroy();
            }
        })
    }

    protected handleItemRequest(player: PlayerActor, inventory: Inventory): void {
        console.log("Total equippables:", this.sceneEquippables.length);
        let items: Item[] = this.sceneEquippables.filter((item: Item) => {
            return item.inventory === null && item.position.distanceTo(player.position) <= 100;
        });
        if (items.length > 0) {
            player.equip(items.reduce(ClosestPositioned(player)));
            //Checking if has needle at equip so that we dont have to run back through a loop every update to check for it
            this.needle = this.player.equippables.find((equippable) => equippable instanceof DaNeedle) as DaNeedle ?? null;
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
                battler.animation.play("DYING", false, "DEAD");
                let deathTimer = new Timer(2500, () => this.sceneManager.changeToScene(GameOver), false);
                deathTimer.start();
            }
            else if (battler == this.boss) {
                let raccoonTailSprite = this.add.sprite("RaccoonTail", "primary");
                let raccoonTail = new RaccoonTail(raccoonTailSprite);
                raccoonTail.position.copy(deathSpot);
                this.sceneEquippables.push(raccoonTail);
                this.bossDead = true;
            }
            else {
                this.leftInCurWave -= 1;
                battler.battlerActive = false;
                this.healthbars.get(battler).visible = false;
                this.healthbars.delete(battler);
                this.battlers = this.battlers.filter(b => b.id !== id);
                if (Math.random() * this.player.luck >= 0.85) {
                    this.dropItem(deathSpot);
                    console.log("Item dropped!")
                }
                if (this.leftInCurWave < 1) {
                    //Wave finished tween
                    this.waveDelayTimer.start();
                }

            }
        }
 
    }

    protected dropItem(position: Vec2) {
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

            newOb.position.set(position.x, position.y);
            this.sceneEquippables.push(newOb);
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

        // passive relic tray (below hp bar)
        this.relicTray = new RelicTrayHUD(this, player.equippables, "hud", {
            position: new Vec2(115, 50),
            size: new Vec2(400, 60),
            iconSize: 15,
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
        });

        // Give the player PlayerAI
        player.addAI(PlayerController);

        // Start the player in the "IDLE" animation
        player.animation.play("IDLE");

        this.battlers.push(player);
        this.viewport.follow(player);

        this.player = player;

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
        let dumpster = this.load.getObject("dumpster");

        for (let i = 0; i < dumpster.dumpsters.length; i++) {
            console.log("spawned dumpster");
            let treasure = this.add.sprite("DumpsterSprite", "primary");
            treasure.position.set(dumpster.dumpsters[i][0], dumpster.dumpsters[i][1]);
            treasure.scale.set(1, 1);

            this.treasure.push({sprite: treasure, stillCookin: true});

        }
        //this.spawnBoss();

    }

    protected initializeItems(): void {
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
        this.spitballs.push({sprite: spitball, velocity: direction.scaled(30), stillCookin: true})

    }
    /**
     * Initializes the navmesh graph used by the NPCs in the SMScene. This method is a little buggy, and
     * and it skips over some of the positions on the tilemap. If you can fix my navmesh generation algorithm,
     * go for it.
     * 
     */
    protected initializeNavmesh(graph: PositionGraph, walls: IsometricTilemap): void {
        let dim: Vec2 = walls.getDimensions();
        for (let i = 0; i < dim.y; i++) {
            for (let j = 0; j < dim.x; j++) {
                let collider = walls.getTileCollider(j, i);
                graph.addPositionedNode(collider.center);
            }
        }

        let rc: Vec2;
        for (let i = 0; i < graph.numVertices; i++) {
            rc = walls.getTileColRow(i);
            if (!walls.isTileCollidable(rc.x, rc.y) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x - 1, 0, dim.x - 1), rc.y) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x + 1, 0, dim.x - 1), rc.y) &&
                !walls.isTileCollidable(rc.x, MathUtils.clamp(rc.y - 1, 0, dim.y - 1)) &&
                !walls.isTileCollidable(rc.x, MathUtils.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x + 1, 0, dim.x - 1), MathUtils.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x - 1, 0, dim.x - 1), MathUtils.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x + 1, 0, dim.x - 1), MathUtils.clamp(rc.y - 1, 0, dim.y - 1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x - 1, 0, dim.x - 1), MathUtils.clamp(rc.y - 1, 0, dim.y - 1))

            ) {
                // Create edge to the left
                rc = walls.getTileColRow(i + 1);
                if ((i + 1) % dim.x !== 0 && !walls.isTileCollidable(rc.x, rc.y)) {
                    graph.addEdge(i, i + 1);
                    //this.add.graphic(GraphicType.LINE, "graph", {start: this.navmesh.graph.getNodePosition(i), end: this.graph.getNodePosition(i + 1)})
                }
                // Create edge below
                rc = walls.getTileColRow(i + dim.x);
                if (i + dim.x < graph.numVertices && !walls.isTileCollidable(rc.x, rc.y)) {
                    graph.addEdge(i, i + dim.x);
                    //this.add.graphic(GraphicType.LINE, "graph", {start: this.navmesh.graph.getNodePosition(i), end: this.graph.getNodePosition(i + dim.x)})
                }

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

    public getRandomNodePosition() {
        let angle = Math.PI * 2 * Math.random();
        let spawnPosX = this.player.position.x + Math.cos(angle) * 300;
        let spawnPosY = this.player.position.y + Math.sin(angle) * 300;
        let node = this.navmesh.graph.snap(new Vec2(spawnPosX, spawnPosY));
        return this.navmesh.graph.getNodePosition(node);
    }

    public startWave(waveNum) {
        this.totSpawned = 0;
        if (waveNum == 0) {
            console.log("Wave 1 starting");
            this.curWave = 1;
            //Play tween wave overlay
            this.leftInCurWave = 5;
            this.curDelay = 1000;

            this.spawnDelayTimer.start(this.curDelay)
        }
        else if (waveNum == 1) {
            console.log("Wave 2 starting");
            this.curWave = 2;
            //Play tween wave overlay
            this.leftInCurWave = 10;
            this.curDelay = 700;
            this.spawnDelayTimer.start(this.curDelay);
        }
        else if (waveNum == 2) {
            console.log("Wave 3 starting");
            this.curWave = 3;
            //Play tween wave overlay
            this.leftInCurWave = 30;
            this.curDelay = 300;
            this.spawnDelayTimer.start(this.curDelay);
        }
        //Boss wave
        else if (waveNum == 3) {
            console.log("Final wave starting");
            this.curWave = 4;
            //Play tween wave overlay
            this.leftInCurWave = 1000;
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
        npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(6, 6)), null, false);
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

    //Really just for debug
    public battlerAmt(): number {
        let tot = 0;
        this.battlers.forEach((battler) => {
            if (battler instanceof NPCActor) {
                tot += 1;
            }
        });
        return tot;
    }

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
                if (walls.isTileCollidable(col, row)) {
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