import Updateable from "../DataTypes/Interfaces/Updateable";
import Timer from "./Timer";

export default class TimerManager implements Updateable {

    protected timers: Array<Timer>;

    protected paused: boolean;

    constructor(){
        this.timers = new Array();

        this.paused = false;
    }

    protected static instance: TimerManager;

    static getInstance(): TimerManager {
        if(!this.instance){
            this.instance = new TimerManager();
        }

        return this.instance;
    }

    pauseAllTimers(): void {
        this.paused = true;
    }

    unpauseAllTimers(): void {
        this.paused = false;
    }

    addTimer(timer: Timer){
        this.timers.push(timer);
    }

    clearTimers(){
        this.timers = new Array();
    }

    update(deltaT: number): void {
        if (this.paused) {
            return;
        }
        this.timers.forEach(timer => timer.update(deltaT));
    }
}