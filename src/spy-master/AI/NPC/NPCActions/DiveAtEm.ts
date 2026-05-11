import { GoapActionStatus } from "../../../../Wolfie2D/DataTypes/Goap/GoapAction";
import AABB from "../../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import NPCAction from "./NPCAction";
import { ItemEvent } from "../../../Events";
import Timer from "../../../../Wolfie2D/Timing/Timer";

//Mostly Copied from Shootem
export default class DiveAtEm extends NPCAction {

    protected chargeTimer: Timer;
    protected cooldownTimer: Timer;
    protected coolingDown: boolean;
    protected charging: boolean;
    protected diving: boolean;

    protected diveTo: Vec2;
    protected diveLeft: number;

    public constructor(parent: NPCBehavior, actor: NPCActor) {
        super(parent, actor);
        this._target = null;
        this.cooldownTimer = new Timer(1500, () => {
            if (!this.coolingDown) {
                return;
            }
            this.coolingDown = false;
            this.diving = false;
            this.finished();
        }, false)
        this.chargeTimer = new Timer(750, () => {
            if (!this.charging) {
                return;
            }
            this.charging = false;
            this.diving = true;
            this.attack();
            this.actor.animation.play("ATTACKING_RIGHT", false);
            this.actor.animation.queue("WALK", true);
        }, false);

        this.coolingDown = false;
        this.charging = false;
        this.diving = false;
        this.diveTo = Vec2.ZERO;

        this.diveLeft = 800;
    }

    public performAction(target: TargetableEntity): void {
        this.finished();
    }

    public onEnter(options: Record<string, any>): void {
        super.onEnter(options);

        this.coolingDown = false;
    }

    public handleInput(event: GameEvent): void {
        switch(event.type) {
            default: {
                super.handleInput(event);
                break;
            }
        }
    }
    
    public update(deltaT: number): void {
        //the super call was making it stop right before they hit player and just stand there
        //super.update(deltaT);
        if (this.target == null) {
            this.finished();
            return;
        }

/*         //reset the position if lost em
        if (this.actor.position.distanceTo(this.target.position) > 150) {
            this.finished();
            return;
        } */
        if (this.diving) {
            //To make deltaT in ms to decrement to diveLeft
            this.diveLeft -= deltaT * 1000;
            let curDiveSpeed = this.diveLeft / 800;
            //Scaled by deltaT and slows down with time so stops at end
            this.actor.move(this.diveTo.clone().scaled(deltaT * 200 * curDiveSpeed));
            if (this.diveLeft <= 0) {
                this.diving = false;
                this.coolingDown = true;
                this.cooldownTimer.start();
            }
            return;
        }

        if (this.coolingDown) {
            return;
        }

        if (!this.charging && this.actor.position.distanceTo(this.target.position) <= 150) {
            this.charging = true;
            this.chargeTimer.start();
            //Add some sort of charging animation
            this.actor.animation.play("IDLE", false);
        }
        else if (!this.charging && this.actor.position.distanceTo(this.target.position) > 150) {
            this.finished();
        }
            
    }

    public attack() {
        this.diveLeft = 800;
        //Locks in at start cuz if he were to dive and follow at that speed, it would be horrifying, also overshoots x1.5
        this.diveTo = this.actor.position.dirTo(this.target.position).scaled(1.5);

        if (this.diveTo.x < 0) {
            this.actor.invertX = false;
        }
        else {
            this.actor.invertX = true;
        }
    }

    public onExit(): Record<string, any> {
        this.cooldownTimer.reset();
        this.chargeTimer.reset();
        this.coolingDown = false;
        this.diving = false;
        this.charging = false;
        return super.onExit();
    }

}