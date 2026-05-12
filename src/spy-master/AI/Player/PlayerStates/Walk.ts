import { PlayerAnimations } from "../PlayerAnimations";
import PlayerState from "./PlayerState";
import Input from "../../../../Wolfie2D/Input/Input";
import { AAControls } from "../../../AAControls";//IMPORTANT PLAYERSTATE

import { AAPlayerStates } from "./AAPlayerStates";

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
            this.owner.animation.playIfNotAlready(PlayerAnimations.WALK);
        }
        else if (dir.x < 0) {
            this.owner.animation.playIfNotAlready(PlayerAnimations.WALK);
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
			this.finished(AAPlayerStates.IDLE);
		} 
        // Otherwise, move the player
        else {
            let speed = this.parent.speed * (this.parent.jetpackActive ? 2 : 1);
            this.parent.velocity.x = dir.x * speed
            this.parent.velocity.y = dir.y * speed
            this.owner.move(this.parent.velocity.scaled(deltaT));
        }

	}

	onExit(): Record<string, any> {
		this.owner.animation.stop();
		return {};
	}
}