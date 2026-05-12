import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";

//Damage reduction
export default class SlimeStorage extends Item {
    
    protected _shotSize: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._description = "Increases Spitball Size by 20%";
        this._shotSize = 1.2;
        this.value = 300;
        this.equippableOffset = new Vec2(-7, 7);
        this._maxStack = 10;
    }

    public get shotSize(): number { return this._shotSize; }
    public set shotSize(boost: number) { this._shotSize = boost; }

    public override applyBuff(player: PlayerActor) {
        player.shotSize *= this._shotSize;
    }
    public override removeBuff(player: PlayerActor) {
        player.shotSize /= this._shotSize;
    }
}