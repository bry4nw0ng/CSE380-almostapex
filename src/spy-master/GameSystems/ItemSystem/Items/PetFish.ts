import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";

export default class PetFish extends Item {
    
    protected _speedBoost: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._description = "Increase Player Speed by 15%";
        this._speedBoost = 1.15;
        this.value = 400;
        this.equippableOffset = new Vec2(18, -8);
        this._maxStack = 10;
    }

    public get speedBoost(): number { return this._speedBoost; }
    public set speedBoost(boost: number) { this._speedBoost = boost; }

    public override applyBuff(player: PlayerActor) {
        player.speedBoost *= this._speedBoost;
    }
    public override removeBuff(player: PlayerActor) {
        player.speedBoost /= this._speedBoost;
    }
}