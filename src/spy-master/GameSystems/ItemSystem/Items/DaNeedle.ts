import AABB from "../../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode, { TweenableProperties } from "../../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import { EaseFunctionType } from "../../../../Wolfie2D/Utils/EaseFunctions";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import PlayerActor from "../../../Actors/PlayerActor";
import { ItemEvent } from "../../../Events";
import Timer from "../../../../Wolfie2D/Timing/Timer";

//Change to reflect goo shot, etc can reuse if lack of time
export default class DaNeedle extends Item {

    public damage: number;
    protected _needle: Sprite;

    protected _isSpinning: boolean;
    protected _radiusToPlayer: number;
    protected _curAngle: number;
    protected _spinTimer: Timer;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isWeapon = true;
        this._description = "Spin attack - 5 damage";
        this._needle = sprite;
        //this.equippableOffset = new Vec2(-10, 10);
        this._needle.scale = new Vec2(2, 2);
        this.radiusToPlayer = 50;
        this._curAngle = 0;
        this._needle.rotation = -1 * Math.PI / 1.8;
        this._spinTimer = new Timer(1000, () => {this._isSpinning = false, this._needle.rotation = -1 * Math.PI / 1.8}, false);
        this._equippableOffset = new Vec2(20, 10);

        this._needle.alpha = .8;
        //This seemed really lame, changed it to spinning around player, wasted a disgusting amount of extra time
/*         this._needle.tweens.add("spin", {
            startDelay: 0,
            duration: 300,
            effects: [
                {
                    property: TweenableProperties.rotation,
                    start: Math.PI / 3,
                    end: 2 * Math.PI + Math.PI / 3,
                    ease: EaseFunctionType.OUT_SINE
                }
            ],
            onEnd: "Needle spun"
        }); */
    }

    public static create(sprite: Sprite, needle: Item): DaNeedle {
        return new DaNeedle(sprite);
    }

    //public playNeedleAnimation(): void { this._needle.tweens.play("spin"); }
    
    public override useWeapon(player: PlayerActor, facingDir: number): void {
        if (facingDir == 1) {
            this.curAngle = 0;
        }
        else {
            this.curAngle = Math.PI;
        }

        this._isSpinning = true;
        this._spinTimer.start();
        
        //this.playNeedleAnimation();
        this.emitter.fireEvent(ItemEvent.DANEEDLE_USED, {position: this._needle.position.clone()});
    }

    get isSpinning() {
        return this._isSpinning;
    }
    set isSpinning(isOn: boolean) {
        this._isSpinning = isOn;
    }

    get curAngle() {
        return this._curAngle;
    }
    set curAngle(angle: number) {
        this._curAngle = angle;
    }

    get radiusToPlayer() {
        return this._radiusToPlayer;
    }
    set radiusToPlayer(radius: number) {
        this._radiusToPlayer = radius;
    }

}
