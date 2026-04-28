import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Input from "../../Wolfie2D/Input/Input";
import MainMenu from "./MainMenu";
import { GameEventType } from "../../Wolfie2D/Events/GameEventType";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";

export default class SplashScreen extends Scene {

    private fadeOverlay: Rect;
    private apexSprite: Sprite;
    private almostSprite: Sprite;
    private fading: boolean = false;

    public loadScene(): void {
        this.load.image("logo", "game_assets/ui/splash/logo.png");
        this.load.spritesheet("demo_slime", "game_assets/spritesheets/demo_slime2.json");
        this.load.image("almost", "game_assets/ui/splash/almost.png");
        this.load.image("apex", "game_assets/ui/splash/apex.png");

    }

    public startScene(): void {
        const center = this.viewport.getCenter();
        const half = this.viewport.getHalfSize();

        this.addLayer("bg", 0);
        this.addLayer("logo", 1);
        this.addLayer("almost", 2);
        this.addUILayer("ui");
        this.addUILayer("fade");
        

        // blue background filling canvas
        const bg = this.add.graphic(GraphicType.RECT, "bg", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(half.x * 2, half.y * 2)
        });

        //bg.color = new Color(135, 206, 235);
        bg.color = Color.BLACK;
        this.apexSprite = this.add.sprite("apex", "logo");
        this.apexSprite.position.set(center.x, center.y - 1000);
        this.apexSprite.scale.set(2, 2);

        this.almostSprite = this.add.sprite("almost", "almost");
        this.almostSprite.position.set(center.x - 220, center.y - 130);
        this.almostSprite.scale.set(2, 2);
        this.almostSprite.rotation = Math.PI / 8;
        this.almostSprite.alpha = 0;
/* 
        // scale down logo to fit canvas
        const logo = this.add.sprite("logo", "logo");
        logo.position.set(center.x, center.y - 150);
        logo.scale.set(0.35, 0.35);

        // slime dance
        const slime = this.add.animatedSprite(AnimatedSprite, "demo_slime", "logo");
        slime.position.set(center.x, center.y + 25);
        slime.scale.set(0.75, 0.75);
        slime.animation.play("Dancing", true); */

        // "Click to start" below the logo
        const prompt = <Label>this.add.uiElement(UIElementType.LABEL, "ui", {
            position: new Vec2(center.x, center.y + 175),
            text: "Click anywhere to start"
        });
        prompt.textColor = Color.WHITE;
        prompt.fontSize = 24;

/*         // play button
        const playBtn = this.add.uiElement(UIElementType.BUTTON, "ui", {
            position: new Vec2(center.x, center.y + 250),
            text: "PLAY"
        });
        playBtn.size.set(200, 60);
        playBtn.borderWidth = 2;
        playBtn.borderColor = Color.WHITE;
        playBtn.backgroundColor = new Color(80, 80, 200);
        playBtn.onClickEventId = "startgame"; */

        // testing fade
        this.fadeOverlay = <Rect>this.add.graphic(GraphicType.RECT, "fade", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(half.x * 2, half.y * 2)
        });
        this.fadeOverlay.color = Color.BLACK;
        this.fadeOverlay.alpha = 0;

        this.fadeOverlay.tweens.add("fadeOut", {
            startDelay: 0,
            duration: 800,
            effects: [{
                property: TweenableProperties.alpha,
                start: 0,
                end: 1,
                ease: EaseFunctionType.IN_OUT_SINE
            }],
            onEnd: "fade-done"
        });
        

        this.apexSprite.tweens.add("toCenter", {
            startDelay: 300,
            duration: 2000,
            effects: [
                {
                    property: TweenableProperties.posY,
                    start: this.viewport.getHalfSize().y  - 1000,
                    end: this.viewport.getHalfSize().y - 50,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: "ApexToCenter"
        });

        this.almostSprite.tweens.add("AlmostFadeIn", {
            startDelay: 1000,
            duration: 750,
            effects: [
                {
                    property: TweenableProperties.alpha,
                    start: 0,
                    end: 1,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: "AlmostFadedIn"
        });

        this.almostSprite.tweens.add("TiltLeft", {
            startDelay: 0,
            duration: 750,
            effects: [
                {
                    property: TweenableProperties.rotation,
                    start: Math.PI/ 8,
                    end: -Math.PI/ 16,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: "TiltedLeft"
        });

        this.almostSprite.tweens.add("TiltRight", {
            startDelay: 0,
            duration: 750,
            effects: [
                {
                    property: TweenableProperties.rotation,
                    start: -Math.PI/ 16,
                    end: Math.PI/ 8,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: "TiltedRight"
        });

        this.receiver.subscribe("startgame");
        this.receiver.subscribe("fade-done");
        this.receiver.subscribe("ApexToCenter");
        this.receiver.subscribe("TiltedLeft");
        this.receiver.subscribe("TiltedRight");

        this.apexSprite.tweens.play("toCenter");
    }

    public updateScene(): void {
        if (!this.fading && Input.isMouseJustPressed()) {
            this.startFade();
        }
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    private startFade(): void {
        this.fading = true;
        this.fadeOverlay.tweens.play("fadeOut");
    }

    public handleEvent(event: GameEvent): void {
        switch (event.type) {
            case "ApexToCenter":
                this.almostSprite.tweens.play("AlmostFadeIn");
                this.almostSprite.tweens.play("TiltLeft");
                break;
            case "TiltedLeft":
                this.almostSprite.tweens.play("TiltRight");
                break;
            case "TiltedRight":
                this.almostSprite.tweens.play("TiltLeft");
                break;
            case "startgame":
                if (!this.fading) this.startFade();
                break;
            case "fade-done":
                this.sceneManager.changeToScene(MainMenu);
                break;
        }
    }
}
