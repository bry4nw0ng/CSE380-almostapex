import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Input from "../../Wolfie2D/Input/Input";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import PlayerActor from "../Actors/PlayerActor";
import PlayerController from "../AI/Player/PlayerController";
import { AAControls } from "../AAControls";
import Scene from "../../Wolfie2D/Scene/Scene";
import CityLevel from "./CityLevel";
import OceanLevel from "./OceanLevel";
import NightmareLevel from "./NightmareLevel";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import EndArrow from "../GameSystems/HUD/NextLevelArrow";
import SMScene from "./SMScene";
import { ItemKey } from "./LevelTypes";
import DaNeedle from "../GameSystems/ItemSystem/Items/DaNeedle";

interface ItemVisual {
    asset: string;
    path: string;
    offset: Vec2;
    scale?: Vec2;
    rotation?: number;
}

// Mirrors the equippableOffset / scale / rotation set in each Item subclass.
// Used to render the player's carried items on the main menu after they
// return via the ocean coral pipe.
const ITEM_VISUALS: Partial<Record<ItemKey, ItemVisual>> = {
    Shield:       { asset: "Shield",       path: "game_assets/sprites/cardboard-shield.png",   offset: new Vec2(12, 7) },
    RedHat:       { asset: "RedHat",       path: "game_assets/sprites/red-hat.png",            offset: new Vec2(6, 0) },
    JetPack:      { asset: "JetPack",      path: "game_assets/sprites/cokepack.png",           offset: new Vec2(-12, 6) },
    Gum:          { asset: "Gum",          path: "game_assets/sprites/used-gum.png",           offset: new Vec2(3, 4) },
    DaNeedle:     { asset: "DaNeedle",     path: "game_assets/sprites/da-needle.png",          offset: new Vec2(20, 10), scale: new Vec2(2, 2), rotation: -1 * Math.PI / 1.8},
    Antennas:     { asset: "Antennas",     path: "game_assets/sprites/cockroach-antennas.png", offset: new Vec2(5, -6) },
    RaccoonTail:  { asset: "RaccoonTail",  path: "game_assets/sprites/raccoon-tail.png",       offset: new Vec2(-28, 5) },
    Coral:        { asset: "Coral",        path: "game_assets/sprites/horn-coral.png",         offset: new Vec2(-15, 4), scale: new Vec2(0.75, 0.75) },
    SlimeStorage: { asset: "SlimeStorage", path: "game_assets/sprites/slime-storage.png",      offset: new Vec2(-7, 7),  scale: new Vec2(0.75, 0.75) },
    ShellSpecs:   { asset: "ShellSpecs",   path: "game_assets/sprites/shell-specs.png",        offset: new Vec2(8, 2) },
    Sharkfin:     { asset: "Sharkfin",     path: "game_assets/sprites/shark-fin.png",          offset: new Vec2(-10, -4), scale: new Vec2(0.5, 0.5), rotation: Math.PI / 8 },
    Kelpstache:   { asset: "Kelpstache",   path: "game_assets/sprites/kelpstache.png",         offset: new Vec2(12, 7) },
    PetFish:   { asset: "PetFish",   path: "game_assets/sprites/pet-fish.png",        offset: new Vec2(18, -8) },
};

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

export default class MainMenu extends Scene {

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
    // private popupHitboxDebug: Graphic[] = []; // DEBUG: visualize map click regions

    private helpOpen: boolean = false;
    private helpPage: number = 0;
    private helpDim: Graphic;
    private helpPages: Sprite[] = [];   // [about1, about2, about3, help, controls, cheats]
    private helpClose: Sprite;
    private helpNext: Sprite;
    private helpPrev: Sprite;

    private bedOpen: boolean = false;
    private bedDim: Graphic;
    private bedTitle: Button;
    private bedButtons: Button[] = [];

    private tableArrow: EndArrow | null = null;
    private tableArrowDismissed: boolean = false;
    private readonly TABLE_ARROW_TARGET = new Vec2(310, 690);

    private readonly BED_NIGHTMARE_EVENT = "bed_nightmare";
    private readonly BED_CLOSE_EVENT = "bed_close";

    private playerShadow: Sprite;

    private carriedItemSprites: { sprite: Sprite; offset: Vec2 }[] = [];

    private fadeOverlay: Rect;
    
    private readonly CLOSE_POS = new Vec2(55, 55); // top-left of popup

    private readonly CLOSE_HIT = 40; // close button click radius in px

    private readonly MAP_HIT   = 60; // map region click radius in px

