import AABB from "../../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode, { TweenableProperties } from "../../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../../../Wolfie2D/Nodes/Graphics/Line";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import Color from "../../../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../../../Wolfie2D/Utils/EaseFunctions";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";

//Change to reflect goo shot, etc can reuse if lack of time
export default class DaNeedle extends Item {

    public damage: number;
    //protected _needle: Sprite
    protected _direction: Vec2;

    public constructor(sprite: Sprite) {
        super(sprite);
/*         this._needle.tweens.add("spin", {
            startDelay: 0,
            duration: 300,
            effects: [
                {
                    property: TweenableProperties.alpha,
                    start: 0,
                    end: Math.PI,
                    ease: EaseFunctionType.OUT_SINE
                }
            ],
            onEnd: "Needle spun"
        });
        this._direction = Vec2.ZERO; */
    }

    //public static create(sprite: Sprite, needle: Item): DaNeedle {
    //    return new DaNeedle(sprite, needle);
    //}

    public get direction(): Vec2 { return this._direction; }
    //public get laserStart(): Vec2 { return this._laser.start; }
    //public get laserEnd(): Vec2 { return this._laser.end; }

    //public playShootAnimation(): void { this._laser.tweens.play("fade"); }
    
}