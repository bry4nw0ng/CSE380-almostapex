import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { PlayerAnimations } from "../PlayerAnimations";
import PlayerState from "./PlayerState";
import { AAPlayerStates } from "./AAPlayerStates";


import Timer from "../../../../Wolfie2D/Timing/Timer";
/**
 * The Dead state for the player's FSM AI. 
 */
export default class Hurt extends PlayerState {
    protected hTimer: Timer;
    
    // Trigger the player's death animation when we enter the dead state
    public onEnter(options: Record<string, any>): void {
        this.owner.animation.play("DAMAGE_RIGHT", false);
        this.hTimer = new Timer(1000, () => this.finished(AAPlayerStates.IDLE));

        this.hTimer.start();
    }  

    // Ignore all events from the rest of the game
    public handleInput(event: GameEvent): void {}

    // Empty update method - if the player is dead, don't update anything
    public update(deltaT: number): void {}

    public onExit(): Record<string, any> { return {}; }
    
}