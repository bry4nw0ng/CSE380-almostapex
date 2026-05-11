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
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import { BattlerEvent } from "../../../Events";
import SMScene from "../../../Scenes/SMScene";

//Mainly copied from raccoon behavior (which was copied from guardbehavior lol)
export default class SharkBehavior extends NPCBehavior {

    /** The target the guard should guard */
    protected target: TargetableEntity;
    /** The range the guard should be from the target they're guarding to be considered guarding the target */
    protected range: number;

    protected orbitSpeed: number;
    protected radiusToPlayer: number;
    protected curAngle: number;

    protected diveTo: Vec2;

    //Will change depending on the phase of the fight
    protected chargeTime: number;
    protected startAttackTime: number;
    protected bubbleTime: number;
    protected diveSpeed: number;

    protected chargeTimer: Timer;
    //protected cooldownTimer: Timer;
    protected startAttackTimer: Timer;
    protected shootingTimer: Timer;
    protected indieBubbleTimer: Timer;
    protected diveMissedTimer: Timer;

    protected coolingDown: boolean;

    protected curState: string;

    protected phase: number;


    /** Initialize the NPC AI */
    public initializeAI(owner: NPCActor, options: SharkOptions): void {
        super.initializeAI(owner, options);

        // Initialize the targetable entity the guard should try to protect and the range to the target
        this.target = options.target
        this.range = options.range;

        this.orbitSpeed = 1.5;
        this.radiusToPlayer = 200;
        this.curAngle= 0;

        this.diveTo = Vec2.ZERO;

        this.startAttackTime = 1250;
        this.chargeTime = 800;
        this.bubbleTime = 150;
        this.diveSpeed = 300;

        this.phase = 1;

        this.chargeTimer = new Timer(this.chargeTime, () => {
            if (this.curState != SharkState.CHARGE) {
                return;
            }
            let choice = Math.random();
            if (choice > 0.5) {
                this.curState = SharkState.DIVE;
                let dirToPlayer = this.owner.position.dirTo(this.target.position);
                //diveTo the owner's position + direction to player + 2*rad (since i want him to dive to other end of orbit)
                this.diveTo = new Vec2(
                    this.owner.position.x + dirToPlayer.x  * 2 * this.radiusToPlayer,
                    this.owner.position.y + dirToPlayer.y * 2  * this.radiusToPlayer
                );
                this.owner.rotation = Math.atan2(dirToPlayer.y, dirToPlayer.x);
                this.diveMissedTimer.start();
            }
            else {
                this.curState = SharkState.SHOOT;
                this.indieBubbleTimer.start();
                this.shootingTimer.start();
            }
        }, false);

        this.shootingTimer = new Timer(1500, () => {
            if (this.curState != SharkState.SHOOT) {
                return;
            }
            this.indieBubbleTimer.pause();
            this.curState = SharkState.ORBIT;

            this.startAttackTimer = new Timer(this.newRandomAttackTime(), () => {
                this.curState = SharkState.CHARGE;
                this.chargeTimer.start();
            }, false);

            this.startAttackTimer.start();
        });

        this.indieBubbleTimer = new Timer(this.bubbleTime, () => {
            //Will have to change to ocean
            let scene = this.owner.getScene() as SMScene;
            let aim = this.owner.position.dirTo(this.target.position);
            let bloom = new Vec2(aim.x * (1 + Math.random() * 0.2), aim.y * (1 - Math.random() * 0.2))
            //IMPORTANT CHANGE FOR OCEAN
            scene.spawnEnemyShot(this.owner.position.clone(), bloom, "raccoon");
        }, true);

        //If missed, restarts and goes back on orbit
        this.diveMissedTimer = new Timer(2000, () => {
            if (this.curState != SharkState.DIVE) return;
            this.curAngle = Math.atan2(
                this.owner.position.y - this.target.position.y,
                this.owner.position.x - this.target.position.x
            );
            this.curState = SharkState.ORBIT;
            this.startAttackTimer.start(this.newRandomAttackTime());
        }, false);

/*         this.startAttackTimer = new Timer(this.startAttackTime, () => {
            this.curState = SharkState.CHARGE;
            this.chargeTimer.start();
        }, false); */

        this.coolingDown = false;
        
        this.startAttackTimer.start();
        this.curState = SharkState.ORBIT;

        // Initialize guard statuses
        this.initializeStatuses();
        // Initialize guard actions
        this.initializeActions();
        // Set the guards goal
        this.goal = SharkStatuses.GOAL;

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

        if (this.phase == 1 && this.owner.health <= this.owner.maxHealth * 0.3) {
            this.phase++;
            this.diveSpeed = 500;
            this.chargeTime = 400;
            this.bubbleTime = 75;
            this.startAttackTime = 750;
        }
        else if (this.phase == 2 && this.owner.health <= 0) {
            //this..pause();
            this.curState = SharkState.DYING;
        }

        switch (this.curState) {
            case SharkState.ORBIT: {
                this.curAngle += this.orbitSpeed * deltaT;

                //Finds loc to move to on orbit radius since we can't move like DaNeedle
                let goTo = new Vec2(this.target.position.x + (
                    this.radiusToPlayer * Math.cos(this.curAngle)),
                    this.target.position.y + (this.radiusToPlayer * Math.sin(this.curAngle))
                )

                //Finds direction to of that loc
                let dirToMove = new Vec2(
                    goTo.x - this.owner.position.x,
                    goTo.y - this.owner.position.y
                ).normalized();

                //Had to look up, said linear speed in point of circle = this.orbitSpeed * this.radiusToPlayer
                this.owner.move(dirToMove.scaled(deltaT * this.orbitSpeed * this.radiusToPlayer));

                let dirToPlayer = new Vec2(
                    this.target.position.x - this.owner.position.x,
                    this.target.position.y - this.owner.position.y,
                );

                this.owner.rotation = Math.atan2(dirToPlayer.y, dirToPlayer.x);

                break;
            }
            case SharkState.CHARGE: {
                let dirToPlayer = new Vec2(
                    this.target.position.x - this.owner.position.x,
                    this.target.position.y - this.owner.position.y
                );
                this.owner.rotation = Math.atan2(dirToPlayer.y, dirToPlayer.x);
                //need charge ani
                this.owner.animation.playIfNotAlready("IDLE", true);
                break;
            }
            case SharkState.DIVE: {
                let dirX = this.diveTo.x - this.owner.position.x;
                let dirY = this.diveTo.y - this.owner.position.y;

                let distToDive = Math.sqrt(dirX*dirX + dirY*dirY);
                let scaledMoveDirection = new Vec2(this.diveSpeed * dirX / distToDive * deltaT, this.diveSpeed * dirY / distToDive * deltaT)
                this.owner.move(scaledMoveDirection);
                
                //play dive ani
                break;
            }
            case SharkState.SHOOT: {
                let dirToPlayer = new Vec2(
                    this.target.position.x - this.owner.position.x,
                    this.target.position.y - this.owner.position.y
                );
                this.owner.rotation = Math.atan2(dirToPlayer.y, dirToPlayer.x);
                break;
            }
            case SharkState.DYING: {
                this.owner.animation.playIfNotAlready("DYING", false);
                this.emitter.fireEvent(BattlerEvent.BATTLER_KILLED, {id: this.owner.id});
                this.owner.visible = false;
                break;
            }
            default: {
                return;
                //throw new Error("Unhandled State of Doom at SharkBehavior");
            }
                
        } 
    }

