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
import NavigationPath from "../../../../Wolfie2D/Pathfinding/NavigationPath";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import Navmesh from "../../../../Wolfie2D/Pathfinding/Navmesh";
import SMScene from "../../../Scenes/SMScene";


export default class GuardBehavior extends NPCBehavior {

    /** The target the guard should guard */
    protected target: TargetableEntity;
    /** The range the guard should be from the target they're guarding to be considered guarding the target */
    protected range: number;

    protected scene: SMScene;

    protected pathToPlayer: NavigationPath;
    protected resetPathTimer: Timer;
    protected resetTime: boolean;

    /** Initialize the NPC AI */
    public initializeAI(owner: NPCActor, options: GuardOptions): void {
        super.initializeAI(owner, options);

        // Initialize the targetable entity the guard should try to protect and the range to the target
        this.target = options.target
        this.range = options.range;

        this.scene = this.owner.getScene();

        this.resetTime = false;
        this.pathToPlayer = this.scene.getNavmesh().getNavigationPath(this.owner.position, this.target.position);
        this.resetPathTimer = new Timer(800, () => this.resetPath(), false);

        // Initialize guard statuses
        this.initializeStatuses();
        // Initialize guard actions
        this.initializeActions();
        // Set the guards goal
        this.goal = GuardStatuses.GOAL;

        // Initialize the guard behavior
        this.initialize();
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
        
        if (this.scene.isTargetVisible(this.owner.position, this.target.position)) {
            let dir = this.owner.position.dirTo(this.target.position);
            this.owner.move(dir.scaled(this.owner.speed * deltaT));
            this.owner.animation.playIfNotAlready("WALK", true);
        }
        else {
            if (this.resetPathTimer.isStopped()) {
                this.resetPathTimer.start();
            }
            console.log("path done?", this.pathToPlayer?.isDone(), "path null?", !this.pathToPlayer);
            if (this.pathToPlayer && this.pathToPlayer.isDone) {
                this.owner.moveOnPath(this.owner.speed, this.pathToPlayer);
                this.pathToPlayer.handlePathProgress(this.owner);
                this.owner.animation.playIfNotAlready("WALK", true);
            }
        }

    }
    protected resetPath(): void {
        let navmesh = this.scene.getNavmesh();
        this.pathToPlayer = navmesh.getNavigationPath(this.owner.position, this.target.position);
        if (!(this.scene.isTargetVisible(this.owner.position, this.target.position))) {
            this.resetPathTimer.start();
        }
    }

    protected initializeStatuses(): void {
        this.addStatus(GuardStatuses.GOAL, new FalseStatus());
    }

    protected initializeActions(): void {
        let gitEm = new Idle(this, this.owner);
        gitEm.targets = [this.target];
        gitEm.targetFinder = new BasicFinder();
        gitEm.addEffect(GuardStatuses.GOAL);
        gitEm.cost = 1;
        this.addState(GuardActions.GUARD, gitEm);

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

    HAS_WEAPON: "has-weapon",

    LASERGUN_EXISTS: "laser-gun-exists",

    GOAL: "goal"

} as const;

export type GuardAction = typeof GuardActions[keyof typeof GuardActions];
export const GuardActions = {

    SHOOT_ENEMY: "shoot-enemy",

    GUARD: "guard",

    SPRAY: "spray"

} as const;

