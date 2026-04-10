import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Input from "../../Wolfie2D/Input/Input";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import IsometricTilemap from "../../Wolfie2D/Nodes/Tilemaps/IsometricTilemap";
import PlayerActor from "../Actors/PlayerActor";
import PlayerController from "../AI/Player/PlayerController";
import Battler from "../GameSystems/BattleSystem/Battler";
import Healthpack from "../GameSystems/ItemSystem/Items/Healthpack";
import LaserGun from "../GameSystems/ItemSystem/Items/LaserGun";
import { AAControls } from "../AAControls";
import SMScene from "./SMScene";

const Zones = {
    WALL_MAP:   "zone_map",
    BED:        "zone_bed",
    BOOK_TABLE: "zone_book",
} as const;

const IMG_SCALE = 0.15;

// floor bounds 
const FLOOR_POLYGON: Vec2[] = [
    new Vec2(390, 520), new Vec2(540, 520),
    new Vec2(540, 530), new Vec2(570, 530),
    new Vec2(570, 540), new Vec2(600, 540),
    new Vec2(600, 550), new Vec2(685, 550),
    new Vec2(685, 570), new Vec2(725, 570),
    new Vec2(725, 750), new Vec2(300, 750),
    new Vec2(300, 600), new Vec2(350, 600), 
    new Vec2(350, 570), new Vec2(375, 570), 
    new Vec2(375, 550), new Vec2(390, 550),
];

interface Zone {
    name:   string;
    event:  string;
    bounds: { x: [number, number]; y: [number, number] };
}

export default class MainMenu extends SMScene {

    private player: PlayerActor;
    // private coordLabel: Label; // DEBUG: x/y position shown for zone bounds
    private zoneLabel: Label;
    private zones: Zone[];
    private activeZone: Zone | null = null;
    private lastValidPos: Vec2 = new Vec2(500, 600);

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public loadScene(): void {
        this.load.spritesheet("player1", "game_assets/spritesheets/wooper.json");
        this.load.image("mainmenu", "game_assets/ui/menu/mainmenu.png");
    }

    public startScene(): void {
        const center = this.viewport.getCenter();

        this.addLayer("bg", 0);
        this.addLayer("player", 1);
        this.addLayer("debug", 2);
        this.addUILayer("ui");

        // Black background
        const black = this.add.graphic(GraphicType.RECT, "bg", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        black.color = Color.BLACK;

        // Hut background image
        const bg = this.add.sprite("mainmenu", "bg");
        bg.position.set(center.x, center.y);
        bg.scale.set(IMG_SCALE, IMG_SCALE);

        // DEBUG — floor polygon vertices
        // for (const v of FLOOR_POLYGON) {
        //     const dot = this.add.graphic(GraphicType.RECT, "debug", {
        //         position: v.clone(),
        //         size: new Vec2(6, 6)
        //     });
        //     dot.color = Color.RED;
        // }

        // Interaction zones
        this.zones = [
            { name: "Wall Map",   event: Zones.WALL_MAP,   bounds: { x: [530, 700],       y: [-Infinity, 580] } },
            { name: "Book Table", event: Zones.BOOK_TABLE, bounds: { x: [-Infinity, 325], y: [625, 725]       } },
            { name: "Bed",        event: Zones.BED,        bounds: { x: [675, Infinity],  y: [650, 750]       } },
        ];

        // Player
        this.player = this.add.animatedSprite(PlayerActor, "player1", "player");
        this.player.position.set(500, 600);
        this.player.scale.set(0.25, 0.25);
        this.player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), Vec2.ZERO, true, false);
        this.player.addAI(PlayerController);
        this.player.animation.play("IDLE");

        this.viewport.setCenter(center.x, center.y);

        // DEBUG: uncomment to show x/y readout for tuning zone bounds
        // this.coordLabel = <Label>this.add.uiElement(UIElementType.LABEL, "ui", {
        //     position: new Vec2(150, 20),
        //     text: "x: 0, y: 0"
        // });
        // this.coordLabel.textColor = Color.YELLOW;
        // this.coordLabel.fontSize = 20;

        // zone interaction label above player
        this.zoneLabel = <Label>this.add.uiElement(UIElementType.LABEL, "ui", {
            position: new Vec2(center.x, center.y + 200),
            text: ""
        });
        this.zoneLabel.textColor = Color.WHITE;
        this.zoneLabel.fontSize = 22;
        this.zoneLabel.visible = false;

        this.receiver.subscribe(Zones.WALL_MAP);
        this.receiver.subscribe(Zones.BED);
        this.receiver.subscribe(Zones.BOOK_TABLE);
    }

    public updateScene(_deltaT: number): void {
        this.constrainPlayerToFloor();
        this.checkZoneProximity();

        // const x = Math.round(this.player.position.x);
        // const y = Math.round(this.player.position.y);
        // this.coordLabel.text = `x: ${x}, y: ${y}`;

        if (this.activeZone) {
            this.zoneLabel.text = `[E] ${this.activeZone.name}`;
            this.zoneLabel.position.set(this.player.position.x, this.player.position.y - 30);
            this.zoneLabel.visible = true;
        } else {
            this.zoneLabel.visible = false;
        }

        if (this.activeZone && Input.isJustPressed(AAControls.INTERACT)) {
            this.emitter.fireEvent(this.activeZone.event);
        }

        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    // box player in
    private constrainPlayerToFloor(): void {
        if (this.isInFloor(this.player.position)) {
            this.lastValidPos = this.player.position.clone();
        } else {
            this.player.position.copy(this.lastValidPos);
        }
    }

    private isInFloor(pos: Vec2): boolean {
        let inside = false;
        const poly = FLOOR_POLYGON;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            const intersect = ((yi > pos.y) !== (yj > pos.y)) &&
                (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private checkZoneProximity(): void {
        this.activeZone = null;
        const p = this.player.position;
        for (const zone of this.zones) {
            const { x, y } = zone.bounds;
            if (p.x > x[0] && p.x < x[1] && p.y > y[0] && p.y < y[1]) {
                this.activeZone = zone;
                break;
            }
        }
    }

    public handleEvent(event: GameEvent): void {
        switch (event.type) {
            case Zones.WALL_MAP:
                console.log("Wall Map — Level Select goes here");
                break;
            case Zones.BOOK_TABLE:
                console.log("Book Table — Help/Controls goes here");
                break;
            case Zones.BED:
                console.log("Bed — Exit goes here");
                break;
        }
    }

    // ---- SMScene stubs ----
    public getBattlers(): Battler[] { return []; }
    public getWalls(): IsometricTilemap { return null as unknown as IsometricTilemap; }
    public getHealthpacks(): Healthpack[] { return []; }
    public getLaserGuns(): LaserGun[] { return []; }
    public isTargetVisible(_pos: Vec2, _target: Vec2): boolean { return true; }
}
