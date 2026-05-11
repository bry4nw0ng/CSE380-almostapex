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
import PlayerActor from "../Actors/PlayerActor";
import Battler from "../GameSystems/BattleSystem/Battler";
import HealthbarHUD from "../GameSystems/HUD/HealthbarHUD";
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
    protected battlers: (Battler & Actor & GameNode)[];
    protected healthbars: Map<Battler & Actor & GameNode, HealthbarHUD>;
    protected shadows: Map<Battler & Actor & GameNode, Sprite>;

    protected player: PlayerActor;

    protected walls: IsometricTilemap;
    protected wallsNC: IsometricTilemap;
    protected bothWalls: IsometricTilemap[];

    protected graph: PositionGraph;
    protected navmesh: Navmesh;
    protected spawnableNodes: number[];

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
        this.battlers = new Array<Battler & Actor & GameNode>();
        this.healthbars = new Map<Battler & Actor & GameNode, HealthbarHUD>();
        this.shadows = new Map<Battler & Actor & GameNode, Sprite>();
        this.spawnableNodes = [];
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
}