    protected newRandomAttackTime() {
        return this.startAttackTime + Math.random() * this.startAttackTime;
    }

    protected initializeStatuses(): void {
        this.addStatus(SharkStatuses.GOAL, new FalseStatus());
    }

    //Doesnt do nothin, trying to acclimate myself to GOAP in the shooter logic
    protected initializeActions(): void {
        let scene = this.owner.getScene() as SMScene;
        let gitEm = new Idle(this, this.owner);
        gitEm.targets = [this.target];
        gitEm.targetFinder = new BasicFinder();
        gitEm.addEffect(SharkStatuses.GOAL);
        gitEm.cost = 1;
        this.addState(SharkActions.SPIN, gitEm);
    }

    //For this attack will be the shoot state
    public shoot() {
        let dist = this.owner.position.distanceTo(this.target.position);
        //Will have to change
        let scene = this.owner.getScene() as SMScene;
        //this.switchTimer.start();
        //this.owner.animation.play("ATTACK", false);

        if (this.curState = SharkState.DIVE) {
            for (let i = 0; i <= 20; i++) {
                let angle = Math.random() * Math.PI * 2;
                let aim = new Vec2(Math.cos(angle), Math.sin(angle));
                scene.spawnEnemyShot(this.owner.position.clone(), aim, "raccoon");
            }
        }
        else if (this.curState = SharkState.SHOOT) {
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

    public override addState(stateName: SharkAction, state: GoapAction): void {
        super.addState(stateName, state);
    }

    public override addStatus(statusName: SharkStatus, status: GoapState): void {
        super.addStatus(statusName, status);
    }
}
//I recognize that literally every one of my strategies for making enemy behavior is different, but I am certaintly not going back and changing each 
const SharkState = {
    ORBIT: "ORBIT",
    SHOOT: "SHOOT",
    CHARGE: "CHARGE",
    DIVE: "DIVE",
    DYING: "DYING"
} as const;

//I wont actually be using any of these for time's sake
export interface SharkOptions {
    target: TargetableEntity
    range: number;
}

export type SharkStatus = typeof SharkStatuses[keyof typeof SharkStatuses];
export const SharkStatuses = {

    ENEMY_IN_GUARD_POSITION: "enemy-at-guard-position",

    GOAL: "goal"

} as const;

export type SharkAction = typeof SharkActions[keyof typeof SharkActions];
export const SharkActions = {
    SPIN: "spin",

    SPRAY: "spray",

    CHARGE: "charge"

} as const;

