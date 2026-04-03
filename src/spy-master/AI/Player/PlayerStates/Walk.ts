import { PlayerStates, PlayerAnimations } from "../PlayerController";
import Input from "../../../../Wolfie2D/Input/Input";
import { AAControls } from "../../../AAControls";//IMPORTANT PLAYERSTATE
import PlayerState from "./PlayerState";

export default class Walk extends PlayerState {

	onEnter(options: Record<string, any>): void {
		this.parent.speed = this.parent.MIN_SPEED;
	}

	update(deltaT: number): void {
        // Call the update method in the parent class - updates the direction the player is facing
        super.update(deltaT);

        // Get the input direction from the player controller
		let dir = this.parent.inputDir;

        if (dir.x > 0) {
            this.owner.animation.playIfNotAlready(PlayerAnimations.WALK_RIGHT);
        }
        else if (dir.x < 0) {
            this.owner.animation.playIfNotAlready(PlayerAnimations.WALK_LEFT);
        }
        /*else if (dir.y < 0) {//IMPORTANT MAKE DOWN AND UP, ONLY DOES IF STRAIGHT
            this.owner.animation.playIfNotAlready(PlayerAnimations.WALK_DOWN);
        }
        else if (dir.y > 0) {
            this.owner.animation.playIfNotAlready(PlayerAnimations.WALK_UP);
        }
        */

        // If the player is not moving - transition to the Idle state
		if(dir.isZero()){
			this.finished(PlayerStates.IDLE);
		} 
        // Otherwise, move the player
        else {
            // Update the vertical velocity of the player
            this.parent.velocity.x = dir.x * this.parent.speed
            this.parent.velocity.y = dir.y * this.parent.speed
            this.owner.move(this.parent.velocity.scaled(deltaT));
        }

	}

	onExit(): Record<string, any> {
		this.owner.animation.stop();
		return {};
	}
}