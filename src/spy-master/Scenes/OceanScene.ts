import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import IsometricTilemap from "../../Wolfie2D/Nodes/Tilemaps/IsometricTilemap";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Input from "../../Wolfie2D/Input/Input";
import PlayerActor from "../Actors/PlayerActor";
import PlayerController from "../AI/Player/PlayerController";
import Battler from "../GameSystems/BattleSystem/Battler";
import SMScene from "./SMScene";
import MainMenu from "./MainMenu";

export default class OceanScene extends SMScene {

    private player: PlayerActor;
    private playerShadow: Sprite;
    private walls: IsometricTilemap;

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public loadScene(): void {
        this.load.tilemap("ocean", "game_assets/tilemaps/ocean.tmj");
        this.load.spritesheet("player1", "game_assets/spritesheets/blob-fullsheet-manual.json");
        this.load.image("generic-shadow", "game_assets/sprites/shadow.png");
    }

    public startScene(): void {
        this.addLayer("primary", 3);
        this.addLayer("shadow", 2);

        // Ocean tmj layer order: [0]=Floor, [1]=Props, [2]=Wall, [3]=Wall-NonCollidable, [4]=Transparent
        const tilemapLayers = this.add.tilemap("ocean");
        tilemapLayers[0].setDepth(0); // Floor
        tilemapLayers[1].setDepth(1); // Props
        tilemapLayers[2].setDepth(3); // Wall
        tilemapLayers[3].setDepth(5); // Wall-NonCollidable
        tilemapLayers[4].setDepth(6); // Transparent (above player)

        this.walls = <IsometricTilemap>tilemapLayers[2].getItems()[0];

        const dim = this.walls.getDimensions();
        const midCol = Math.floor(dim.x / 2);
        const midRow = Math.floor(dim.y / 2);
        const centerMap = this.walls.getWorldPosition(midCol, midRow);

        this.viewport.setBounds(
            -this.walls.size.x,
            -this.walls.size.y,
            this.walls.size.x * 2,
            this.walls.size.y * 2
        );
        this.viewport.setZoomLevel(2);

        this.player = this.add.animatedSprite(PlayerActor, "player1", "primary");
        this.player.position.copy(centerMap);
        this.player.scale.set(1, 1);
        this.player.health = 10;
        this.player.maxHealth = 10;
        this.player.battleGroup = 2;
        this.player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), Vec2.ZERO, true, false);
        this.player.addAI(PlayerController);
        this.player.animation.play("IDLE");

        this.playerShadow = this.add.sprite("generic-shadow", "shadow");
        this.playerShadow.position.set(centerMap.x + 8, centerMap.y + 6);
        this.playerShadow.scale.set(1.15, 1);
        this.playerShadow.alpha = 0.8;

        this.viewport.follow(this.player);
        this.viewport.setCenter(centerMap.x, centerMap.y);
    }

    public updateScene(_deltaT: number): void {
        // shadow tracks player
        this.playerShadow.position.set(this.player.position.x + 8, this.player.position.y + 6);

        // escape back to main menu for testing convenience
        if (Input.isKeyJustPressed("escape")) {
            this.sceneManager.changeToScene(MainMenu);
        }
    }

    // ---- SMScene stubs ----
    public getBattlers(): Battler[] { return [this.player as unknown as Battler]; }
    public getWalls(): IsometricTilemap { return this.walls; }
    public isTargetVisible(_pos: Vec2, _target: Vec2): boolean { return true; }
    public getNavmesh(): Navmesh { return null as unknown as Navmesh; }
}
