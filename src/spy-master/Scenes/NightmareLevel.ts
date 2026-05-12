import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Timer from "../../Wolfie2D/Timing/Timer";
import SMScene from "./SMScene";
import CityLevel from "./CityLevel";
import OceanLevel from "./OceanLevel";
import Item from "../GameSystems/ItemSystem/Item";
import NPCActor from "../Actors/NPCActor";
import PlayerActor from "../Actors/PlayerActor";
import RaccoonBehavior from "../AI/NPC/NPCBehavior/RaccoonBehavior";
import SharkBehavior from "../AI/NPC/NPCBehavior/SharkBehavior";
import HealthbarHUD from "../GameSystems/HUD/HealthbarHUD";
import { CheatEvent } from "../Events";

import {
    BossDef,
    EndLevelSpriteDef,
    EnemyDef,
    ItemKey,
    LayerDepthMap,
    SceneCtor,
    WaveDef,
} from "./LevelTypes";

export default class NightmareLevel extends SMScene {
    private static readonly FIRST_WAVE_DELAY_MS = 5000;
    private static readonly WAVE_INTERVAL_MS = 15000;

    private nightmareWaveTimer: Timer;
    private nightmareNextWave: number = 1;

    public constructor(viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) {
        super(viewport, sceneManager, renderingManager, options);
        this.nightmareWaveTimer = new Timer(NightmareLevel.FIRST_WAVE_DELAY_MS, () => this.spawnTimedNightmareWave(), false);
    }

    public override loadScene(): void {
        this.loadSharedAssets();

        // Bosses (used as wave enemies for the bullet hell)
        this.load.spritesheet("raccoon", "game_assets/spritesheets/raccoon-all-sprites-finished.json");
        this.load.spritesheet("shark",   "game_assets/spritesheets/shark.json");

        // Boss projectile sprites
        this.load.image("trash-paper",  "game_assets/sprites/trash-paper.png");
        this.load.image("trash-banana", "game_assets/sprites/trash-banana.png");
        this.load.image("small_bubble", "game_assets/sprites/bubble-small.png");
        this.load.image("large_bubble", "game_assets/sprites/bubble-large.png");
    }

    protected override initLevelContent(_player: PlayerActor): void {}

    public getLevelKey(): string { return "nightmare"; }

    public getTilemapKey(): string { return "nightmare"; }

    public getTilemapPath(): string { return "game_assets/tilemaps/nightmare.tmj"; }

    public getSpawnPosition(): Vec2 {
        if (!this.walls) return Vec2.ZERO;
        const dim = this.walls.getDimensions();
        return this.walls.getWorldPosition(Math.floor(dim.x / 2), Math.floor(dim.y / 2));
    }

    public getLayerDepthMap(): LayerDepthMap {
        return { floor: 0, wall: 3, wallNC: 5, transparent: 6 };
    }

    public getMusicKey(): string { return "CITY_MUSIC"; }
    public getMusicPath(): string { return "game_assets/sounds/songs/city-cleaned.mp3"; }

    protected curBossDrop(): number | null { return null; }

    public getEnemyTypes(): EnemyDef[] {
        return [
            {
                key: "raccoon",
                spritesheetKey: "raccoon",
                spritesheetPath: "game_assets/spritesheets/raccoon-all-sprites-finished.json",
                health: 75,
                maxHealth: 75,
                speed: 0,
                scale: new Vec2(1, 1),
                battleGroup: 1,
                hitbox: new AABB(Vec2.ZERO, new Vec2(60, 150)),
                shadow: { offset: new Vec2(0, 0), scale: new Vec2(1, 1), alpha: 0 },
                ai: { ctor: RaccoonBehavior, opts: { range: 750 } },
                crystalDrops: 0,
                shotSprites: ["trash-paper", "trash-banana"],
            },
            {
                key: "shark",
                spritesheetKey: "shark",
                spritesheetPath: "game_assets/spritesheets/shark.json",
                health: 60,
                maxHealth: 60,
                speed: 100,
                scale: new Vec2(1, 1),
                battleGroup: 1,
                hitbox: new AABB(Vec2.ZERO, new Vec2(90, 40)),
                shadow: { offset: new Vec2(0, 0), scale: new Vec2(1, 1), alpha: 0 },
                ai: { ctor: SharkBehavior, opts: { range: 750 } },
                crystalDrops: 0,
                shotSprites: ["large_bubble", "small_bubble"],
            },
        ];
    }

    public getBoss(): BossDef | null { return null; }

    public getWaveConfig(): WaveDef[] {
        return Array.from({ length: 10 }, (_, i) => {
            const waveNum = i + 1;
            return {
                count: waveNum * 2,
                types: this.getNightmareWaveTypes(waveNum),
                delayMs: 0,
                alertKey: waveNum >= 10 ? "BOSS" : `WAVE_${Math.min(waveNum, 3)}`,
                crestKey: `WAVE_${Math.min(waveNum, 4)}`,
                startSfx: "BOSS_SPAWNED",
            };
        });
    }

