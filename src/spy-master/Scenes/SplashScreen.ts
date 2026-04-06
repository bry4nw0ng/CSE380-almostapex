import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import MainMenu from "./MainMenu";

export default class SplashScreen extends Scene {

    public loadScene(): void {
        this.load.image("logo", "game_assets/ui/splash/logo.png");
    }

    public startScene(): void {
        const center = this.viewport.getCenter();
        const half = this.viewport.getHalfSize();

        this.addLayer("bg", 0);
        this.addLayer("logo", 1);
        this.addUILayer("ui");

        // Sky blue background filling the full canvas
        const bg = this.add.graphic(GraphicType.RECT, "bg", {
            position: new Vec2(center.x, center.y),
            size: new Vec2(half.x * 2, half.y * 2)
        });
        bg.color = new Color(135, 206, 235);

        // Logo — image is 2420x1173, scale down to fit canvas
        const logo = this.add.sprite("logo", "logo");
        logo.position.set(center.x, center.y - 100);
        logo.scale.set(0.35, 0.35);

        // "Click to start" prompt below the logo
        const prompt = <Label>this.add.uiElement(UIElementType.LABEL, "ui", {
            position: new Vec2(center.x, center.y + 175),
            text: "Click anywhere to start"
        });
        prompt.textColor = Color.WHITE;
        prompt.fontSize = 24;

        // Play button
        const playBtn = this.add.uiElement(UIElementType.BUTTON, "ui", {
            position: new Vec2(center.x, center.y + 250),
            text: "PLAY"
        });
        playBtn.size.set(200, 60);
        playBtn.borderWidth = 2;
        playBtn.borderColor = Color.WHITE;
        playBtn.backgroundColor = new Color(80, 80, 200);
        playBtn.onClickEventId = "startgame";

        this.receiver.subscribe("startgame");
    }

    public updateScene(): void {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }

    public handleEvent(event: GameEvent): void {
        switch (event.type) {
            case "startgame":
                this.sceneManager.changeToScene(MainMenu);
                break;
        }
    }
}
