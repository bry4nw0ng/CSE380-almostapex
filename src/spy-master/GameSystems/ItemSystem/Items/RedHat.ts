import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";
import BasicBattler from "../../BattleSystem/BasicBattler";

export default class RedHat extends Item {
    
    protected _luckBoost: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._luckBoost = 1.1;
    }

    public get luckBoost(): number { return this._luckBoost; }
    public set luckBoost(boost: number) { this._luckBoost = boost; }

    public override applyBuff(player: PlayerActor) {
        player.luck = this._luckBoost;
    }
    public override removeBuff(player: PlayerActor) {
        player.luck = 1;
    }

}