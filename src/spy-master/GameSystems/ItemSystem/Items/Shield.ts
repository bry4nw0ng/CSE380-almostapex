import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";

//Damage reduction
export default class Shield extends Item {
    
    protected _damageReduction: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._description = "Reduces damage taken by 20%";
        this._damageReduction = 0.8;
    }

    public get luckBoost(): number { return this._damageReduction; }
    public set luckBoost(boost: number) { this._damageReduction = boost; }

    public override applyBuff(player: PlayerActor) {
        player.damageReduction = this._damageReduction;
    }
    public override removeBuff(player: PlayerActor) {
        player.damageReduction = 1;
    }
}