import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import Timer from "../../../../Wolfie2D/Timing/Timer";
import { AbilityEvent } from "../../../Events";
import PlayerActor from "../../../Actors/PlayerActor";

//IMPORTANT Implement ability button -- has to cause cooldown too -- slows down all enemies
export default class Gum extends Item {
    
    //protected _speedDebuff: number;
    //protected _active: boolean;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._isAbility = true;
    }

    public override useAbility(player: PlayerActor): void {
        //Need animation
        //this._active = true;
        this.emitter.fireEvent(AbilityEvent.USED_GUM);
        //let activeTimer = new Timer(3000, ()=>, false); 
    }
}