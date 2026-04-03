import StateMachineAI from "../../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";

import Idle from "./PlayerStates/Idle";
import Walk from "./PlayerStates/Walk";
import Hurt from "./PlayerStates/Hurt";
import Dying from "./PlayerStates/Dying";
import Dead from "./PlayerStates/Dead";

import PlayerState from "./PlayerStates/PlayerState";
import PlayerWeapon from "./PlayerWeapon";
import Input from "../../../Wolfie2D/Input/Input";

import { AAControls } from "../../AAControls";//IMPORTANT PLAYERSTATE
import AAAnimatedSprite from "../../Node/AAAnimatedSprite";
import MathUtils from "../../../Wolfie2D/Utils/MathUtils";
import { AAEvents } from "../../Events";

import Timer from "../../../Wolfie2D/Timing/Timer";


/**
 * Animation keys for the player spritesheet
 */
export const PlayerAnimations = {
    IDLE: "IDLE",
    WALK_LEFT: "WALKING_LEFT",
    WALK_RIGHT: "WALKING_RIGHT",
    SHOOT_LEFT: "WATERGUN_LEFT",
    SHOOT_RIGHT: "WATERGUN_RIGHT",
    DAMAGE_LEFT: "DAMAGE_LEFT",
    DAMAGE_RIGHT: "DAMAGE_RIGHT",
    DYING: "DYING",
    DEAD: "DEAD"
} as const

/**
 * Tween animations the player can player.

export const PlayerTweens = {
    FLIP: "FLIP",
    DEATH: "DEATH"
} as const
*/
/**
 * Keys for the states the PlayerController can be in.
 */
export const PlayerStates = {
    IDLE: "IDLE",
    WALK: "WALK",
    HURT: "HURT",
    DYING: "DYING",
    DEAD: "DEAD",
} as const

/**
 * The controller that controls the player.
 */
export default class PlayerController extends StateMachineAI {
    public readonly MAX_SPEED: number = 200;
    public readonly MIN_SPEED: number = 100;

    /** Health and max health for the player */
    protected _health: number;
    protected _maxHealth: number;

    /** The players game node */
    protected owner: AAAnimatedSprite;

    protected _velocity: Vec2;
	protected _speed: number;

    protected tilemap: OrthogonalTilemap;
    // protected cannon: Sprite;
    protected weapon: PlayerWeapon;

    protected iTimer: Timer;

    public initializeAI(owner: AAAnimatedSprite, options: Record<string, any>){
        this.owner = owner;

        this.weapon = options.weaponSystem;
        this.iTimer = new Timer(1000, () => this.changeState(PlayerStates.IDLE));

        this.tilemap = this.owner.getScene().getTilemap(options.tilemap) as OrthogonalTilemap;
        this.speed = 400;
        this.velocity = Vec2.ZERO;

        this.health = 5
        this.maxHealth = 5;

        
        // Add the different states the player can be in to the PlayerController 
		this.addState(PlayerStates.IDLE, new Idle(this, this.owner));
		this.addState(PlayerStates.WALK, new Walk(this, this.owner));
        this.addState(PlayerStates.DEAD, new Dead(this, this.owner));
        /*My states*/
        this.addState(PlayerStates.DYING, new Dying(this, this.owner));
        this.addState(PlayerStates.HURT, new Hurt(this, this.owner));
        
        // Start the player in the Idle state
        this.initialize(PlayerStates.IDLE);
    }

    /** 
	 * Get the inputs from the keyboard, or Vec2.Zero if nothing is being pressed
	 */
    public get inputDir(): Vec2 {
        let direction = Vec2.ZERO;
		direction.x = (Input.isPressed(AAControls.MOVE_LEFT) ? -1 : 0) + (Input.isPressed(AAControls.MOVE_RIGHT) ? 1 : 0);
		direction.y = (Input.isPressed(AAControls.MOVE_UP) ? -1 : 0) + (Input.isPressed(AAControls.MOVE_DOWN) ? 1 : 0);

		return direction;
    }
    /** 
     * Gets the direction of the mouse from the player's position as a Vec2
     */
    public get faceDir(): Vec2 { return this.owner.position.dirTo(Input.getGlobalMousePosition()); }

    public update(deltaT: number): void {
		super.update(deltaT);

        // If the player hits the attack button and the weapon system isn't running, restart the system and fire!
        if (Input.isPressed(AAControls.ATTACK) && !this.weapon.isSystemRunning()) {
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
            this.changeState(PlayerStates.DYING);
        }

}
}