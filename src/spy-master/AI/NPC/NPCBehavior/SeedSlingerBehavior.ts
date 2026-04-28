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
import ShootEm from "../NPCActions/ShootEm";
import GitEm from "../NPCActions/GitEm";
import { inRange } from "../NPCStatuses/inRange";

export default class SeedSlingerBehavior extends NPCBehavior {

    /** The target the guard should guard */
    protected target: TargetableEntity;
    /** The range the guard should be from the target they're guarding to be considered guarding the target */
    protected range: number;

    /** Initialize the NPC AI */
    public initializeAI(owner: NPCActor, options: GuardOptions): void {
        super.initializeAI(owner, options);

        this.target = options.target
        this.range = options.range;

        this.initializeStatuses();

        this.initializeActions();

        this.goal = SeedSlingerStatuses.GOAL;

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

    public update(deltaT: number): void {
        super.update(deltaT);
    }

    protected initializeStatuses(): void {
        let scene = this.owner.getScene();

        this.addStatus(SeedSlingerStatuses.CLOSE_ENOUGH, new inRange(this.owner, this.target, 150));
        this.addStatus(SeedSlingerStatuses.GOAL, new FalseStatus());
    }

    protected initializeActions(): void {

        let scene = this.owner.getScene();

        // An action for shooting an enemy in the guards guard area
        let gitem = new GitEm(this, this.owner);
        gitem.targets = [this.target];
        gitem.targetFinder = new BasicFinder();
        gitem.addEffect(SeedSlingerStatuses.CLOSE_ENOUGH);
        gitem.cost = 1;
        this.addState(SeedSlingerActions.GITEM, gitem);

        let shootEnemy = new ShootEm(this, this.owner);
        shootEnemy.targets = [this.target];
        shootEnemy.targetFinder = new BasicFinder();
        shootEnemy.addPrecondition(SeedSlingerStatuses.CLOSE_ENOUGH);
        shootEnemy.addEffect(SeedSlingerStatuses.GOAL);
        shootEnemy.cost = 1;
        this.addState(SeedSlingerActions.SHOOT_ENEMY, shootEnemy);

    }

    public override addState(stateName: SeedSlingerAction, state: GoapAction): void {
        super.addState(stateName, state);
    }

    public override addStatus(statusName: SeedSlingerStatus, status: GoapState): void {
        super.addStatus(statusName, status);
    }
}

export interface GuardOptions {
    target: TargetableEntity
    range: number;
}

export type SeedSlingerStatus = typeof SeedSlingerStatuses[keyof typeof SeedSlingerStatuses];
export const SeedSlingerStatuses = {

    CLOSE_ENOUGH: "close_enough",

    GOAL: "goal"

} as const;

export type SeedSlingerAction = typeof SeedSlingerActions[keyof typeof SeedSlingerActions];
export const SeedSlingerActions = {

    SHOOT_ENEMY: "shoot-enemy",

    GITEM: "git-em",

} as const;

