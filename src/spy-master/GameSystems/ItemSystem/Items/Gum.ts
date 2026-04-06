import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import SMScene from "../../../Scenes/SMScene";
import Item from "../Item";
import Timer from "../../../../Wolfie2D/Timing/Timer";

//IMPORTANT Implement ability button -- has to cause cooldown too -- slows down all enemies
export default class Gum extends Item {
    
    protected _speedDebuff: number;
        protected _active: boolean;

    public constructor(sprite: Sprite) {
        super(sprite);
        this._speedDebuff = 1;
        this._active = false;
    }

    public get speedDebuff(): number { return this._speedDebuff; }
    public set speedDebuff(debuff: number) { this._speedDebuff = debuff; }
    public get isGumActive(): boolean { return this._active; }
    public set toggleGumActive(condition: boolean) { this._active = !(this._active); }

    public triggerGum(): void {
        //Need animation
        this._speedDebuff = 0.5;
        this._active = true;
        let activeTimer = new Timer(3000, ()=> this._active = false, false); 
    }
}