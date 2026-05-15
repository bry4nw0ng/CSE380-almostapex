import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import NPCBehavior from "../AI/NPC/NPCBehavior";
import Item from "../GameSystems/ItemSystem/Item";
import type Scene from "../../Wolfie2D/Scene/Scene";

export type ItemKey =
    | "Shield" | "RedHat" | "JetPack" | "Healthpack" | "PetFish"
    | "Gum" | "DaNeedle" | "Antennas" | "RaccoonTail" | "Coral" | "SlimeStorage" | "ShellSpecs" | "Kelpstache" | "Sharkfin" | "Crystal";

export type BehaviorCtor = new (...args: any[]) => NPCBehavior;

export type SceneCtor = new (...args: any[]) => Scene;

export interface ShadowConfig {
    offset: Vec2;
    scale: Vec2;
    alpha: number;
}

export interface EnemyDef {
    key: string;
    spritesheetPath: string;
    spritesheetKey: string;
    health: number;
    maxHealth: number;
    speed: number;
    scale: Vec2;
    battleGroup: number;
    hitbox: AABB;
    shadow: ShadowConfig;
    ai: { ctor: BehaviorCtor; opts: Record<string, any> };
    crystalDrops: number;
    shotSprites?: string[];
}

export interface BossDef extends EnemyDef {
    spawnTrigger: "after_final_wave" | "manual";
    deathDropItem?: ItemKey;
    spawnPosition: Vec2;
}

export interface WaveDef {
    count: number;
    types: { key: string; count: number }[];
    delayMs: number;
    alertKey: string;
    crestKey: string;
    startSfx: string;
}

export interface TreasureDef {
    spriteKey: string;
    dataObjectKey: string;
    dataObjectPath: string;
    arrayField: string;
}

export interface EndLevelSpriteDef {
    spritesheetKey: string;
    idleClosed: string;
    opening: string;
    idleOpen: string;
    closing: string;
}

export interface LayerDepthMap {
    floor: number;
    props?: number;
    wall: number;
    wallNC: number;
    transparent: number;
}

export interface ViewportBounds {
    minX: number;
    minY: number;
    w: number;
    h: number;
}

export interface StartingPlayerStats {
    health: number;
    maxHealth: number;
    battleGroup: number;
}

export interface SerializedItem {
    key: ItemKey;
    stack: number;
}

export interface PlayerSnapshot {
    health: number;
    crystals: number;
    equippables: SerializedItem[];
}
