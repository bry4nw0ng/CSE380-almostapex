import Positioned from "../../../Wolfie2D/DataTypes/Interfaces/Positioned";
import Battler from "../BattleSystem/Battler";
import { TargetableEntity } from "../Targeting/TargetableEntity";
import NPCActor from "../../Actors/NPCActor";

export function ClosestPositioned<P extends Positioned>(positioned: Positioned): (p1: P, p2: P) => P {
    return (p1: P, p2: P): P => { 
        return p1.position.distanceSqTo(positioned.position) < p2.position.distanceSqTo(positioned.position) ? p1 : p2;
    }
}

export function ClosestByPath<P extends TargetableEntity>(actor: NPCActor): (p1: P, p2: P) => P {
    return (p1: P, p2: P): P => {
        let path1 = actor.getPath(actor.position, p1.position);
        let path2 = actor.getPath(actor.position, p2.position);
        return path1.getPathSize() <= path2.getPathSize() ? p1 : p2;
    }
}

export function LowestHealthBattler(b1: Battler, b2: Battler): Battler {
    return b1.health < b2.health ? b1 : b2
}