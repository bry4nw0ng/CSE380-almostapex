import StateMachineAI from "../../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";

import Idle from "./PlayerStates/Idle";
import Walk from "./PlayerStates/Walk";
import Hurt from "./PlayerStates/Hurt";
import Dying from "./PlayerStates/Dying";
import Dead from "./PlayerStates/Dead";

//import PlayerWeapon from "./PlayerWeapon";
import Input from "../../../Wolfie2D/Input/Input";

import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import { AAControls } from "../../AAControls";
//import AAAnimatedSprite from "../../Node/AAAnimatedSprite";
import MathUtils from "../../../Wolfie2D/Utils/MathUtils";
import { AAEvents, AbilityEvent, CheatEvent, ItemEvent } from "../../Events";

import Timer from "../../../Wolfie2D/Timing/Timer";
import AI from "../../../Wolfie2D/DataTypes/Interfaces/AI";

import PlayerState from "./PlayerStates/PlayerState";
import { PlayerAnimations } from "./PlayerAnimations";
import { AAPlayerStates } from "./PlayerStates/AAPlayerStates";
import PlayerActor from "../../Actors/PlayerActor";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Item from "../../GameSystems/ItemSystem/Item";
import Inventory from "../../GameSystems/ItemSystem/Inventory";

import DaNeedle from "../../GameSystems/ItemSystem/Items/DaNeedle";
//Could be circular,idk yet
import MainSMScene from "../../Scenes/MainSMScene";
import Scene from "../../../Wolfie2D/Scene/Scene";

import { GameEventType } from "../../../Wolfie2D/Events/GameEventType";
import MainMenu from "../../Scenes/MainMenu";

/**
 * The controller that controls the player.
 */
export default class PlayerController extends StateMachineAI implements AI{
    public readonly MAX_SPEED: number = 200;
    public readonly MIN_SPEED: number = 100;

    /** Health and max health for the player */
    protected _health: number;
    protected _maxHealth: number;

    /** The players game node */
    protected owner: PlayerActor;

    protected _velocity: Vec2;
	protected _speed: number;
    protected playerFacingDir: number;

    protected scene: Scene;
    //protected tilemap: OrthogonalTilemap;
    // protected cannon: Sprite;
    //protected weapon: PlayerWeapon;

    protected iTimer: Timer;
    protected cooldownTimer: Timer;
    protected weaponTiredTimer: Timer;
    protected weaponTiredGunTimer: Timer;

    protected cheats: string[];

    public initializeAI(owner: PlayerActor, options: Record<string, any>){
        this.owner = owner;

        //this.weapon = options.weaponSystem;
        this.iTimer = new Timer(1000, () => this.changeState(AAPlayerStates.IDLE));
        this.cooldownTimer = new Timer(15000, () => this.owner.isCoolingDown = false, false);
        this.weaponTiredTimer = new Timer(1000, () => this.owner.isWeaponTired = false, false);
        this.weaponTiredGunTimer = new Timer(400, () => this.owner.isWeaponTired = false, false);

        //this.tilemap = this.owner.getScene().getTilemap(options.tilemap) as OrthogonalTilemap;
        //this.speed = 400;
        this.speed = 800;
        this.velocity = Vec2.ZERO;
        this.playerFacingDir = 1;
        this.health = 10
        this.maxHealth = 10;

        this.scene = this.owner.getScene();

        this.receiver.subscribe(AbilityEvent.USED_JETPACK);
        
        // Add the different states the player can be in to the PlayerController 
		this.addState(AAPlayerStates.IDLE, new Idle(this, this.owner));
		this.addState(AAPlayerStates.WALK, new Walk(this, this.owner));

        this.addState(AAPlayerStates.DEAD, new Dead(this, this.owner));
        this.addState(AAPlayerStates.DYING, new Dying(this, this.owner));
        this.addState(AAPlayerStates.HURT, new Hurt(this, this.owner));
        
        // Start the player in the Idle state
        this.initialize(AAPlayerStates.IDLE);

        this.cheats = [
            "CHEAT_CITY",
            "CHEAT_MOUNTAIN",
            "CHEAT_OCEAN",
            "CHEAT_TOP_LEVEL",
            "CHEAT_INVINCIBLE",
            "CHEAT_POW_CANNON",
            "CHEAT_GIVE_ITEMS",
            "CHEAT_SPAWN_BOSS",
            "CHEAT_TELEPORT_TO_MERCHANT",
            "CHEAT_GIVE_CRYSTALS",
            "CHEAT_CONSOLE_LOCATION"
        ];
    }
    
    public handleEvent(event: GameEvent): void {
        switch(event.type) {
            case AbilityEvent.USED_JETPACK: {
                this.handleJetPackTriggered();
                break;
            }
            default: {
                super.handleEvent(event);
                break;
            }
        }
    } 

