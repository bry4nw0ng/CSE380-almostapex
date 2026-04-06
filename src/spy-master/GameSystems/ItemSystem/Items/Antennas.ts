import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";

//Idk this feels odd, is just going to be if has, then has invulnerability, filter out of array, then no invulnerability
export default class Antennas extends Item {

    public constructor(sprite: Sprite) {
        super(sprite);
    }
}