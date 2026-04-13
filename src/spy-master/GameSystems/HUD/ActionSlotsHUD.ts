import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Color from "../../../Wolfie2D/Utils/Color";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Label from "../../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";

interface ActionSlotsOptions {
    /** X position of the first box's left edge */
    startX: number;
    /** Top edge of the boxes */
    topY: number;
    /** Height of each box (should match HP bar + tray height) */
    height: number;
    /** Width of each box */
    boxWidth: number;
    /** Gap between weapon and first ability box */
    weaponAbilityGap: number;
    /** Gap between ability boxes */
    abilityGap: number;
}

/**
 * Displays 4 action slot boxes: 1 weapon (distinct color) + 3 abilities.
 * Positioned to the right of the HP bar and passive tray.
 */
export default class ActionSlotsHUD implements Updateable {

    private scene: Scene;
    private layer: string;

    /** The 4 box backgrounds: index 0 = weapon, 1-3 = abilities */
    private boxes: Label[];

    /** Tooltip label shown on hover */
    private tooltip: Label;

    public constructor(scene: Scene, layer: string, options: ActionSlotsOptions) {
        this.scene = scene;
        this.layer = layer;
        this.boxes = [];

        let weaponColor = new Color(140, 60, 60, 200);
        let abilityColor = new Color(60, 60, 140, 200);

        for (let i = 0; i < 4; i++) {
            let offsetX = 0;
            if (i === 0) {
                offsetX = 0;
            } else if (i === 1) {
                offsetX = options.boxWidth + options.weaponAbilityGap;
            } else {
                offsetX = options.boxWidth + options.weaponAbilityGap + (i - 1) * (options.boxWidth + options.abilityGap);
            }
            let centerX = options.startX + options.boxWidth / 2 + offsetX;
            let centerY = options.topY + options.height / 2;

            let box = <Label>this.scene.add.uiElement(UIElementType.LABEL, layer, {position: new Vec2(centerX, centerY), text: ""});
            box.size.set(options.boxWidth, options.height);
            box.backgroundColor = i === 0 ? weaponColor : abilityColor;
            box.borderColor = Color.WHITE;
            box.borderWidth = 1;

            this.boxes.push(box);
        }

        // Tooltip (hidden by default)
        this.tooltip = <Label>this.scene.add.uiElement(UIElementType.LABEL, layer, {position: Vec2.ZERO, text: ""});
        this.tooltip.backgroundColor = new Color(0, 0, 0, 200);
        this.tooltip.borderColor = Color.WHITE;
        this.tooltip.borderWidth = 1;
        this.tooltip.textColor = Color.WHITE;
        this.tooltip.fontSize = 18;
        this.tooltip.font = "Arial";
        this.tooltip.size.set(280, 36);
        this.tooltip.visible = false;
    }

    public update(deltaT: number): void {
        // Functionality will be added later
    }
}
