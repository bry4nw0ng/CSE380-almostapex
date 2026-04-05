import State from "../../../../Wolfie2D/DataTypes/State/State";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
//import MathUtils from "../../../../Wolfie2D/Utils/MathUtils";
//import AAAnimatedSprite from "../../../Node/AAAnimatedSprite"; //IMPORTANT PLAYERSTATE
import PlayerController from "../PlayerController";
import PlayerActor from "../../../Actors/PlayerActor";

/**
 * An abstract state for the PlayerController 
 */


export default abstract class PlayerState extends State {

    protected parent: PlayerController;
	//protected owner: AAAnimatedSprite;
    protected owner: PlayerActor;
	protected gravity: number;

	//public constructor(parent: PlayerController, owner: AAAnimatedSprite){
    public constructor(parent: PlayerController, owner: PlayerActor) {
		super(parent);
		this.owner = owner;
	}

    public abstract onEnter(options: Record<string, any>): void;

    /**
     * Handle game events from the parent.
     * @param event the game event
     */
	public handleInput(event: GameEvent): void {
        switch(event.type) {
            // Default - throw an error
            default: {
                throw new Error(`Unhandled event in PlayerState of type ${event.type}`);
            }
        }
	}

	public update(deltaT: number): void {
        // This updates the direction the player sprite is facing (left or right)
        /* REMOVED: messing with my stuff let direction = this.parent.inputDir;
		if(direction.x !== 0){
			this.owner.invertX = MathUtils.sign(direction.x) < 0;
		}*/
    }

    public abstract onExit(): Record<string, any>;
}