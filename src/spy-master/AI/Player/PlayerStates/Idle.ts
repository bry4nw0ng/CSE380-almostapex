import { PlayerAnimations } from "../PlayerAnimations";
import PlayerState, { PlayerStates } from "./PlayerState";
import Input from "../../../../Wolfie2D/Input/Input";
import { AAControls } from "../../../AAControls";

export default class Idle extends PlayerState {

	public onEnter(options: Record<string, any>): void {
        this.owner.animation.play(PlayerAnimations.IDLE);
		this.parent.speed = this.parent.MIN_SPEED;
        this.parent.velocity.x = 0;
        this.parent.velocity.y = 0;
	}

	public update(deltaT: number): void {
        // Adjust the direction the player is facing
		super.update(deltaT);

        // Get the direction of the player's movement
		let dir = this.parent.inputDir;

        if (this.parent.health <= 0) {
            this.finished(PlayerStates.DYING);
        }
        // If the player is moving along the x-axis, transition to the walking state
		else if (!dir.isZero() && dir.y === 0){
			this.finished(PlayerStates.WALK);
		} 
        // Otherwise, do nothing (keep idling)
        else {
            // Move the player
            this.owner.move(this.parent.velocity.scaled(deltaT));
        }
		
	}

	public onExit(): Record<string, any> {
		this.owner.animation.stop();
		return {};
	}
}