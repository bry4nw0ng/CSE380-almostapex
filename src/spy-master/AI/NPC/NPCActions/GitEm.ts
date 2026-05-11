import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import NPCAction from "./NPCAction";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import NavigationPath from "../../../../Wolfie2D/Pathfinding/NavigationPath";
import SMScene from "../../../Scenes/SMScene";

export default class ShootEm extends NPCAction {

    protected pathToPlayer: NavigationPath | null;
    protected scene: SMScene;
    
    public constructor(parent: NPCBehavior, actor: NPCActor) {
        super(parent, actor);
        this._target = null;
        this.pathToPlayer = null;
    }

    public performAction(target: TargetableEntity): void {
        this.finished();
    }

    public onEnter(options: Record<string, any>): void {
        super.onEnter(options);
        this.scene = this.actor.getScene() as SMScene;
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
        let dist = this.actor.position.distanceTo(this.target.position);

        //Send back to goap, cuz close enough
        if (dist <= 150) {
            this.finished();
            return;
        }

        //copied from guardbehavior
        if (dist < 250) {
        //if (this.scene.isTargetVisible(this.actor.position, this.target.position)) {
            let dir = this.actor.position.dirTo(this.target.position);
            if (dir.x < 0) {
                this.actor.invertX = false;
            }
            else {
                this.actor.invertX = true;
            }
            this.actor.move(dir.scaled(this.actor.speed * deltaT));
            return;
        }
        else {
            if (!this.pathToPlayer || this.pathToPlayer.isDone()) {
                
                this.pathToPlayer = this.scene.getNavmesh().getNavigationPath(this.actor.position, this.target.position);
            }
            if (this.pathToPlayer && !this.pathToPlayer.isDone()) {
                this.actor.moveOnPath(this.actor.speed * deltaT, this.pathToPlayer);
            }
        }
    }

    public onExit(): Record<string, any> {
        this.pathToPlayer = null;
        return super.onExit();
    }

}