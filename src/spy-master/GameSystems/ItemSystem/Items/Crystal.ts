import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Item from "../Item";

export default class Crystal extends Item {
    
    protected _value: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._description = "Maybe there is someone who values these highly...";
        this._value = Math.floor(Math.random()* 32);
    }

    public get value(): number { return this._value; }
    public set value(val: number) { this._value = val; }

}