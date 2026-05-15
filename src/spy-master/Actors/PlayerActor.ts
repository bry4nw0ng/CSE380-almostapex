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
import { DAMAGE_FLASH_SHADER } from "../Shaders/DamageFlashShaderType";

const FLASH_DECAY_PER_SEC = 4;

export default class PlayerActor extends AnimatedSprite implements Battler {

    /** Override the type of the scene to be the Spy Master scene */
    protected scene: SMScene

    /** Give the player a battler compoonent */
    protected battler: Battler;
    protected targetable: TargetableEntity;

    protected heldItem: SMItem;

    protected _crystals: number;

    protected _speedBoost: number;

    //Buffs
    protected _damageReduction: number;
    protected _damageIncrease: number;
    protected _fireRate: number;
    protected _luck: number;
    protected _invincible: boolean;
    protected iTimer: Timer;
    //protected _canSearch: boolean;
    protected _isCoolingDown: boolean;
    protected _isWeaponTired: boolean;
    protected jPMultiplier: number;
    protected _shotSize: number;
    protected _shotSpeed: number;

    protected _sharkfinActive: boolean;

    protected _hasNeedle: boolean;

    public equippables: Inventory = new Inventory(20);
    public abilities: Inventory = new Inventory(3);

    public flashAmount: number = 0;
    public flashColor: Float32Array = new Float32Array([1.0, 0.0, 0.0]);

    constructor(sheet: Spritesheet) {
        super(sheet);
        this.battler = new BasicBattler(this);
        this.targetable = new BasicTargetable(this);

        this._crystals = 500;

        this._damageReduction = 1;
        this._damageIncrease = 1;
        this._shotSize = 1;
        this._shotSpeed = 1;
        this._fireRate = 1;
        this._luck = 1;
        this._speedBoost = 1;
        this._invincible = false;
        this._isCoolingDown = false;
        this._isWeaponTired = false;
        this.iTimer = new Timer(750, () => this.toggleInvincible(false), false);

        this._hasNeedle = false;
        this._sharkfinActive = false;

        this.useCustomShader(DAMAGE_FLASH_SHADER);
    }

    public override update(deltaT: number): void {
        super.update(deltaT);
        if (this.flashAmount > 0) {
            this.flashAmount = Math.max(0, this.flashAmount - FLASH_DECAY_PER_SEC * deltaT);
        }
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
        const prev = this.battler.health;
        this.battler.health = value;
        if (value < prev) {
            this.flashAmount = 1;
        }
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
    
    get speedBoost(): number {
        return this._speedBoost;
    }
    set speedBoost(value: number) {
        this._speedBoost = value;
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

    get shotSize(): number {
        return this._shotSize;
    }
    set shotSize(boost: number) {
        this._shotSize = boost;
    }

    get shotSpeed(): number {
        return this._shotSpeed;
    }
    set shotSpeed(boost: number) {
        this._shotSpeed = boost;
    }

    get damageIncrease(): number {
        return this._damageIncrease;
    }
    set damageIncrease(newDR: number) {
        this._damageIncrease = newDR;
    }

    get fireRate(): number {
        return this._fireRate;
    }
    set fireRate(newDR: number) {
        this._fireRate = newDR;
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

    get sharkfinActive(): boolean {
        return this._sharkfinActive;
    }

    set sharkfinActive(isOn: boolean) {
        this._sharkfinActive = isOn;
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
            equippable.stopCooldownTimer();
            this.abilities.remove(equippable.id);
        }
        equippable.removeBuff(this);
    }

    public startIFrames() {
        this.toggleInvincible(true);
        this.iTimer.start();
    }
}