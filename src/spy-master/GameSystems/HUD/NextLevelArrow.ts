import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import PlayerActor from "../../Actors/PlayerActor";

export default class EndArrow {

    protected _arrow: Sprite;

    protected _radiusToPlayer: number;
    protected _curAngle: number;
    protected _player: PlayerActor;

    public constructor(sprite: Sprite, player: PlayerActor) {
        this._arrow = sprite;
        this._player = player;

        this._arrow.scale = new Vec2(2, 2);
        this._radiusToPlayer = 80;
        this._curAngle = 0;
        this._arrow.alpha = .8;
        this._arrow.visible = false;
    }

    //Copied mostly from LastEnemyArrow
    public update(deltaT: number, endLoc: Vec2): void {      
        //let dirToEnemy = this._player.position.dirTo(closestEnemy.position);
        this._arrow.visible = true;

        let dirX = endLoc.x - this._player.position.x;
        let dirY = endLoc.y - this._player.position.y;
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
