import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";

//Invulnerable for next hit, remove item on hit
export default class Antennas extends Item {

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isPassive = true;
        this._equippableOffset = new Vec2(0,0);
    }

    public override applyBuff(player: PlayerActor) {
        player.toggleInvincible();
    }
    public override removeBuff(player: PlayerActor) {
        player.toggleInvincible();
    }
}