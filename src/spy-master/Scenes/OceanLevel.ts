import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import SMScene from "./SMScene";
import Item from "../GameSystems/ItemSystem/Item";
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

    public getEnemyTypes(): EnemyDef[] { return []; }
    public getBoss(): BossDef | null { return null; }
    public getWaveConfig(): WaveDef[] { return []; }

    public getShopInventory(): Item[] { return []; }
    public getDropItemPool(): ItemKey[] { return []; }

    public getEndLevelLocation(): Vec2 { return Vec2.ZERO; }
    public getEndLevelLabel(): string { return ""; }
    public getEndLevelSprite(): EndLevelSpriteDef {
        return { spritesheetKey: "", idleClosed: "", opening: "", idleOpen: "", closing: "" };
    }

    public getNextLevel(): SceneCtor | null { return null; }
}
