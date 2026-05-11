import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import PlayerActor from "../../../Actors/PlayerActor";
import { AbilityEvent } from "../../../Events";

//Gives ability to rummage through objects, also speed boost x1.1
//Just check if have, then box will open if interact 
//BOSS ITEM
export default class RaccoonTail extends Item {
    
    protected _speedBoost: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._speedBoost = 1.1;
        this._isAbility = true;
        this._description = "Search ability + 10% speed";
        this._cooldownDuration = 8000;
        this.equippableOffset = new Vec2(-28, 5);
        this.value = 3000;
    }

    public get speedBoost(): number { return this._speedBoost;}
    public set speedBoost(boost: number) { this._speedBoost = boost; }

    public override applyBuff(player: PlayerActor) {
        player.speed *= this._speedBoost;
    }
    public override removeBuff(player: PlayerActor) {
        player.speed /= this._speedBoost;
    }

    public override useAbility(player: PlayerActor): void {
        this.emitter.fireEvent(AbilityEvent.OPEN_TREASURE);
    }
}