    public getShopInventory(): Item[] { return []; }
    public getDropItemPool(): ItemKey[] { return []; }

    public getEndLevelLocation(): Vec2 { return Vec2.ZERO; }
    public getEndLevelLabel(): string { return ""; }
    public getEndLevelSprite(): EndLevelSpriteDef {
        return { spritesheetKey: "", idleClosed: "", opening: "", idleOpen: "", closing: "" };
    }

    public getNextLevel(): SceneCtor | null { return null; }

    public override startScene(): void {
        super.startScene();
        this.waveDelayTimer.pause();
        this.waveTweenTimer.pause();
        this.spawnDelayTimer.pause();
        this.nightmareNextWave = 1;
        this.nightmareWaveTimer.start(NightmareLevel.FIRST_WAVE_DELAY_MS);
    }

    private spawnTimedNightmareWave(): void {
        if (this.nightmareNextWave > 10) {
            this.nightmareWaveTimer.pause();
            return;
        }

        const waveNum = this.nightmareNextWave;
        const wave = this.getWaveConfig()[waveNum - 1];
        this.curWave = waveNum;
        this.totInCurWave += wave.count;
        this.leftInCurWave += wave.count;
        this.totSpawned += wave.count;

        this.playWaveAlert(wave.alertKey);
        this.emitter.fireEvent(GameEventType.PLAY_SFX, { key: wave.startSfx, loop: false, holdReference: false });
        if (this.waveCrestSprite) {
            this.waveCrestSprite.animation.playIfNotAlready(wave.crestKey, true);
        }

        for (let i = 0; i < wave.count; i++) {
            const typeKey = SMScene.pickEnemyType(wave.types, i);
            if (typeKey) {
                this.spawnEnemies(typeKey);
            }
        }

        this.nightmareNextWave += 1;
        if (this.nightmareNextWave <= 10) {
            this.nightmareWaveTimer.start(NightmareLevel.WAVE_INTERVAL_MS);
        }
    }

    private getNightmareWaveTypes(waveNum: number): { key: string; count: number }[] {
        return [
            { key: "raccoon", count: waveNum },
            { key: "shark", count: waveNum },
        ];
    }

    // Bosses don't have a "WALK" animation, so the base spawnEnemies (which plays "WALK") throws.
    public override spawnEnemies(typeKey: string): void {
        const def = this.getEnemyTypes().find(d => d.key === typeKey);
        if (!def) {
            console.error(`spawnEnemies: no EnemyDef found for "${typeKey}"`);
            return;
        }

        const spawnPos = this.getRandomNodePosition();
        const npc = this.add.animatedSprite(NPCActor, def.spritesheetKey, "primary");
        npc.position.set(spawnPos.x, spawnPos.y);
        npc.battleGroup = def.battleGroup;
        npc.speed = def.speed;
        npc.health = def.health;
        npc.maxHealth = def.maxHealth;
        npc.addPhysics(def.hitbox, null, false);
        npc.navkey = "navmesh";
        npc.addAI(def.ai.ctor, { ...def.ai.opts, target: this.player });
        npc.scale.copy(def.scale);

        const npcShadow = this.add.sprite("generic-shadow", "shadow");
        npcShadow.position.set(spawnPos.x + def.shadow.offset.x, spawnPos.y + def.shadow.offset.y);
        npcShadow.scale.copy(def.shadow.scale);
        npcShadow.alpha = def.shadow.alpha;
        npcShadow.visible = false;

        const healthbar = new HealthbarHUD(this, npc, "primary", {
            size: npc.size.clone().scaled(1, 1 / 4),
            offset: npc.size.clone().scaled(0, -1 / 2),
        });
        this.healthbars.set(npc, healthbar);
        this.shadows.set(npc, npcShadow);
        this.enemyTypeMap.set(npc, def);
        healthbar.visible = false;

        npc.animation.play("IDLE");

        this.battlers.push(npc);
    }

    protected override handleBattlerKilled(event: GameEvent): void {
        super.handleBattlerKilled(event);
        this.waveDelayTimer.pause();
        this.waveTweenTimer.pause();
        this.spawnDelayTimer.pause();
    }

    protected override handleLevelEvent(event: GameEvent): boolean {
        switch (event.type) {
            case CheatEvent.CHEAT_CITY: {
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
                this.sceneManager.changeToScene(CityLevel);
                return true;
            }
            case CheatEvent.CHEAT_OCEAN: {
                this.emitter.fireEvent(GameEventType.STOP_SOUND, { key: this.getMusicKey() });
                this.sceneManager.changeToScene(OceanLevel);
                return true;
            }
        }
        return false;
    }
}
