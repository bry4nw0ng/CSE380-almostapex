import Unique from "../../../Wolfie2D/DataTypes/Interfaces/Unique";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../../Wolfie2D/Events/Emitter";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
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

    protected constructor(sprite: Sprite){ 
        this.sprite = sprite;
        this.emitter = new Emitter();
        this._equippableOffset = new Vec2(0,0);

        this._inventory = null;
        this._targetable = new BasicTargetable(this.sprite);

        this._isAbility = false;
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
}