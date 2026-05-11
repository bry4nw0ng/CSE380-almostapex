import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import Idle from "../NPCActions/GotoAction";
import ShootLaserGun from "../NPCActions/ShootLaserGun";
import BasicFinder from "../../../GameSystems/Searching/BasicFinder";
import { BattlerActiveFilter, EnemyFilter, ItemFilter, RangeFilter, VisibleItemFilter } from "../../../GameSystems/Searching/SMFilters";
import Item from "../../../GameSystems/ItemSystem/Item";
import PickupItem from "../NPCActions/PickupItem";
import { ClosestPositioned, ClosestByPath } from "../../../GameSystems/Searching/SMReducers";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import LaserGun from "../../../GameSystems/ItemSystem/Items/LaserGun";
import { TargetExists } from "../NPCStatuses/TargetExists";
import { HasItem } from "../NPCStatuses/HasItem";
import FalseStatus from "../NPCStatuses/FalseStatus";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GoapAction from "../../../../Wolfie2D/AI/Goap/GoapAction";
import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import SMScene from "../../../Scenes/SMScene";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import { BattlerEvent } from "../../../Events";

export default class RaccoonBehavior extends NPCBehavior {

    /** The target the guard should guard */
    protected target: TargetableEntity;
    /** The range the guard should be from the target they're guarding to be considered guarding the target */
    protected range: number;

    protected switchTimer: Timer;
    protected attackStrategy: string;

    /** Initialize the NPC AI */
    public initializeAI(owner: NPCActor, options: GuardOptions): void {
        super.initializeAI(owner, options);

        // Initialize the targetable entity the guard should try to protect and the range to the target
        this.target = options.target
        this.range = options.range;

        this.switchTimer = new Timer(1500, () => this.attack(), false);

        // Initialize guard statuses
        this.initializeStatuses();
        // Initialize guard actions
        this.initializeActions();
        // Set the guards goal
        this.goal = GuardStatuses.GOAL;

        // Initialize the guard behavior
        this.initialize();

        this.switchTimer.start();
    }

    public handleEvent(event: GameEvent): void {
        switch(event.type) {
            default: {
                super.handleEvent(event);
                break;
            }
        }
    }

    public update(deltaT: number): void { //IMPORTANT
        super.update(deltaT);

        if (this.owner.health <= 0) {
            this.switchTimer.pause();
            this.owner.animation.playIfNotAlready("DYING", false);
            this.emitter.fireEvent(BattlerEvent.BATTLER_KILLED, {id: this.owner.id});
            this.owner.visible = false;
        }
    }

    protected initializeStatuses(): void {
        this.addStatus(GuardStatuses.GOAL, new FalseStatus());
    }

    //Doesnt do nothin, trying to acclimate myself to GOAP in the shooter logic
    protected initializeActions(): void {
        let scene = this.owner.getScene() as SMScene;
        let gitEm = new Idle(this, this.owner);
        gitEm.targets = [this.target];
        gitEm.targetFinder = new BasicFinder();
        gitEm.addEffect(GuardStatuses.GOAL);
        gitEm.cost = 1;
        this.addState(GuardActions.GUARD, gitEm);
    }

    public attack() {
        let dist = this.owner.position.distanceTo(this.target.position);
        console.log("Raccoon attack() fired, dist to player:", dist);
        
        let scene = this.owner.getScene() as SMScene;
        if (this.owner.position.distanceTo(this.target.position) > 1000) {
            this.switchTimer.start();
            return;
        }
        let choice = Math.random();
        if (choice > 0.5) {
            this.attackStrategy = "spray";
        }
        else {
            this.attackStrategy = "aim"
        }

        this.switchTimer.start();
        this.owner.animation.play("ATTACK", false);

        if (this.attackStrategy == "spray") {
            console.log("Sprayed");
            for (let i = 0; i <= 20; i++) {
                let angle = Math.random() * Math.PI * 2;
                let aim = new Vec2(Math.cos(angle), Math.sin(angle));
                scene.spawnEnemyShot(this.owner.position.clone(), aim, "raccoon");
            }
        }
        else if (this.attackStrategy == "aim") {
            console.log("Aimed");
            let aim = this.owner.position.dirTo(this.target.position);
            for (let i = 0; i <= 10; i++) {
                let bloom = new Vec2(aim.x * (1 + Math.random() * 0.1), aim.y * (1 - Math.random() * 0.1))
                scene.spawnEnemyShot(this.owner.position.clone(), bloom, "raccoon");
            }

        }
        else {
            console.log("DOOMERROR: Attack type invalid")
        }

    }

    public override addState(stateName: GuardAction, state: GoapAction): void {
        super.addState(stateName, state);
    }

    public override addStatus(statusName: GuardStatus, status: GoapState): void {
        super.addStatus(statusName, status);
    }
}

export interface GuardOptions {
    target: TargetableEntity
    range: number;
}

export type GuardStatus = typeof GuardStatuses[keyof typeof GuardStatuses];
export const GuardStatuses = {

    ENEMY_IN_GUARD_POSITION: "enemy-at-guard-position",

    GOAL: "goal"

} as const;

export type GuardAction = typeof GuardActions[keyof typeof GuardActions];
export const GuardActions = {

    SHOOT_ENEMY: "shoot-enemy",

    GUARD: "guard",

    SPRAY: "spray"

} as const;

