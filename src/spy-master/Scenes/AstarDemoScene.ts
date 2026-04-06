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

/**
 * This is a dummy scene to test if your implementation of A* is working or not. If your implementation 
 * is working correctly, you should see the blue npc make it's way to the small blue box in the top-right 
 * corner of the screen.
 */
export default class AStarDemoScene extends Scene {

    protected npc: NPCActor;
    protected destination: Vec2;
    protected path: NavigationPath;
    protected walls: IsometricTilemap;

    public loadScene(): void {
        this.load.tilemap("level", "game_assets/tilemaps/city-map-revised.tmj");
        this.load.spritesheet("BlueEnemy", "game_assets/spritesheets/BlueEnemy.json");
    }

    public startScene(): void {
        let tilemapLayers = this.add.tilemap("level");

        //(tilemapLayers[0].getItems()[0] as IsometricTilemap).visible = false;
        //(tilemapLayers[1].getItems()[0] as IsometricTilemap).visible = false;
        //(tilemapLayers[2].getItems()[0] as IsometricTilemap).visible = false;
        //(tilemapLayers[3].getItems()[0] as IsometricTilemap).visible = false;

        tilemapLayers[2].setDepth(2); // Wall-NonCollidable
        tilemapLayers[0].setDepth(0); // Floor  
        tilemapLayers[1].setDepth(1); // Wall
        tilemapLayers[3].setDepth(4); // Transparent, player at 3, so should be above
        tilemapLayers.forEach((layer, i) => {
        let tilemap = layer.getItems()[0] as IsometricTilemap;//DEBUGIMPORTANT
           
        });
        this.walls = <IsometricTilemap>tilemapLayers[1].getItems()[0];

        let midCol = Math.floor(this.walls.getDimensions().x / 2);
        let midRow = Math.floor(this.walls.getDimensions().y / 2);
        let midMap = new Vec2(midCol, midRow);
        let centerMap = this.walls.getWorldPosition(midCol, midRow);

        this.viewport.setZoomLevel(0.5);
        this.viewport.setBounds(
            -this.walls.size.x,
            -this.walls.size.y,
            this.walls.size.x * 2,
            this.walls.size.y * 2
        );

        this.addLayer("primary", 10);

        // Initialize a navmesh covering the tilemap
        let navmesh = this.initializeNavmesh(new PositionGraph(), this.walls);
        this.navManager.addNavigableEntity("navmesh", navmesh);

        // Register the different pathfinding strategies with the navmesh
        navmesh.registerStrategy("direct", new DirectStrategy(navmesh));
        navmesh.registerStrategy("astar", new AstarStrategy(navmesh));
        
        navmesh.setStrategy("astar");

        // Create a dummy NPC
        this.npc = this.add.animatedSprite(NPCActor, "BlueEnemy", "primary");

        //Had to change size to (6,6) as otherwise the npc would clip onto the wall when following path
        this.npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(7, 7)), null, false);

        this.npc.position.copy(this.walls.getWorldPosition(midMap.x, midMap.y)!);
        this.destination = new Vec2(34, 23);

        this.viewport.follow(this.npc);

        // The little blue rectangle in the top-right is where the NPC is trying to get to
        let destination = this.add.graphic(GraphicType.RECT, "primary", {position: this.destination, size: new Vec2(20, 20)})
        destination.color = Color.BLUE;
        destination.color.a = .50;
        // Construct a path using the navmesh from the npc's position to the target destination
        this.path = navmesh.getNavigationPath(this.npc.position, this.destination);
        //this.viewport.setCenter(centerMap!.x, centerMap!.y);
        this.viewport.setCenter(0, 1024);
        this.viewport.setFocus(new Vec2(centerMap!.x, centerMap!.y));
        //for(let i = 0; i < 50; i++){
        //    this.viewport.update(0.016);
        //}
    }

    public updateScene(deltaT: number): void {
        // Move the npc along the path
        this.npc.moveOnPath(1, this.path);
        //this.walls.debugRender();
    }
    
    /**
     * Initializes the navmesh graph used by the NPCs in the SMScene. This method is a little buggy, and
     * and it skips over some of the positions on the tilemap. If you can fix my navmesh generation algorithm,
     * go for it.
     *
     */
    
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