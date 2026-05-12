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


export default class OceanLevel extends SMScene {

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public override loadScene(): void {
        this.loadSharedAssets();
        this.load.spritesheet("puffer", "game_assets/spritesheets/puffer.json");
        this.load.image("spike", "game_assets/sprites/puffer-spike.png");
        this.load.image("small_bubble", "game_assets/sprites/bubble-small.png");
        this.load.image("large_bubble", "game_assets/sprites/bubble-large.png");
        this.load.spritesheet("shark", "game_assets/spritesheets/shark.json");

        this.load.image("ChestSprite", "game_assets/sprites/chest.png");
        this.load.object("chest", "game_assets/data/enemies/chest.json");
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
        let chest = this.load.getObject("chest");

        for (let i = 0; i < chest.chests.length; i++) {
            let treasure = this.add.sprite("ChestSprite", "shadow");
            treasure.position.set(chest.chests[i][0], chest.chests[i][1]);
            treasure.scale.set(1.5, 1.5);

            this.treasure.push({sprite: treasure, stillCookin: true});

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
            shadow: { offset: new Vec2(-15, 25), scale: new Vec2(1, 0.75), alpha: 0.5 },
            ai: { ctor: PufferBehavior, opts: { range: 75 } },
            crystalDrops: 3,
            shotSprites: ["spike"],
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
            hitbox: new AABB(Vec2.ZERO, new Vec2(90, 40)),
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
            types: [{ key: "puffer", count: 5 }],
            delayMs: 1000,
            alertKey: "WAVE_1",
            crestKey: "WAVE_1",
            startSfx: "WAVE_START",
        }
    ]; }

    public getShopInventory(): Item[] { return []; }
    public getDropItemPool(): ItemKey[] { return []; }

    public getEndLevelLocation(): Vec2 { return Vec2.ZERO; }
    public getEndLevelLabel(): string { return ""; }
    public getEndLevelSprite(): EndLevelSpriteDef {
        return { spritesheetKey: "", idleClosed: "", opening: "", idleOpen: "", closing: "" };
    }

    public getNextLevel(): SceneCtor | null { return null; }

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



