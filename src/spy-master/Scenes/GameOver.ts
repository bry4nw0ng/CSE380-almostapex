import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import MainMenu from "./MainMenu";

export default class GameOver extends Scene {

    startScene() {
        const center = this.viewport.getCenter();

        this.addUILayer("primary");

        const gameOver = <Label>this.add.uiElement(UIElementType.LABEL, "primary", {position: new Vec2(center.x, center.y - 50), text: "Game Over"});
        gameOver.textColor = Color.WHITE;
        gameOver.fontSize = 48;

        const restart = <Button>this.add.uiElement(UIElementType.BUTTON, "primary", {position: new Vec2(center.x, center.y + 50), text: "Return to Menu"});
        restart.size.set(300, 50);
        restart.borderWidth = 2;
        restart.borderColor = Color.WHITE;
        restart.backgroundColor = new Color(60, 60, 60, 200);
        restart.textColor = Color.WHITE;
        restart.fontSize = 24;
        restart.onClickEventId = "menu";

        this.receiver.subscribe("menu");
    }

    updateScene(_deltaT: number): void {
        while (this.receiver.hasNextEvent()) {
            let event = this.receiver.getNextEvent();
            if (event.type === "menu") {
                this.sceneManager.changeToScene(MainMenu);
            }
        }
    }
}