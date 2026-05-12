import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";

//Damage reduction
export default class ShellSpecs extends Item {
    
    protected _shotSpeed: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._description = "Increases Spitball Velocity by 20%";
        this._shotSpeed = 1.2;
        this.value = 300;
        this.equippableOffset = new Vec2(11, 5);
        this._maxStack = 10;
    }

    public get shotSpeed(): number { return this._shotSpeed; }
    public set shotSpeed(boost: number) { this._shotSpeed = boost; }

    public override applyBuff(player: PlayerActor) {
        player.shotSpeed *= this._shotSpeed;
    }
    public override removeBuff(player: PlayerActor) {
        player.shotSpeed /= this._shotSpeed;
    }
}