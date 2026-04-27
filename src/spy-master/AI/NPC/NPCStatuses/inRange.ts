import GoapState from "../../../../Wolfie2D/AI/Goap/GoapState";
import Finder from "../../../GameSystems/Searching/Finder";
import { TargetableEntity } from "../../../GameSystems/Targeting/TargetableEntity";
import NPCActor from "../../../Actors/NPCActor";

export class inRange extends GoapState {
    
    protected owner: NPCActor;
    protected target: TargetableEntity;
    protected range: number;

    public constructor(owner: NPCActor, target: TargetableEntity, range: number) {
        super()

        this.target = target;
        this.owner = owner
        this.range = range;
    }

    public isSatisfied(): boolean {
        if (this.owner.position.distanceTo(this.target.position) < 160) {
            return true;
        }
        return false;
    }

}