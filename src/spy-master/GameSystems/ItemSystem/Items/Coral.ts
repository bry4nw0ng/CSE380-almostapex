import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";

//Damage reduction
export default class Coral extends Item {
    
    protected _fireRate: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._description = "Increases Fire Rate by 10%";
        this._fireRate = 1.1;
        this.value = 300;
        this.equippableOffset = new Vec2(-15, 4);
        this._maxStack = 10;
    }

    public get fireRate(): number { return this._fireRate; }
    public set fireRate(boost: number) { this._fireRate = boost; }

    public override applyBuff(player: PlayerActor) {
        player.fireRate *= this._fireRate;
    }
    public override removeBuff(player: PlayerActor) {
        player.fireRate /= this._fireRate;
    }
}