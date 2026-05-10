import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Scene from "../../Wolfie2D/Scene/Scene";
import Battler from "../GameSystems/BattleSystem/Battler";
import IsometricTilemap from "../../Wolfie2D/Nodes/Tilemaps/IsometricTilemap";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
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


export default abstract class SMScene extends Scene {

    public abstract getBattlers(): Battler[];

    public abstract getWalls(): IsometricTilemap;

    public abstract isTargetVisible(position: Vec2, target: Vec2): boolean;

    public abstract getNavmesh(): Navmesh;

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
}
