import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import BasicFinder from "../../../GameSystems/Searching/BasicFinder";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import FalseStatus from "../NPCStatuses/FalseStatus";
import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import GoapAction from "../../../../Wolfie2D/AI/Goap/GoapAction";
import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";
import DiveAtEm from "../NPCActions/DiveAtEm";
import GitEm from "../NPCActions/GitEm";
import { inRange } from "../NPCStatuses/inRange";

export default class CrabBehavior extends NPCBehavior {

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

        this.goal = CrabStatuses.GOAL;

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

        this.addStatus(CrabStatuses.CLOSE_ENOUGH, new inRange(this.owner, this.target, 150));
        this.addStatus(CrabStatuses.GOAL, new FalseStatus());
    }

    protected initializeActions(): void {
        // An action for diveAting an enemy in the guards guard area
        let gitem = new GitEm(this, this.owner);
        gitem.targets = [this.target];
        gitem.targetFinder = new BasicFinder();
        gitem.addEffect(CrabStatuses.CLOSE_ENOUGH);
        gitem.cost = 1;
        this.addState(CrabActions.GITEM, gitem);

        let diveAtEnemy = new DiveAtEm(this, this.owner);
        diveAtEnemy.targets = [this.target];
        diveAtEnemy.targetFinder = new BasicFinder();
        diveAtEnemy.addPrecondition(CrabStatuses.CLOSE_ENOUGH);
        diveAtEnemy.addEffect(CrabStatuses.GOAL);
        diveAtEnemy.cost = 1;
        this.addState(CrabActions.DIVE_AT_ENEMY, diveAtEnemy);

    }

    public override addState(stateName: CrabAction, state: GoapAction): void {
        super.addState(stateName, state);
    }

    public override addStatus(statusName: CrabStatus, status: GoapState): void {
        super.addStatus(statusName, status);
    }
}

export interface GuardOptions {
    target: TargetableEntity
    range: number;
}

export type CrabStatus = typeof CrabStatuses[keyof typeof CrabStatuses];
export const CrabStatuses = {

    CLOSE_ENOUGH: "close_enough",

    GOAL: "goal"

} as const;

export type CrabAction = typeof CrabActions[keyof typeof CrabActions];
export const CrabActions = {

    DIVE_AT_ENEMY: "diveAt-enemy",

    GITEM: "git-em",

} as const;

