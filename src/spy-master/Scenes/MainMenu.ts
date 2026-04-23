import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Input from "../../Wolfie2D/Input/Input";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
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
import MainSMScene from "./MainSMScene";
import NPCActor from "../Actors/NPCActor";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";

const Zones = {
    WALL_MAP:   "zone_map",
    BED:        "zone_bed",
    BOOK_TABLE: "zone_book",
} as const;

//const IMG_SCALE = 0.15;
const IMG_SCALE = 5;

// floor bounds 
const FLOOR_POLYGON: Vec2[] = [
    new Vec2(390, 500), new Vec2(540, 500),
    new Vec2(540, 510), new Vec2(570, 510),
    new Vec2(570, 520), new Vec2(600, 520),
    new Vec2(600, 530), new Vec2(685, 530),
    new Vec2(685, 580), new Vec2(725, 580),
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

    private popupOpen: boolean = false;
    private popupDim: Graphic;
    private popupMap: Sprite;
    private popupClose: Sprite;

    private helpOpen: boolean = false;
    private helpPage: number = 0;       // 0 = about, 1 = help, 2 = controls
    private helpDim: Graphic;
    private helpPages: Sprite[] = [];   // [about-page, help-page, controls-page]
    private helpClose: Sprite;
    private helpNext: Sprite;
    private helpPrev: Sprite;

    private readonly CLOSE_POS = new Vec2(55, 55); // top-left of popup
    private readonly CLOSE_HIT = 25;               // click radius in px

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public loadScene(): void {
        this.load.spritesheet("player1", "game_assets/spritesheets/blob-fullsheet-manual.json");
        this.load.spritesheet("home-animated", "game_assets/spritesheets/home-animated.json");
        this.load.image("mainmenu",      "game_assets/ui/menu/mainmenu.png");
        this.load.image("map",           "game_assets/ui/menu/map.png");
        // TODO: replace temp images with final versions
        // this.load.image("about-page",    "game_assets/ui/menu/about-page.png");
        // this.load.image("help-page",     "game_assets/ui/menu/help-page.png");
        // this.load.image("controls-page", "game_assets/ui/menu/controls-page.png");
        this.load.image("about-page",    "game_assets/ui/menu/temp/tempabout.png");
        this.load.image("help-page",     "game_assets/ui/menu/temp/temphelp.png");
        this.load.image("controls-page", "game_assets/ui/menu/temp/tempcontrols.png");
    }

    public startScene(): void {
        
        this.viewport.setZoomLevel(1);
        this.viewport.setCenter(512, 512);
        const center = this.viewport.getCenter();

        this.addLayer("bg", 0);
        this.addLayer("home", 1);
        this.addLayer("player", 2);
        this.addLayer("debug", 3);
        this.addUILayer("popup");
        this.addUILayer("popupOverlay");
        this.addUILayer("ui");

        // Black background
        const black = this.add.graphic(GraphicType.RECT, "bg", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        black.color = Color.BLACK;

        // Hut background image
/*         const bg = this.add.sprite("mainmenu", "bg");
        bg.position.set(center.x, center.y);
        bg.scale.set(IMG_SCALE, IMG_SCALE); */

        const bg = this.add.animatedSprite(AnimatedSprite, "home-animated", "home");
        bg.position.set(center.x, center.y);
        bg.scale.set(IMG_SCALE, IMG_SCALE);
        bg.animation.play("Idle");

        // DEBUG — floor polygon vertices
        for (const v of FLOOR_POLYGON) {
            const dot = this.add.graphic(GraphicType.RECT, "debug", {
                position: v.clone(),
                size: new Vec2(6, 6)
            });
            dot.color = Color.RED;
        }

        // Interaction zones
        this.zones = [
            { name: "Wall Map",   event: Zones.WALL_MAP,   bounds: { x: [530, 700],       y: [-Infinity, 580] } },
            { name: "Book Table", event: Zones.BOOK_TABLE, bounds: { x: [-Infinity, 325], y: [625, 725]       } },
            { name: "Bed",        event: Zones.BED,        bounds: { x: [675, Infinity],  y: [650, 750]       } },
        ];

        // Player
        this.player = this.add.animatedSprite(PlayerActor, "player1", "player");
        this.player.position.set(500, 600);
        this.player.scale.set(2, 2);
        this.player.health = 1;
        this.player.maxHealth = 1;
        this.player.addPhysics(new AABB(Vec2.ZERO, new Vec2(8, 8)), Vec2.ZERO, true, false);
        this.player.addAI(PlayerController);
        this.player.animation.play("IDLE", true);

        this.viewport.setCenter(center.x, center.y);
        this.viewport.setZoomLevel(2);
        this.viewport.follow(this.player);

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

        // map popup 
        this.popupDim = this.add.graphic(GraphicType.RECT, "popup", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        this.popupDim.color = new Color(0, 0, 0, 0.7);
        this.popupDim.visible = false;

        this.popupMap = this.add.sprite("map", "popupOverlay");
        this.popupMap.position.set(center.x, center.y);
        this.popupMap.visible = false;

        // TODO: replace with a proper close button sprite
        this.popupClose = this.add.sprite("map", "popupOverlay");
        this.popupClose.position.set(this.CLOSE_POS.x + 50, this.CLOSE_POS.y + 50);
        this.popupClose.scale.set(0.1, 0.1); // tune scale to match final sprite size
        this.popupClose.visible = false;

        // help/controls popup 
        this.helpDim = this.add.graphic(GraphicType.RECT, "popup", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        this.helpDim.color = new Color(0, 0, 0, 0.7);
        this.helpDim.visible = false;

        this.helpPages = [
            this.add.sprite("about-page",    "popupOverlay"),
            this.add.sprite("help-page",     "popupOverlay"),
            this.add.sprite("controls-page", "popupOverlay"),
        ];
        for (const page of this.helpPages) {
            page.position.set(center.x, center.y);
            page.visible = false;
        }

        // TODO: replace with proper close/nav button sprites
        this.helpClose = this.add.sprite("map", "popupOverlay");
        this.helpClose.position.set(this.CLOSE_POS.x + 50, this.CLOSE_POS.y + 50);
        this.helpClose.scale.set(0.1, 0.1);
        this.helpClose.visible = false;

        this.helpNext = this.add.sprite("map", "popupOverlay");
        this.helpNext.position.set(center.x + 430, center.y); // right side — tune with final sprite
        this.helpNext.scale.set(0.05, 0.05);
        this.helpNext.visible = false;

        this.helpPrev = this.add.sprite("map", "popupOverlay");
        this.helpPrev.position.set(center.x - 430, center.y); // left side — tune with final sprite
        this.helpPrev.scale.set(0.05, 0.05);
        this.helpPrev.visible = false;

        this.receiver.subscribe(Zones.WALL_MAP);
        this.receiver.subscribe(Zones.BED);
        this.receiver.subscribe(Zones.BOOK_TABLE);
    }

    public updateScene(_deltaT: number): void {
        if (this.popupOpen) {
            this.viewport.setZoomLevel(1);
            if (Input.isKeyJustPressed("escape")) {
                this.closePopup();
                return;
            }
            if (Input.isKeyJustPressed("1")) {
                this.sceneManager.changeToScene(MainSMScene);
                return;
            }
            if (Input.isMouseJustPressed()) {
                const mouse = Input.getMousePressPosition();
                const btn = this.popupClose.position;
                if (Math.abs(mouse.x - btn.x) <= this.CLOSE_HIT &&
                    Math.abs(mouse.y - btn.y) <= this.CLOSE_HIT) {
                    this.closePopup();
                }
            }
            return;
        }

        if (this.helpOpen) {
            if (Input.isKeyJustPressed("escape")) {
                this.closeHelp();
                return;
            }
            if (Input.isMouseJustPressed()) {
                const mouse = Input.getMousePressPosition();

                const close = this.helpClose.position;
                if (Math.abs(mouse.x - close.x) <= this.CLOSE_HIT &&
                    Math.abs(mouse.y - close.y) <= this.CLOSE_HIT) {
                    this.closeHelp();
                    return;
                }

                const next = this.helpNext.position;
                if (this.helpNext.visible &&
                    Math.abs(mouse.x - next.x) <= this.CLOSE_HIT &&
                    Math.abs(mouse.y - next.y) <= this.CLOSE_HIT) {
                    this.setHelpPage(this.helpPage + 1);
                    return;
                }

                const prev = this.helpPrev.position;
                if (this.helpPrev.visible &&
                    Math.abs(mouse.x - prev.x) <= this.CLOSE_HIT &&
                    Math.abs(mouse.y - prev.y) <= this.CLOSE_HIT) {
                    this.setHelpPage(this.helpPage - 1);
                    return;
                }
            }
            return;
        }

        this.constrainPlayerToFloor();
        this.checkZoneProximity();

        // const x = Math.round(this.player.position.x);
        // const y = Math.round(this.player.position.y);
        // this.coordLabel.text = `x: ${x}, y: ${y}`;

        if (this.activeZone) {
            this.zoneLabel.text = `[E] ${this.activeZone.name}`;
            let half = this.viewport.getHalfSize();
            this.zoneLabel.position.set(half.x, half.y - 30);
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

    private closePopup(): void {
        this.popupOpen = false;
        this.popupDim.visible = false;
        this.popupMap.visible = false;
        this.popupClose.visible = false;
        this.zoneLabel.visible = false;
        this.viewport.setZoomLevel(2);
    }

    private openHelp(): void {
        this.helpOpen = true;
        this.helpDim.visible = true;
        this.helpClose.visible = true;
        this.zoneLabel.visible = false;
        this.viewport.setZoomLevel(1);
        this.setHelpPage(0);
    }

    private closeHelp(): void {
        this.helpOpen = false;
        this.helpDim.visible = false;
        this.helpClose.visible = false;
        this.helpNext.visible = false;
        this.helpPrev.visible = false;
        this.viewport.setZoomLevel(2);
        for (const page of this.helpPages) page.visible = false;
    }

    private setHelpPage(page: number): void {
        this.helpPage = page;
        for (let i = 0; i < this.helpPages.length; i++) {
            this.helpPages[i].visible = i === page;
        }
        this.helpNext.visible = page < this.helpPages.length - 1;
        this.helpPrev.visible = page > 0;
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
                this.popupOpen = true;
                this.popupDim.visible = true;
                this.popupMap.visible = true;
                this.popupClose.visible = true;
                this.zoneLabel.visible = false;
                break;
            case Zones.BOOK_TABLE: this.openHelp(); break;
            case Zones.BED:        break; // TODO: exit game
        }
    }

    // ---- SMScene stubs ----
    public getBattlers(): Battler[] { return []; }
    public getWalls(): IsometricTilemap { return null as unknown as IsometricTilemap; }
    public getHealthpacks(): Healthpack[] { return []; }
    public getLaserGuns(): LaserGun[] { return []; }
    public isTargetVisible(_pos: Vec2, _target: Vec2): boolean { return true; }
    public getNavmesh(): Navmesh { return null as unknown as Navmesh;}

}