    public handleJetPackTriggered() {
        this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: "COKEPACK", loop: false, holdReference: false});
        this.speed = this.speed * 2;
        let activeTimer = new Timer(5000, () => this.speed = this.speed / 2, false);
        activeTimer.start();
    }

    /** 
	 * Get the inputs from the keyboard, or Vec2.Zero if nothing is being pressed
	 */
    public get inputDir(): Vec2 {
        let direction = Vec2.ZERO;
		direction.x = (Input.isPressed(AAControls.MOVE_LEFT) ? -1 : 0) + (Input.isPressed(AAControls.MOVE_RIGHT) ? 1 : 0);
		direction.y = (Input.isPressed(AAControls.MOVE_UP) ? -1 : 0) + (Input.isPressed(AAControls.MOVE_DOWN) ? 1 : 0);

		return direction.normalize();
    }

    /** 
     * Gets the direction of the mouse from the player's position as a Vec2
     */
    public get faceDir(): Vec2 { return this.owner.position.dirTo(Input.getGlobalMousePosition()); }

    public update(deltaT: number): void {
        if (this.owner.health <= 0) {
            return;
        }
		super.update(deltaT);
        //console.log("PLayer locX: ", this.owner.position.x, " locY: ", this.owner.position.y)
        if (this.inputDir.x > 0) {
            this.playerFacingDir = 1;
            this.owner.invertX = false;
        }
        else if (this.inputDir.x < 0){
            this.playerFacingDir = -1;
            this.owner.invertX = true;
        }

        if (Input.isJustPressed(AAControls.PICKUP_ITEM)) {
            this.emitter.fireEvent(ItemEvent.ITEM_REQUEST, {player: this.owner, inventory: this.owner.equippables });
        }
        if (Input.isJustPressed(AAControls.MEELEE)) {
            let weapon = this.owner.equippables.find(item => item.isWeapon == true); //Might have to change if add more meelees
            if (weapon && !(this.owner.isWeaponTired)) {
                this.emitter.fireEvent(GameEventType.PLAY_SFX, {key: "SWING", loop: false, holdReference: false});
                weapon.useWeapon(this.owner, this.playerFacingDir);
                this.owner.isWeaponTired = true;
                this.weaponTiredTimer.start();
            }
        }
        if (Input.isJustPressed(AAControls.ATTACK) || Input.isMousePressed()) {
            if (!(this.scene instanceof MainSMScene)) {
                return;
            }
            console.log("SHOOT");
            if (!(this.owner.isWeaponTired)) {
                let aim = this.faceDir;
                this.scene.spawnSpitball(this.owner.position.clone(), aim);
                this.owner.isWeaponTired = true;
                this.weaponTiredGunTimer.start();
            }
        }
        let abilityOpts = [...this.owner.abilities.items()];
        let abilityKeys = [AAControls.ABILITY1, AAControls.ABILITY2, AAControls.ABILITY3];
        for (let i = 0; i < 3; i++) {
            if (Input.isJustPressed(abilityKeys[i])) {
                let ab = abilityOpts[i];
                if (ab && !ab.isCoolingDown) {
                    ab.useAbility(this.owner);
                    ab.startCooldown();
                }
            }
        }
        
           //Reset position of items each update
            for (let equippable of this.owner.equippables.items()) {
                if (this.playerFacingDir == -1) {
                    equippable.getSprite().invertX = true;
                }
                else {
                    equippable.getSprite().invertX = false;
                }
                if (equippable instanceof DaNeedle) {
                    this.makeDaNeedleSpin(equippable, deltaT);
                }
                else {
                    equippable.position.set(
                        this.owner.position.x + equippable.equippableOffset.x * this.playerFacingDir,
                        this.owner.position.y + equippable.equippableOffset.y
                    );
                }
            };
        
        for (const cheat of this.cheats) {
            if (Input.isJustPressed(AAControls[cheat])) {
                this.emitter.fireEvent(CheatEvent[cheat]);
                return;
            }
        }
    }

    public makeDaNeedleSpin(needle: DaNeedle, roc: number) {
        if (needle.isSpinning) {
            needle.curAngle = needle.curAngle + roc * 2 * Math.PI * this.playerFacingDir;
            needle.position.set(
                    this.owner.position.x + (needle.radiusToPlayer * Math.cos(needle.curAngle)),
                    this.owner.position.y + (needle.radiusToPlayer * Math.sin(needle.curAngle))
                );
            needle.getSprite().rotation = -1 * this.playerFacingDir * (needle.curAngle + Math.PI / 2);
        }
        else {
            needle.position.set(
                this.owner.position.x + needle.equippableOffset.x * this.playerFacingDir,
                this.owner.position.y + needle.equippableOffset.y
            );
        }
    }

    public get velocity(): Vec2 { return this._velocity; }
    public set velocity(velocity: Vec2) { this._velocity = velocity; }

    public get speed(): number { return this._speed; }
    public set speed(speed: number) { this._speed = speed; }

    public get maxHealth(): number { return this._maxHealth; }
    public set maxHealth(maxHealth: number) { 
        this._maxHealth = maxHealth; 
        // When the health changes, fire an event up to the scene.
        this.emitter.fireEvent(AAEvents.HEALTH_CHANGE, {curhp: this.health, maxhp: this.maxHealth});
    }

    public get health(): number { return this._health; }
    public set health(health: number) { 
        /*let healthBefore = this._health;*/
        this._health = MathUtils.clamp(health, 0, this.maxHealth);
        // When the health changes, fire an event up to the scene.
        this.emitter.fireEvent(AAEvents.HEALTH_CHANGE, {curhp: this.health, maxhp: this.maxHealth});
        // If the health hit 0, change the state of the player
        if (this.health === 0) { 
            this.changeState(AAPlayerStates.DYING);
        }

}


}