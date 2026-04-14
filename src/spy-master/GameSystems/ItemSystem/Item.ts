import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../../Wolfie2D/Events/Emitter";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import Layer from "../../../Wolfie2D/Scene/Layer";
import Scene from "../../../Wolfie2D/Scene/Scene";
import BasicTargetable from "../Targeting/BasicTargetable";
import BasicTargeting from "../Targeting/BasicTargeting";

import SMScene from "../../Scenes/SMScene";
import Inventory from "./Inventory";
import { TargetableEntity } from "../Targeting/TargetableEntity";
import { TargetingEntity } from "../Targeting/TargetingEntity";
import PlayerActor from "../../Actors/PlayerActor";
import BasicBattler from "../BattleSystem/BasicBattler";


export default abstract class Item implements Unique, TargetableEntity {

    protected sprite: Sprite;
    protected emitter: Emitter;

    //protected _name: string;
    protected _inventory: Inventory | null;
    protected _targetable: TargetableEntity;
    protected _equippableOffset: Vec2;
    protected _isAbility: boolean = false;
    protected _isWeapon: boolean = false;
    protected _isPassive: boolean = false;
    protected _description: string = "";
    protected _cooldownDuration: number = 0;
    protected _isCoolingDown: boolean = false;
    protected _cooldownStartTime: number = 0;

    protected constructor(sprite: Sprite){
        this.sprite = sprite;
        this.emitter = new Emitter();
        this._equippableOffset = new Vec2(0,0);

        this._inventory = null;
        this._targetable = new BasicTargetable(this.sprite);

        this._isAbility = false;
        this._isWeapon = false;
        this._isPassive = false;
    }

    getTargeting(): TargetingEntity[] { 
        return this._targetable.getTargeting(); 
    }
    addTargeting(targeting: TargetingEntity): void {
        this._targetable.addTargeting(targeting);
    }
    removeTargeting(targeting: TargetingEntity): void {
        this._targetable.removeTargeting(targeting);
    }
    
    public get relativePosition(): Vec2 { return this.sprite.relativePosition; };

    public getSprite(): Sprite { return this.sprite; };

    public get id(): number { return this.sprite.id; }

    public get position(): Vec2 { return this.sprite.position; }
    public set position(position: Vec2) { this.sprite.position = position; }

    public get visible(): boolean { return this.sprite.visible; }
    public set visible(value: boolean) { this.sprite.visible = value; }

    public get inventory(): Inventory | null { return this._inventory; }
    public set inventory(value: Inventory | null) { this._inventory = value; }

    //public get name(): string { return this._name; }
    //public set name(newName: string) {this._name = newName; }

    public get equippableOffset(): Vec2 { return this._equippableOffset; }
    public set equippableOffset(position: Vec2) { this._equippableOffset = position; }

    public applyBuff(player: PlayerActor): void {}
    public removeBuff(player: PlayerActor): void {}

    public useAbility(player: PlayerActor): void { //Make noise since no ability
    }

    public useWeapon(player: PlayerActor, facingDir: number): void { //Make noise since no ability
    }
    public get isAbility(): boolean {
        return this._isAbility;
    }

    public get isWeapon(): boolean {
        return this._isWeapon;
    }

    public get isPassive(): boolean {
        return this._isPassive;
    }

    public get description(): string {
        return this._description;
    }

    public get cooldownDuration(): number {
        return this._cooldownDuration;
    }

    public get isCoolingDown(): boolean {
        return this._isCoolingDown;
    }

    /** Returns 1.0 when cooldown just started, 0.0 when done */
    public get cooldownProgress(): number {
        if (!this._isCoolingDown || this._cooldownDuration <= 0) return 0;
        let elapsed = Date.now() - this._cooldownStartTime;
        let remaining = 1 - (elapsed / this._cooldownDuration);
        return Math.max(0, Math.min(1, remaining));
    }

    public startCooldown(): void {
        if (this._cooldownDuration > 0) {
            this._isCoolingDown = true;
            this._cooldownStartTime = Date.now();
            let timer = new Timer(this._cooldownDuration, () => this._isCoolingDown = false, false);
            timer.start();
        }
    }
}