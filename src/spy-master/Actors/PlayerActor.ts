import Spritesheet from "../../Wolfie2D/DataTypes/Spritesheet";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { AbilityEvent, BattlerEvent, ItemEvent } from "../Events";
import BasicBattler from "../GameSystems/BattleSystem/BasicBattler";
import Battler from "../GameSystems/BattleSystem/Battler";
import Inventory from "../GameSystems/ItemSystem/Inventory";
import SMItem from "../GameSystems/ItemSystem/Item";
import BasicTargetable from "../GameSystems/Targeting/BasicTargetable";
import { TargetableEntity } from "../GameSystems/Targeting/TargetableEntity";
import { TargetingEntity } from "../GameSystems/Targeting/TargetingEntity";
import SMScene from "../Scenes/SMScene";
import Item from "../GameSystems/ItemSystem/Item";
import Timer from "../../Wolfie2D/Timing/Timer";
import DaNeedle from "../GameSystems/ItemSystem/Items/DaNeedle";

export default class PlayerActor extends AnimatedSprite implements Battler {

    /** Override the type of the scene to be the Spy Master scene */
    protected scene: SMScene

    /** Give the player a battler compoonent */
    protected battler: Battler;
    protected targetable: TargetableEntity;

    protected heldItem: SMItem;

    protected _crystals: number;

    //Buffs
    protected _damageReduction: number;
    protected _luck: number;
    protected _invincible: boolean;
    protected iTimer: Timer;
    //protected _canSearch: boolean;
    protected _isCoolingDown: boolean;
    protected _isWeaponTired: boolean;
    protected jPMultiplier: number;

    protected _hasNeedle: boolean;

    public equippables: Inventory = new Inventory(20);
    public abilities: Inventory = new Inventory(3);

    constructor(sheet: Spritesheet) {
        super(sheet);
        this.battler = new BasicBattler(this);
        this.targetable = new BasicTargetable(this);

        this._crystals = 10000;

        this.receiver.subscribe(ItemEvent.LASERGUN_FIRED)
        this.receiver.subscribe(AbilityEvent.USED_JETPACK)
        
        this.jPMultiplier
        this._damageReduction = 1;
        this._luck = 1;
        this._invincible = false;
        this._isCoolingDown = false;
        this._isWeaponTired = false;
        this.iTimer = new Timer(750, () => this.toggleInvincible(false), false);

        this._hasNeedle = false;
    }

    get battlerActive(): boolean {
        return this.battler.battlerActive;
    }
    set battlerActive(value: boolean) {
        this.battler.battlerActive = value;
        this.visible = value;
    }
    
    public getTargeting(): TargetingEntity[] { return this.targetable.getTargeting(); }
    public addTargeting(targeting: TargetingEntity): void { this.targetable.addTargeting(targeting); }
    public removeTargeting(targeting: TargetingEntity): void { this.targetable.removeTargeting(targeting); }

    public override setScene(scene: SMScene): void { this.scene = scene; }
    public override getScene(): SMScene { return this.scene; }

    get battleGroup(): number {
        return this.battler.battleGroup;
    }
    set battleGroup(value: number) {
        this.battler.battleGroup = value;
    }
    get maxHealth(): number {
        return this.battler.maxHealth;
    }
    set maxHealth(value: number) {
        this.battler.maxHealth = value;
    }
    get health(): number {
        return this.battler.health;
    }
    set health(value: number) {
        this.battler.health = value;
        if (this.health <= 0) {
            this.emitter.fireEvent(BattlerEvent.BATTLER_KILLED, {id: this.id});
        }
    }

    get crystals(): number {
        return this._crystals;
    }

    set crystals(tot: number) {
        this._crystals = tot;
        console.log("Crystals: ", this._crystals);
    }

    get speed(): number {
        return this.battler.speed;
    }
    set speed(value: number) {
        this.battler.speed = value;
    }
    get inventory(): Inventory {
        return this.battler.inventory;
    }

    get damageReduction(): number {
        return this._damageReduction;
    }
    set damageReduction(newDR: number) {
        this._damageReduction = newDR;
    }

    get luck(): number {
        return this._luck;
    }
    set luck(newLuck: number) {
        this._luck = newLuck;
    }

    toggleInvincible(isOn: boolean): void {
        this._invincible = isOn;
    }

    get invincible(): boolean {
        return this._invincible;
    }

    set isCoolingDown(isOn: boolean) {
        this._isCoolingDown = isOn;
    }
    get isCoolingDown() {
        return this._isCoolingDown;
    }

    set isWeaponTired(isOn: boolean) {
        this._isWeaponTired = isOn;
    }
    get isWeaponTired() {
        return this._isWeaponTired;
    }

    get hasNeedle() {
        return this._hasNeedle;
    }
    set hasNeedle(has: boolean) {
        this._hasNeedle = has;
    }

    public equip(equippable: Item): void{
        console.log("isAbility:", equippable.isAbility);
        console.log("Equipped:", equippable);
        this.equippables.add(equippable);
        if (equippable instanceof DaNeedle) {
            this._hasNeedle = true;
        }
        if (equippable.isAbility) {
            console.log("Added ability");
            this.abilities.add(equippable);
        }
        equippable.applyBuff(this);
    }

    public unEquip(equippable: Item): void {
        this.equippables.remove(equippable.id);
        if (equippable.isAbility) {
            this.abilities.remove(equippable.id);
        }
        equippable.removeBuff(this);
    }

    public startIFrames() {
        this.toggleInvincible(true);
        this.iTimer.start();
    }
}