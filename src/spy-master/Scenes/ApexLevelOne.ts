import PositionGraph from "../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import IsometricTilemap from "../../Wolfie2D/Nodes/Tilemaps/IsometricTilemap";
import NavigationPath from "../../Wolfie2D/Pathfinding/NavigationPath";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import DirectStrategy from "../../Wolfie2D/Pathfinding/Strategies/DirectStrategy";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import NPCActor from "../Actors/NPCActor";
import AstarStrategy from "../Pathfinding/AstarStrategy";

export default class ApexLevelOne extends Scene {

    protected path: NavigationPath;
    protected walls: IsometricTilemap;

        public loadScene(): void {
            this.load.tilemap("level", "game_assets/tilemaps/city-map-revised.tmj");
            this.load.image("tiles", "game_assets/tilemaps/iso-tile-trial.png");

            this.load.spritesheet("player1", "game_assets/spritesheets/wooper.json");
            this.load.spritesheet("BlueEnemy", "game_assets/spritesheets/BlueEnemy.json");         
    }

        public startScene(): void {
        let tilemapLayers = this.add.tilemap("level");
        
        tilemapLayers[2].setDepth(2); // Wall-NonCollidable
        tilemapLayers[0].setDepth(0); // Floor  
        tilemapLayers[1].setDepth(1); // Wall
        tilemapLayers[3].setDepth(4); // Transparent, player at 3, so should be above

        this.walls = <IsometricTilemap>tilemapLayers[1].getItems()[0];
        let midCol = Math.floor(this.walls.getDimensions().x / 2);
        let midRow = Math.floor(this.walls.getDimensions().y / 2);
        let midMap = new Vec2(midCol, midRow);
        let centerMap = this.walls.getWorldPosition(midCol, midRow);
        this.viewport.setCenter(centerMap!.x, centerMap!.y);

        }




    protected initializeNavmesh(graph: PositionGraph, walls: IsometricTilemap): Navmesh {

        let dim: Vec2 = walls.getDimensions();
        for (let i = 0; i < dim.y; i++) {
            for (let j = 0; j < dim.x; j++) {
                let pos: Vec2 = walls.getWorldPosition(j, i);
                graph.addPositionedNode(pos);
            }
        }

        let rc: Vec2;
        for (let i = 0; i < graph.numVertices; i++) {
            rc = walls.getTileColRow(i);
            if (!walls.isTileCollidable(rc.x, rc.y) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x -1, 0, dim.x -1), rc.y) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x +1, 0, dim.x -1), rc.y) &&
                !walls.isTileCollidable(rc.x, MathUtils.clamp(rc.y -1, 0, dim.y -1)) &&
                !walls.isTileCollidable(rc.x, MathUtils.clamp(rc.y +1, 0, dim.y -1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x +1, 0, dim.x -1), MathUtils.clamp(rc.y +1, 0, dim.y -1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x -1, 0, dim.x -1), MathUtils.clamp(rc.y +1, 0, dim.y -1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x +1, 0, dim.x -1), MathUtils.clamp(rc.y -1, 0, dim.y -1)) &&
                !walls.isTileCollidable(MathUtils.clamp(rc.x -1, 0, dim.x -1), MathUtils.clamp(rc.y -1, 0, dim.y -1))

            ) {
                // Create edge to the left
                rc = walls.getTileColRow(i + 1);
                if ((i + 1) % dim.x !== 0 && !walls.isTileCollidable(rc.x, rc.y)) {
                    graph.addEdge(i, i + 1);
                    // this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(i), end: this.graph.getNodePosition(i + 1)})
                }
                // Create edge below
                rc = walls.getTileColRow(i + dim.x);
                if (i + dim.x < graph.numVertices && !walls.isTileCollidable(rc.x, rc.y)) {
                    graph.addEdge(i, i + dim.x);
                    // this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(i), end: this.graph.getNodePosition(i + dim.x)})
                }


            }
        }

        // Set this graph as a navigable entity
        return new Navmesh(graph);

    }
}