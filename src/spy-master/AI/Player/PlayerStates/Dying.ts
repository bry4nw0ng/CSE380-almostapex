import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { PlayerAnimations } from "../PlayerAnimations";
import PlayerState, { PlayerStates } from "./PlayerState";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import { GameEventType } from "../../../../Wolfie2D/Events/GameEventType";
/**
 * The Dead state for the player's FSM AI. 
 */
export default class Dying extends PlayerState {
    protected dTimer: Timer;

    // Trigger the player's death animation when we enter the dead state
    public onEnter(options: Record<string, any>): void {
        //IMPORTANT: NEED DEATH AUDIO KEY
        //let deathAudio = this.owner.getScene().getDeathAudioKey();
        
        //this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: deathAudio, loop: false, holdReference: false});
        this.owner.animation.play("DYING", false);
        this.dTimer = new Timer(2000, () => this.finished("DEAD"));

        this.dTimer.start();
    }  

    // Ignore all events from the rest of the game
    public handleInput(event: GameEvent): void {}

    // Empty update method - if the player is dead, don't update anything
    public update(deltaT: number): void {}

    public onExit(): Record<string, any> { return {}; }
    
}