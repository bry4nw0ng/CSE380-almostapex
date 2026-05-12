import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";

//Damage reduction
export default class Kelpstache extends Item {
    
    protected _damageIncrease: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._description = "Increases Damage Dealt by 20%";
        this._damageIncrease = 1.2;
        this.value = 300;
        this.equippableOffset = new Vec2(12, 7);
        this._maxStack = 10;
    }

    public get damageIncrease(): number { return this._damageIncrease; }
    public set damageIncrease(boost: number) { this._damageIncrease = boost; }

    public override applyBuff(player: PlayerActor) {
        player.damageIncrease *= this._damageIncrease;
    }
    public override removeBuff(player: PlayerActor) {
        player.damageIncrease /= this._damageIncrease;
    }
}