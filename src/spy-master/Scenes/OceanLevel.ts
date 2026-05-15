import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import SMScene from "./SMScene";
import Item from "../GameSystems/ItemSystem/Item";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import PufferBehavior from "../AI/NPC/NPCBehavior/PufferBehavior";
import { CheatEvent } from "../Events";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import CityLevel from "./CityLevel";
import MainMenu from "./MainMenu";

import {
    BossDef,
    EndLevelSpriteDef,
    EnemyDef,
    ItemKey,
    LayerDepthMap,
    SceneCtor,
    WaveDef,
} from "./LevelTypes";
import SharkBehavior from "../AI/NPC/NPCBehavior/SharkBehavior";
import PlayerActor from "../Actors/PlayerActor";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import CrabBehavior from "../AI/NPC/NPCBehavior/CrabBehavior";


export default class OceanLevel extends SMScene {

    private readonly MERCHANT_LOCATION = new Vec2(50, 500);
    private readonly END_LEVEL_LOCATION = new Vec2(900, 1400);

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public override loadScene(): void {
        this.loadSharedAssets();
        this.load.spritesheet("puffer", "game_assets/spritesheets/puffer.json");
        this.load.spritesheet("crab", "game_assets/spritesheets/crab.json");
        this.load.image("spike", "game_assets/sprites/puffer-spike.png");
        this.load.image("small_bubble", "game_assets/sprites/bubble-small.png");
        this.load.image("large_bubble", "game_assets/sprites/bubble-large.png");
        this.load.spritesheet("shark", "game_assets/spritesheets/shark.json");

        this.load.image("ChestSprite", "game_assets/sprites/chest.png");
        this.load.object("chest", "game_assets/data/enemies/chest.json");

        // Ocean end-level sprite (coral pipe -> main menu)
        this.load.spritesheet("coral-pipe", "game_assets/spritesheets/coral-pipe.json");
    }

    
    protected override initLevelContent(player: PlayerActor): void {
        this.initializeNPCs();

        this.sharkfin = this.add.animatedSprite(AnimatedSprite, "Underwater_Sharkfin", "primary");
        this.sharkfin.scale.set(0.75,0.75);
        this.sharkfin.visible = false;
    }

    public getLevelKey(): string { return "ocean"; }

    public getTilemapKey(): string { return "ocean"; }

    public getTilemapPath(): string { return "game_assets/tilemaps/ocean.tmj"; }

    protected curBossDrop(): number | null {
        return 100;
    }

    public getSpawnPosition(): Vec2 {
        if (!this.walls) return Vec2.ZERO;
        const dim = this.walls.getDimensions();
        return this.walls.getWorldPosition(Math.floor(dim.x / 2), Math.floor(dim.y / 2));
    }

    public getLayerDepthMap(): LayerDepthMap {
        return { floor: 0, props: 1, wall: 3, wallNC: 5, transparent: 6 };
    }

    public getMusicKey(): string { return "OCEAN_MUSIC"; }
    public getMusicPath(): string { return "game_assets/sounds/songs/water.mp3"; }

    protected initializeNPCs(): void {
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

        let chest = this.load.getObject("chest");

        for (let i = 0; i < chest.chests.length; i++) {
            let treasure = this.add.sprite("ChestSprite", "shadow");
            treasure.position.set(chest.chests[i][0], chest.chests[i][1]);
            treasure.scale.set(1.5, 1.5);

            this.treasure.push({sprite: treasure, stillCookin: true});

        }
    }

    public override getMerchantPosition(): Vec2 { return this.MERCHANT_LOCATION; }

    protected override setBuyItems(): void {
        const oceanItemChoices = [7, 8, 9, 10];
        for (let i = 0; i < 3; i++) {
            const choice = oceanItemChoices[Math.floor(Math.random() * oceanItemChoices.length)];
            this.dropOrChooseItem(new Vec2(0, 0), i, choice);
        }
    }

