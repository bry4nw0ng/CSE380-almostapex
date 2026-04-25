import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";

export default class Healthpack extends Item {
    
    protected hp: number;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._description = "Restores 5 HP";
        this.hp = 5;
        this.value = 500;
        this._maxStack = 10;
    }

    public get health(): number { return this.hp; }
    public set health(hp: number) { this.hp = hp; }


}