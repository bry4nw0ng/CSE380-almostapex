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

import { AAControls } from "../../AAControls";
//import AAAnimatedSprite from "../../Node/AAAnimatedSprite";
import MathUtils from "../../../Wolfie2D/Utils/MathUtils";
import { AAEvents, AbilityEvent, ItemEvent } from "../../Events";

import Timer from "../../../Wolfie2D/Timing/Timer";
import AI from "../../../Wolfie2D/DataTypes/Interfaces/AI";

import PlayerState from "./PlayerStates/PlayerState";
import { PlayerAnimations } from "./PlayerAnimations";
import { AAPlayerStates } from "./PlayerStates/AAPlayerStates";
import PlayerActor from "../../Actors/PlayerActor";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Item from "../../GameSystems/ItemSystem/Item";
import Inventory from "../../GameSystems/ItemSystem/Inventory";
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

    //protected tilemap: OrthogonalTilemap;
    // protected cannon: Sprite;
    //protected weapon: PlayerWeapon;

    protected iTimer: Timer;
    protected cooldownTimer: Timer;


    public initializeAI(owner: PlayerActor, options: Record<string, any>){
        this.owner = owner;

        //this.weapon = options.weaponSystem;
        this.iTimer = new Timer(1000, () => this.changeState(AAPlayerStates.IDLE));
        this.cooldownTimer = new Timer(15000, () => this.owner.isCoolingDown = false, false);

        //this.tilemap = this.owner.getScene().getTilemap(options.tilemap) as OrthogonalTilemap;
        //this.speed = 400;
        this.speed = 800;
        this.velocity = Vec2.ZERO;

        this.health = 5
        this.maxHealth = 5;

        
        // Add the different states the player can be in to the PlayerController 
		this.addState(AAPlayerStates.IDLE, new Idle(this, this.owner));
		this.addState(AAPlayerStates.WALK, new Walk(this, this.owner));

        this.addState(AAPlayerStates.DEAD, new Dead(this, this.owner));
        this.addState(AAPlayerStates.DYING, new Dying(this, this.owner));
        this.addState(AAPlayerStates.HURT, new Hurt(this, this.owner));
        
        // Start the player in the Idle state
        this.initialize(AAPlayerStates.IDLE);
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
		super.update(deltaT);

        if (Input.isPressed(AAControls.PICKUP_ITEM)) {
            this.emitter.fireEvent(ItemEvent.ITEM_REQUEST, {player: this.owner, inventory: this.owner.equippables });
        }
        if (!this.owner.isCoolingDown) {
            if (Input.isPressed(AAControls.ABILITY1)) { 
                console.log(this.owner.abilities);         
                let ab = this.owner.abilities.get(0);
                console.log(ab);
                if (ab) {
                    ab.useAbility(this.owner);
                    this.owner.isCoolingDown = true;
                    this.cooldownTimer.start();
                }
            }
            if (Input.isPressed(AAControls.ABILITY2)) {
                let ab = this.owner.abilities.get(1);
                console.log(ab);
                if (ab) {
                    ab.useAbility(this.owner);
                    this.owner.isCoolingDown = true;
                    this.cooldownTimer.start();
                }
            }
            if (Input.isPressed(AAControls.ABILITY3)) {
                let ab = this.owner.abilities.get(2);
                console.log(ab);
                if (ab) {
                    ab.useAbility(this.owner);
                    this.owner.isCoolingDown = true;
                    this.cooldownTimer.start();
                }
            }
        }
        // If the player hits the attack button and the weapon system isn't running, restart the system and fire!
        /*if (Input.isPressed(AAControls.ATTACK) && !this.weapon.isSystemRunning()) {
            // Start the particle system at the player's current position
            this.weapon.startSystem(500, 0, this.owner.position);

            let xDir = this.faceDir.x;
            if (xDir >= 0) {
                this.owner.animation.play("WATERGUN_RIGHT", false);
            }
            else {
                this.owner.animation.play("WATERGUN_LEFT", false);
            }

            if (this.iTimer.isStopped()) {
                this.iTimer.start();
            }
            else {
                this.iTimer.reset();
                this.iTimer.start();
            }
            }
            */
           //Reset position of items each update
            for (let equippable of this.owner.equippables.items()) {
                equippable.position.set(
                    this.owner.position.x + equippable.equippableOffset.x,
                    this.owner.position.y + equippable.equippableOffset.y
                );
                
            };


            
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