import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import PlayerActor from "../../../Actors/PlayerActor";
import { AbilityEvent } from "../../../Events";
//Allows to be very fast for 3 seconds IMPORTANT: Ability trigger button needed, need public ability cooldown
export default class JetPack extends Item {
    
    protected _speedBoost: number;
    //protected _active: boolean;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isAbility = true;
    }

    public get speedBoost(): number { return this._speedBoost; }
    public set speedBoost(boost: number) { this._speedBoost = boost; }
    //public get isJPActive(): boolean { return this._active; }
    //public set toggleJPActive(condition: boolean) { this._active = !(this._active); }


    public override useAbility(player: PlayerActor): void {
        //Need animation
        player.setJPOn(true);
        let activeTimer = new Timer(3000, () => player.setJPOn(false), false);
        this.emitter.fireEvent(AbilityEvent.USED_JETPACK);
    }

}