    private readonly CITY_POS = new Vec2(285, 695);
    private readonly OCEAN_POS = new Vec2(460, 305);

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
        this.load.image("endArrowSprite", "game_assets/sprites/level-trans-arrow.png");

        this.load.audio("MENU", "game_assets/sounds/songs/home-cleaned.mp3");

        for (const key of Object.keys(ITEM_VISUALS) as ItemKey[]) {
            const visual = ITEM_VISUALS[key];
            if (visual) this.load.image(visual.asset, visual.path);
        }
    }

    public startScene(): void {
        
        this.viewport.setZoomLevel(1);
        this.viewport.setCenter(512, 512);

        const center = this.viewport.getCenter();

        this.addLayer("bg", 0);
        this.addLayer("home", 1);
        this.addLayer("shadow", 2);
        this.addLayer("player", 3);
        this.addLayer("menu-equippables", 4);
        this.addLayer("debug", 4);
        this.addLayer("arrowLayer", 5);
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

        this.spawnCarriedItems();

        this.viewport.setCenter(center.x, center.y);
        this.viewport.setZoomLevel(2);
        this.viewport.follow(this.player);

        if (!this.tableArrowDismissed) {
            const arrowSprite = this.add.sprite("endArrowSprite", "arrowLayer");
            this.tableArrow = new EndArrow(arrowSprite, this.player);
        }

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

        // DEBUG: hitbox overlays for map click regions
        // const debugTargets: { pos: Vec2; size: number; color: Color }[] = [
        //     { pos: this.CITY_POS,  size: this.MAP_HIT,   color: new Color(0, 255, 0, 0.35) },
        //     { pos: this.OCEAN_POS, size: this.MAP_HIT,   color: new Color(0, 150, 255, 0.35) },
        //     { pos: new Vec2(this.popupClose.position.x, this.popupClose.position.y), size: this.CLOSE_HIT, color: new Color(255, 0, 0, 0.35) },
        // ];
        // for (const t of debugTargets) {
        //     const rect = this.add.graphic(GraphicType.RECT, "popupOverlay", {
        //         position: t.pos.clone(),
        //         size: new Vec2(t.size * 2, t.size * 2)
        //     });
        //     rect.color = t.color;
        //     rect.visible = false;
        //     this.popupHitboxDebug.push(rect);
        // }

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

        // bed popup
        this.bedDim = this.add.graphic(GraphicType.RECT, "popup", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(1024, 1024)
        });
        this.bedDim.color = new Color(0, 0, 0, 0.7);
        this.bedDim.visible = false;

        const bedCx = center.x;
        const bedCy = center.y;

        this.bedTitle = <Button>this.add.uiElement(UIElementType.BUTTON, "popupOverlay", {
            position: new Vec2(bedCx, bedCy - 130),
            text: "SLEEP",
        });
        this.bedTitle.size.set(300, 40);
        this.bedTitle.borderWidth = 0;
        this.bedTitle.backgroundColor = new Color(0, 0, 0, 0);
        this.bedTitle.textColor = Color.WHITE;
        this.bedTitle.fontSize = 28;
        this.bedTitle.visible = false;

        const bedButtonDefs: [string, string][] = [
            ["NIGHTMARE LEVEL", this.BED_NIGHTMARE_EVENT],
            ["Back",            this.BED_CLOSE_EVENT],
        ];
        const bedStartY = bedCy - 10;
        const bedSpacing = 80;
        for (let i = 0; i < bedButtonDefs.length; i++) {
            const [label, eventId] = bedButtonDefs[i];
            const btn = <Button>this.add.uiElement(UIElementType.BUTTON, "popupOverlay", {
                position: new Vec2(bedCx, bedStartY + i * bedSpacing),
                text: label,
            });
            btn.size.set(360, 55);
            btn.borderWidth = 2;
            btn.borderColor = Color.WHITE;
            btn.backgroundColor = new Color(60, 60, 60, 200);
            btn.textColor = Color.WHITE;
            btn.fontSize = 20;
            btn.onClickEventId = eventId;
            btn.visible = false;
            this.bedButtons.push(btn);
        }

        this.receiver.subscribe(Zones.WALL_MAP);
        this.receiver.subscribe(Zones.BED);
        this.receiver.subscribe(Zones.BOOK_TABLE);
        this.receiver.subscribe(this.BED_NIGHTMARE_EVENT);
        this.receiver.subscribe(this.BED_CLOSE_EVENT);
        this.emitter.fireEvent(GameEventType.PLAY_MUSIC, {key: "MENU", loop: true, holdReference: true});
        
        this.fadeOverlay.tweens.play("fadeIn");
    }

    public updateScene(_deltaT: number): void {
        if (this.popupOpen) {
            this.viewport.setZoomLevel(1);
            if (this.tableArrow) this.tableArrow.visible = false;
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
                if (Math.abs(mouse.x - this.CITY_POS.x) <= this.MAP_HIT &&
                    Math.abs(mouse.y - this.CITY_POS.y) <= this.MAP_HIT) {
                    this.dismissTableArrow();
                    this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: "MENU", loop: true, holdReference: true});
                    this.sceneManager.changeToScene(CityLevel);
                }
                if (Math.abs(mouse.x - this.OCEAN_POS.x) <= this.MAP_HIT &&
                    Math.abs(mouse.y - this.OCEAN_POS.y) <= this.MAP_HIT) {
                    this.dismissTableArrow();
                    this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: "MENU", loop: true, holdReference: true});
                    this.sceneManager.changeToScene(OceanLevel);
                }
            }

            return;
        }

        if (this.bedOpen) {
            this.viewport.setZoomLevel(1);
            if (this.tableArrow) this.tableArrow.visible = false;
            if (Input.isKeyJustPressed("escape")) {
                this.closeBed();
            }
            while (this.receiver.hasNextEvent()) {
                this.handleEvent(this.receiver.getNextEvent());
            }
            return;
        }

        if (this.helpOpen) {
            if (this.tableArrow) this.tableArrow.visible = false;
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
        this.updateCarriedItemPositions();
        this.checkZoneProximity();

        if (this.tableArrow) {
            if (this.activeZone && this.activeZone.event === Zones.BOOK_TABLE) {
                this.tableArrow.visible = false;
            } else {
                this.tableArrow.update(_deltaT, this.TABLE_ARROW_TARGET);
            }
        }

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
        // for (const r of this.popupHitboxDebug) r.visible = false;
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

    private spawnCarriedItems(): void {
        //this._needle.rotation = -1 * Math.PI / 1.8;
        const snapshot = SMScene.savedSnapshot;
        if (!snapshot) return;
        const seen = new Set<ItemKey>();
        for (const entry of snapshot.equippables) {
            if (seen.has(entry.key)) continue;
            seen.add(entry.key);
            const visual = ITEM_VISUALS[entry.key];
            if (!visual) continue;
            const sprite = this.add.sprite(visual.asset, "menu-equippables");
            sprite.scale.copy(visual.scale ?? new Vec2(1, 1));
            sprite.rotation = visual.rotation ?? 0;
            sprite.scale.scale(2);
            this.carriedItemSprites.push({ sprite, offset: visual.offset });
        }
    }

    private updateCarriedItemPositions(): void {
        if (this.carriedItemSprites.length === 0) return;
        const facingSign = this.player.invertX ? -1 : 1;
        for (const { sprite, offset } of this.carriedItemSprites) {
            sprite.invertX = this.player.invertX;
            sprite.position.set(
                this.player.position.x + offset.x * facingSign * 2,
                this.player.position.y + offset.y * 2,
            );
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
                this.popupOpen = true;
                this.popupDim.visible = true;
                this.popupMap.visible = true;
                this.popupClose.visible = true;
                // for (const r of this.popupHitboxDebug) r.visible = true;
                this.zoneLabel.visible = false;
                break;
            case Zones.BOOK_TABLE:
                this.dismissTableArrow();
                this.openHelp();
                break;
            case Zones.BED:        this.openBed(); break;
            case this.BED_NIGHTMARE_EVENT:
                this.closeBed();
                this.emitter.fireEvent(GameEventType.STOP_SOUND, {key: "MENU", loop: true, holdReference: true});
                this.sceneManager.changeToScene(NightmareLevel);
                break;
            case this.BED_CLOSE_EVENT:
                this.closeBed();
                break;
        }
    }

    private dismissTableArrow(): void {
        if (this.tableArrowDismissed) return;
        this.tableArrowDismissed = true;
        if (this.tableArrow) {
            this.tableArrow.visible = false;
            this.tableArrow = null;
        }
    }

    private openBed(): void {
        this.bedOpen = true;
        this.bedDim.visible = true;
        this.bedTitle.visible = true;
        for (const btn of this.bedButtons) btn.visible = true;
        this.zoneLabel.visible = false;
        this.viewport.setZoomLevel(1);
    }

    private closeBed(): void {
        this.bedOpen = false;
        this.bedDim.visible = false;
        this.bedTitle.visible = false;
        for (const btn of this.bedButtons) btn.visible = false;
        this.viewport.setZoomLevel(2);
    }

}
