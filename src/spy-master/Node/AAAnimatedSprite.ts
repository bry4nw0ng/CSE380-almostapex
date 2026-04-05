import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import SMScene from "../Scenes/SMScene";

/**
 * An animated sprite in the SMScene. I have extended the animated sprite to create a more specific sprite
 * with a reference to a SMScene. One of the things I want to try and show all of you is how to extend
 * Wolfie2d. 
 * 
 * For the AAAnimatedSprite, I've just overriden the type of the scene and the associated getter/setter
 * methods. Without this, you would have to explicitly cast the type of the scene to a SMScene to get access
 * to the methods associated with SMScene. 
 * 
 * - Peter
 */
export default class AAAnimatedSprite extends AnimatedSprite {

    protected scene: SMScene;
    
    public setScene(scene: SMScene): void { this.scene = scene; }
    public getScene(): SMScene { return this.scene; }
}