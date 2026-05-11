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


export default class OceanLevel extends SMScene {

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public override loadScene(): void {
        this.loadSharedAssets();
        this.load.spritesheet("puffer", "game_assets/spritesheets/puffer.json");
        this.load.image("spike", "game_assets/sprites/puffer-spike.png");
        // Ocean-specific enemies (crab/pufferfish/shark) to be added later.
        // Ocean tileset image auto-loads from ocean.tmj.
    }

    // startScene + updateScene inherited from SMScene.

    public getLevelKey(): string { return "ocean"; }

    public getTilemapKey(): string { return "ocean"; }

    public getTilemapPath(): string { return "game_assets/tilemaps/ocean.tmj"; }

    /** Spawn at the center of the map until a real walkable tile is picked. */
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
    public getBoss(): BossDef | null { return null; }
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
}



