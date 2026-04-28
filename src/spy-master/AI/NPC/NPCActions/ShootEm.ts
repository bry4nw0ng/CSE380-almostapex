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
import MainSMScene from "../../../Scenes/MainSMScene";

export default class ShootEm extends NPCAction {

    protected inDaBarrel: number;
    protected timer: Timer;
    
    public constructor(parent: NPCBehavior, actor: NPCActor) {
        super(parent, actor);
        this._target = null;
        this.timer = new Timer(400, () => {}, false);

        this.inDaBarrel = 0;
    }

    public performAction(target: TargetableEntity): void {
        this.finished();
    }

    public onEnter(options: Record<string, any>): void {
        super.onEnter(options);
        this.inDaBarrel= 4;
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

        if (this.inDaBarrel == 0) {
            this.performAction(this.target);
            return;
        }

        if (this.timer.isStopped()) {
            if (this.inDaBarrel > 0) {
                this.attack();
                this.actor.animation.play("ATTACKING_RIGHT", false);
                this.actor.animation.queue("WALK", true);
                this.inDaBarrel -= 1;
                //had to check if more or else timer kept bein funky
                if (this.inDaBarrel > 0) {
                    this.timer.reset();
                    this.timer.start();
                }
            }

        }
        else {
            this.actor.animation.playIfNotAlready("ATTACKING_RIGHT", false);
        }
    }

    public attack() {
        let scene = this.actor.getScene() as MainSMScene;
        let aim = this.actor.position.dirTo(this.target.position);
        if (aim.x < 0) {
            this.actor.invertX = false;
        }
        else {
            this.actor.invertX = true;
        }
        let bloom = new Vec2(aim.x * (1 + Math.random() * 0.2), aim.y * (1 - Math.random() * 0.2))
        scene.spawnEnemyShot(this.actor.position.clone(), bloom, "pigeon");
    }

    public onExit(): Record<string, any> {
        this.timer.reset();
        this.inDaBarrel = 0;
        return super.onExit();
    }

}