import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import { TweenableProperties } from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import MainMenu from "./MainMenu";

export default class SplashScreen extends Scene {

    private fadeOverlay: Rect;

    public loadScene(): void {
        this.load.image("logo", "game_assets/ui/splash/logo.png");
    }

    public startScene(): void {
        const center = this.viewport.getCenter();
        const half = this.viewport.getHalfSize();

        this.addLayer("bg", 0);
        this.addLayer("logo", 1);
        this.addUILayer("ui");
        this.addUILayer("fade");
        

        // blue background filling canvas
        const bg = this.add.graphic(GraphicType.RECT, "bg", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(half.x * 2, half.y * 2)
        });
        bg.color = new Color(135, 206, 235);

        // scale down logo to fit canvas
        const logo = this.add.sprite("logo", "logo");
        logo.position.set(center.x, center.y - 100);
        logo.scale.set(0.35, 0.35);

        // "Click to start" below the logo
        const prompt = <Label>this.add.uiElement(UIElementType.LABEL, "ui", {
            position: new Vec2(center.x, center.y + 175),
            text: "Click anywhere to start"
        });
        prompt.textColor = Color.WHITE;
        prompt.fontSize = 24;

        // play button
        const playBtn = this.add.uiElement(UIElementType.BUTTON, "ui", {
            position: new Vec2(center.x, center.y + 250),
            text: "PLAY"
        });
        playBtn.size.set(200, 60);
        playBtn.borderWidth = 2;
        playBtn.borderColor = Color.WHITE;
        playBtn.backgroundColor = new Color(80, 80, 200);
        playBtn.onClickEventId = "startgame";

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

        this.receiver.subscribe("startgame");
        this.receiver.subscribe("fade-done");
    }

    public updateScene(): void {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    public handleEvent(event: GameEvent): void {
        switch (event.type) {
            case "startgame":
                this.fadeOverlay.tweens.play("fadeOut");
                break;
            case "fade-done":
                this.sceneManager.changeToScene(MainMenu);
                break;
        }
    }
}