    public getEnemyTypes(): EnemyDef[] { return [
        {
            key: "puffer",
            spritesheetKey: "puffer",
            spritesheetPath: "game_assets/spritesheets/puffer.json",
            health: 30,
            maxHealth: 30,
            speed: 50,
            scale: new Vec2(0.5, 0.5),
            battleGroup: 1,
            hitbox: new AABB(Vec2.ZERO, new Vec2(8, 8)),
            shadow: { offset: new Vec2(-10, 17), scale: new Vec2(1, 0.75), alpha: 0.5 },
            ai: { ctor: PufferBehavior, opts: { range: 75 } },
            crystalDrops: 3,
            shotSprites: ["spike"],
        },
        {
            key: "crab",
            spritesheetKey: "crab",
            spritesheetPath: "game_assets/spritesheets/crab.json",
            health: 15,
            maxHealth: 15,
            speed: 40,
            scale: new Vec2(0.5, 0.5),
            battleGroup: 1,
            hitbox: new AABB(Vec2.ZERO, new Vec2(8, 8)),
            shadow: { offset: new Vec2(-3, 6), scale: new Vec2(0.5, 0.5), alpha: 0.8 },
            ai: { ctor: CrabBehavior, opts: { range: 75 } },
            crystalDrops: 2,
        }
    ]; }
    public getBoss(): BossDef | null { 
        return {
            key: "shark",
            spritesheetKey: "shark",
            spritesheetPath: "game_assets/spritesheets/shark.json",
            health: 60,
            maxHealth: 60,
            speed: 100,
            scale: new Vec2(1, 1),
            battleGroup: 1,
            hitbox: new AABB(Vec2.ZERO, new Vec2(20, 20)),
            shadow: { offset: new Vec2(0, 0), scale: new Vec2(1, 1), alpha: 0 },
            ai: { ctor: SharkBehavior, opts: { range: 750 } },
            crystalDrops: 20,
            shotSprites: ["large_bubble", "small_bubble"],
            spawnTrigger: "after_final_wave",
            spawnPosition: new Vec2(this.player.position.x + 200, this.player.position.y),
            deathDropItem: "Sharkfin",
        };
    }

    public getWaveConfig(): WaveDef[] { return [
        {
            count: 5,
            types: [{ key: "crab", count: 5 }],
            delayMs: 1000,
            alertKey: "WAVE_1",
            crestKey: "WAVE_1",
            startSfx: "WAVE_START",
        },
        {
            count: 10,
            types: [{ key: "crab", count: 8 }, { key: "puffer", count: 2 }],
            delayMs: 1000,
            alertKey: "WAVE_2",
            crestKey: "WAVE_2",
            startSfx: "WAVE_START",
        },
        {
            count: 15,
            types: [{ key: "crab", count: 10 }, { key: "puffer", count: 5 }],
            delayMs: 750,
            alertKey: "WAVE_3",
            crestKey: "WAVE_3",
            startSfx: "WAVE_START",
        },
        {
            count: 1000,
            types: [{ key: "crab", count: 1000 }],
            delayMs: 3000,
            alertKey: "BOSS",
            crestKey: "WAVE_4",
            startSfx: "BOSS_SPAWNED",
        }
    ]; }

    public getShopInventory(): Item[] { return []; }
    public getDropItemPool(): ItemKey[] { return []; }

    public getEndLevelLocation(): Vec2 { return this.END_LEVEL_LOCATION; }
    public getEndLevelLabel(): string { return "[E] Return to Main Menu"; }
    public getEndLevelSprite(): EndLevelSpriteDef {
        return {
            spritesheetKey: "coral-pipe",
            idleClosed: "IDLE_CLOSE",
            opening: "OPEN",
            idleOpen: "IDLE_OPEN",
            closing: "CLOSE",
        };
    }

    public getNextLevel(): SceneCtor | null { return MainMenu; }

    protected override handleLevelEvent(event: GameEvent): boolean {
        switch(event.type) {
            case CheatEvent.CHEAT_CITY: {
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
                this.sceneManager.changeToScene(CityLevel);
                return true;
            }
            case CheatEvent.CHEAT_OCEAN: {
                return true;
            }
        }
        return false;
    }

    protected override handleUsedRaccoonTail(): void {
        let opened = false;
        this.treasure.forEach(cache => {
            if (cache.stillCookin && cache.sprite.position.distanceTo(this.player.position) < 100) {
                this.dropOrChooseItem(cache.sprite.position, 999, null);
                this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "TREASURE", loop: false, holdReference: false });
                cache.sprite.destroy();
                cache.stillCookin = false;
                opened = true;
            }
        });
        this.treasure = this.treasure.filter(c => c.stillCookin);

        if (!opened) {
            this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: "UNPICKUPPABLE", loop: false, holdReference: false });
        }
    }
}



