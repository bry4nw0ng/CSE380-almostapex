import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameNode, { TweenableProperties } from "../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../Wolfie2D/Scene/Scene";
import { EaseFunctionType } from "../../../Wolfie2D/Utils/EaseFunctions";
import SMScene from "../../Scenes/SMScene";
import Item from "../ItemSystem/Item";
import PlayerActor from "../../Actors/PlayerActor";
import { ItemEvent } from "../../Events";
import Timer from "../../../Wolfie2D/Timing/Timer";
import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import NPCActor from "../../Actors/NPCActor";

export default class Arrow {

    protected _arrow: Sprite;

    protected _radiusToPlayer: number;
    protected _curAngle: number;
    protected _player: PlayerActor;

    public constructor(sprite: Sprite, player: PlayerActor) {
        this._arrow = sprite;
        this._player = player;
        //this.equippableOffset = new Vec2(-10, 10);
        this._arrow.scale = new Vec2(2, 2);
        this._radiusToPlayer = 80;
        this._curAngle = 0;
        this._arrow.alpha = .8;
        this._arrow.visible = false;
    }

    //Absolutely miserable, literally every bit of trig manipulation (adding PI, negating) is totally through just guessing a thousand times
    public update(deltaT: number, closestEnemy: NPCActor | null): void {      
        if (!closestEnemy) {
            this._arrow.visible = false;
            return;
        }
        //let dirToEnemy = this._player.position.dirTo(closestEnemy.position);
        this._arrow.visible = true;

        let dirX = closestEnemy.position.x - this._player.position.x;
        let dirY = closestEnemy.position.y - this._player.position.y;
        this._curAngle = Math.atan2(dirY, dirX);

        this._arrow.position.set(
                this._player.position.x + (this._radiusToPlayer * Math.cos(this._curAngle)),
                this._player.position.y + (this._radiusToPlayer * Math.sin(this._curAngle))
            );
        this._arrow.rotation = -(this._curAngle);
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

    public set visible(value: boolean) {
        this._arrow.visible = value;
    }
}
