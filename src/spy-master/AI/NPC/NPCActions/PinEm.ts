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
import SMScene from "../../../Scenes/SMScene";

export default class PinEm extends NPCAction {

    protected attackTimer: Timer;
    
    public constructor(parent: NPCBehavior, actor: NPCActor) {
        super(parent, actor);
        this._target = null;
        this.attackTimer = new Timer(1000, () => {}, false);
    }

    public performAction(target: TargetableEntity): void {
        this.finished();
    }

    public onEnter(options: Record<string, any>): void {
        super.onEnter(options);
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
        super.update(deltaT);
        if (this.target == null) {
            this.finished();
            return;
        }

        //reset the position if lost em
        if (this.actor.position.distanceTo(this.target.position) > 150) {
            this.finished();
            return;
        }

        if (this.attackTimer.isStopped()) {
                this.attack();
                this.actor.animation.play("ATTACKING_RIGHT", false);
                this.actor.animation.queue("WALK", true);
                this.attackTimer.start()
        }
        else {
            this.actor.animation.playIfNotAlready("ATTACKING_RIGHT", false);
        }
    }

    public attack() {
        let scene = this.actor.getScene() as SMScene
        let aim = this.actor.position.dirTo(this.target.position);
        if (aim.x < 0) {
            this.actor.invertX = false;
        }
        else {
            this.actor.invertX = true;
        }

        for (let i = 0; i < 6; i++) {
            let curAngle = Math.PI / 3 * i;
            let shootDir = new Vec2(Math.cos(curAngle), Math.sin(curAngle));
            //Have to change when implmented
            scene.spawnEnemyShot(this.actor.position.clone(), shootDir, "puffer", 100);
        }
    }

    public onExit(): Record<string, any> {
        this.attackTimer.reset();
        return super.onExit();
    }

}