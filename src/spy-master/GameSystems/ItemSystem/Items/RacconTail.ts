import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import Timer from "../../../../Wolfie2D/Timing/Timer";

//Gives ability to rummage through objects (IMPORTANT: implement dumpster for level one so can look after complete), also speed boost x1.1
//Just check if have, then box will open if interact 
//BOSS ITEM
export default class RaccoonTail extends Item {
    
    protected _speedBoost: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._speedBoost = 1.1;
    }

    public get speedBoost(): number { return this._speedBoost;}
    public set speedBoost(boost: number) { this._speedBoost = boost; }
}