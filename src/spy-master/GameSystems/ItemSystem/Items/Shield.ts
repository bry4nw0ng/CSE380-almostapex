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
        this._description = "Reduces damage taken by 15%";
        this._damageReduction = 0.85;
        this.value = 300;
        this.equippableOffset = new Vec2(12, 7);
        this._maxStack = 10;
    }

    public get damageReduction(): number { return this._damageReduction; }
    public set damageReduction(boost: number) { this._damageReduction = boost; }

    public override applyBuff(player: PlayerActor) {
        player.damageReduction *= this._damageReduction;
    }
    public override removeBuff(player: PlayerActor) {
        player.damageReduction /= this._damageReduction;
    }
}