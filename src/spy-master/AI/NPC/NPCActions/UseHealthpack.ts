import GameEvent from "../../../../Wolfie2D/Events/GameEvent";
import Battler from "../../../GameSystems/BattleSystem/Battler";
import Healthpack from "../../../GameSystems/ItemSystem/Items/Healthpack";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";
import NPCBehavior from "../NPCBehavior";
import NPCAction from "./NPCAction";
import Finder from "../../../GameSystems/Searching/Finder";


export default class UseHealthpack extends NPCAction {
    
    // The targeting strategy used for this GotoAction - determines how the target is selected basically
    protected override _targetFinder: Finder<Battler>;
    // The targets or Targetable entities 
    protected override _targets: Battler[];
    // The target we are going to set the actor to target
    protected override _target: Battler | null;

    public constructor(parent: NPCBehavior, actor: NPCActor) { 
        super(parent, actor);
    }

    public override update(deltaT: number): void {
        if (this._target !== null && this._target.health >= this._target.maxHealth / 2) {
            this.finished();
            return;
        }
        super.update(deltaT);
    }

    public performAction(target: Battler): void {
        let hpack = this.actor.inventory.find(item => item instanceof Healthpack);
        if (hpack !== null) {
            target.health += (hpack as Healthpack).health;
            this.actor.inventory.remove(hpack.id);
        }
        this.finished();
    }

}