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
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";

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
    private helpPage: number = 0;
    private helpDim: Graphic;
    private helpPages: Sprite[] = [];   // [about1, about2, about3, help, controls, cheats]
    private helpClose: Sprite;
    private helpNext: Sprite;
    private helpPrev: Sprite;

    private playerShadow: Sprite;

    private fadeOverlay: Rect;
    
    private readonly CLOSE_POS = new Vec2(55, 55); // top-left of popup
    private readonly CLOSE_HIT = 40;               // click radius in px

    private readonly CITY_POS = new Vec2(285, 695);

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
    }

    public loadScene(): void {
        this.load.spritesheet("player1", "game_assets/spritesheets/blob-fullsheet-manual.json");
        this.load.spritesheet("home-animated", "game_assets/spritesheets/home-animated.json");
        this.load.image("mainmenu",      "game_assets/ui/menu/mainmenu.png");
        this.load.image("map",           "game_assets/ui/menu/map.png");

        this.load.image("about1",    "game_assets/ui/book/about1.png");
        this.load.image("about2",    "game_assets/ui/book/about2.png");
        this.load.image("about3",    "game_assets/ui/book/about3.png");
        this.load.image("help",     "game_assets/ui/book/help.png");
        this.load.image("controls", "game_assets/ui/book/controls.png");
        this.load.image("cheats", "game_assets/ui/book/cheats.png");

        this.load.image("back-button", "game_assets/ui/menu/back-button.png");

        this.load.image("generic-shadow", "game_assets/sprites/shadow.png");

        this.load.audio("MENU", "game_assets/sounds/songs/home-cleaned.mp3");
    }

    public startScene(): void {
        
        this.viewport.setZoomLevel(1);
        this.viewport.setCenter(512, 512);

        const center = this.viewport.getCenter();

        this.addLayer("bg", 0);
        this.addLayer("home", 1);
        this.addLayer("shadow", 2);
        this.addLayer("player", 3);
        this.addLayer("debug", 4);
        this.addLayer("fade", 10);
        this.addUILayer("popup");
        this.addUILayer("popupOverlay");
        this.addUILayer("ui");


        // Black background
        const black = this.add.graphic(GraphicType.RECT, "bg", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        black.color = Color.BLACK;

        this.fadeOverlay = <Rect>this.add.graphic(GraphicType.RECT, "fade", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(this.viewport.getHalfSize().x * 2, this.viewport.getHalfSize().y * 2)
        });
        this.fadeOverlay.color = Color.BLACK;
        this.fadeOverlay.alpha = 1;

        this.fadeOverlay.tweens.add("fadeIn", {
            startDelay: 0,
            duration: 800,
            effects: [{
                property: TweenableProperties.alpha,
                start: 1,
                end: 0,
                ease: EaseFunctionType.IN_OUT_SINE
            }],
            onEnd: "fade-done"
        });
        // Hut background image
/*         const bg = this.add.sprite("mainmenu", "bg");
        bg.position.set(center.x, center.y);
        bg.scale.set(IMG_SCALE, IMG_SCALE); */

        const bg = this.add.animatedSprite(AnimatedSprite, "home-animated", "home");
        bg.position.set(center.x, center.y);
        bg.scale.set(IMG_SCALE, IMG_SCALE);
        bg.animation.play("Idle");

        // DEBUG — floor polygon vertices
/*         for (const v of FLOOR_POLYGON) {
            const dot = this.add.graphic(GraphicType.RECT, "debug", {
                position: v.clone(),
                size: new Vec2(6, 6)
            });
            dot.color = Color.RED;
        } */

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

        this.playerShadow = this.add.sprite("generic-shadow", "shadow");
        this.playerShadow.position.set(496, 513);
        this.playerShadow.scale.set(2.5, 2);
        this.playerShadow.alpha = 0.6;
        this.playerShadow.visible = true;

        this.viewport.setCenter(center.x, center.y);
        this.viewport.setZoomLevel(2);
        this.viewport.follow(this.player);

        // DEBUG: uncomment to show x/y readout for tuning zone bounds
        // this.coordLabel = <Label>this.add.uiElement(UIElementType.LABEL, "ui", {
        //     position: new Vec2(150, 20),
        //     text: "x: 0, y: 0"
        // });
        // this.coordLabel.textColor = Color.YELLOW;
        // this.coordLabel.fontSize =20;

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
        this.popupClose = this.add.sprite("back-button", "popupOverlay");
        this.popupClose.position.set(this.CLOSE_POS.x + 50, this.CLOSE_POS.y + 50);
        this.popupClose.scale.set(8, 8); // tune scale to match final sprite size
        this.popupClose.visible = false;

        // help/controls popup 
        this.helpDim = this.add.graphic(GraphicType.RECT, "popup", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        this.helpDim.color = new Color(0, 0, 0, 0.7);
        this.helpDim.visible = false;

        this.helpPages = [
/*             this.add.sprite("about-page",    "popupOverlay"),
            this.add.sprite("help-page",     "popupOverlay"),
            this.add.sprite("controls-page", "popupOverlay"), */
            this.add.sprite("about1", "popupOverlay"),
            this.add.sprite("about2", "popupOverlay"),
            this.add.sprite("about3", "popupOverlay"),
            this.add.sprite("help", "popupOverlay"),
            this.add.sprite("controls", "popupOverlay"),
            this.add.sprite("cheats", "popupOverlay")
        ];
        for (const page of this.helpPages) {
            page.position.set(center.x, center.y);
            page.scale.set(4, 4);
            page.visible = false;
        }

        this.helpClose = this.add.sprite("back-button", "popupOverlay");
        this.helpClose.position.set(this.CLOSE_POS.x + 50, this.CLOSE_POS.y + 50);
        this.helpClose.scale.set(8, 8);
        this.helpClose.visible = false;

        this.helpNext = this.add.sprite("back-button", "popupOverlay");
        this.helpNext.invertX = true;
        this.helpNext.position.set(center.x + 430, center.y); // right side — tune with final sprite
        this.helpNext.scale.set(4, 4);
        this.helpNext.visible = false;

        this.helpPrev = this.add.sprite("back-button", "popupOverlay");
        this.helpPrev.position.set(center.x - 430, center.y); // left side — tune with final sprite
        this.helpPrev.scale.set(4, 4);
        this.helpPrev.visible = false;

        this.receiver.subscribe(Zones.WALL_MAP);
        this.receiver.subscribe(Zones.BED);
        this.receiver.subscribe(Zones.BOOK_TABLE);
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, {key: "MENU", loop: true, holdReference: true});
        
        this.fadeOverlay.tweens.play("fadeIn");
    }

    public updateScene(_deltaT: number): void {
        if (this.popupOpen) {
            this.viewport.setZoomLevel(1);
            if (Input.isKeyJustPressed("escape")) {
                this.closePopup();
                return;
            }
            if (Input.isMouseJustPressed()) {
                const mouse = Input.getMousePressPosition();

                if (Math.abs(mouse.x - this.popupClose.position.x) <= this.CLOSE_HIT &&
                    Math.abs(mouse.y - this.popupClose.position.y) <= this.CLOSE_HIT) {
                    this.closePopup();
                }
                if (Math.abs(mouse.x - this.CITY_POS.x) <= this.CLOSE_HIT &&
                    Math.abs(mouse.y - this.CITY_POS.y) <= this.CLOSE_HIT) {
                    this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: "MENU", loop: true, holdReference: true});
                    this.sceneManager.changeToScene(MainSMScene);
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

        this.playerShadow.position.set(this.player.position.x + 12, this.player.position.y + 26);
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
