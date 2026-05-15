import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Color from "../../../Wolfie2D/Utils/Color";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Label from "../../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Item from "../ItemSystem/Item";
import Inventory from "../ItemSystem/Inventory";
import MathUtils from "../../../Wolfie2D/Utils/MathUtils";

interface RelicTrayOptions {
    position: Vec2;
    size: Vec2;
    iconSize: number;
    padding: number;
}


/**
 * Displays a tray of passive relic icons below the HP bar.
 * Shows a tooltip on hover with the item's description.
 */
export default class RelicTrayHUD implements Updateable {

    private scene: Scene;
    private layer: string;
    private inventory: Inventory;

    private position: Vec2;
    private size: Vec2;
    private iconSize: number;
    private padding: number;

    /** background rectangle for passive tray */
    private background: Label;

    /** tooltip label shown on hover */
    private tooltip: Label;

    /** Tracked relic icons: maps item id to its HUD sprite */
    private relicIcons: Map<number, Sprite>;
    /** Maps item id to its sprite key (for tooltip lookup) */
    private relicNames: Map<number, string>;
    /** Maps item id to its hover zone label */
    private hoverZones: Map<number, Label>;

    //Adding labels so you know what your stack is 
    private stackLabels: Map<number, Label>;

    private tray: Sprite;

    public constructor(scene: Scene, inventory: Inventory, layer: string, options: RelicTrayOptions) {
        this.scene = scene;
        this.layer = layer;
        this.inventory = inventory;

        this.position = options.position;
        this.size = options.size;
        this.iconSize = options.iconSize;
        this.padding = options.padding;

        this.relicIcons = new Map();
        this.relicNames = new Map();
        this.hoverZones = new Map();
        this.stackLabels = new Map();

        // background rectangle
        this.background = <Label>this.scene.add.uiElement(UIElementType.LABEL, layer, {position: this.position.clone(), text: ""});
        this.background.size.copy(this.size);
        this.background.backgroundColor = new Color(100, 100, 120, 200);
        this.background.borderColor = Color.WHITE;
        this.background.borderWidth = 1;

        // tooltip 
        this.tooltip = <Label>this.scene.add.uiElement(UIElementType.LABEL, layer, {position: Vec2.ZERO, text: ""});
        this.tooltip.backgroundColor = new Color(0, 0, 0, 200);
        this.tooltip.borderColor = Color.WHITE;
        this.tooltip.borderWidth = 1;
        this.tooltip.textColor = Color.WHITE;
        this.tooltip.fontSize = 10;
        this.tooltip.size.set(280, 36);
        this.tooltip.visible = false;

        this.tray = this.scene.add.sprite("tray_long", layer);
        this.tray.position.set(this.position.x + 252, this.position.y + 30);
        this.tray.scale.set(2, 1);

        this.background.visible = false;
    }

    public update(deltaT: number): void {
        // passive items from inventory
        let passives: Item[] = [];
        for (let item of this.inventory.items()) {
            if (item.isPassive) {
                passives.push(item);
            }
        }

        // remove icons for items no longer in inventory
        for (let [id, icon] of this.relicIcons) {
            if (!passives.find(p => p.id === id)) {
                icon.visible = false;
                let zone = this.hoverZones.get(id);
                if (zone) zone.visible = false;
                let hasLabel = this.stackLabels.get(id);
                if (hasLabel) hasLabel.visible = false;
                this.relicIcons.delete(id);
                this.relicNames.delete(id);
                this.hoverZones.delete(id);
                this.stackLabels.delete(id);
            }
        }

        // place icons for current passives
/*         let startX = this.padding * 2 + this.iconSize;
        let centerY = this.position.y; */

        let startX = this.position.x + 140 + this.padding;
        let centerY = this.position.y + 30;


        let tooltipVisible = false;
        let tooltipText = "";
        let tooltipPos = Vec2.ZERO;

        for (let i = 0; i < passives.length; i++) {
            let item = passives[i];
            let iconX = startX + i * (this.iconSize + this.padding);

            // make icon sprite if new
            if (!this.relicIcons.has(item.id)) {
                let spriteKey = item.getSprite().imageId;
                let icon = this.scene.add.sprite(spriteKey, this.layer);
                let scale = this.iconSize / Math.max(icon.size.x, icon.size.y);
                icon.scale.set(scale, scale);
                this.relicIcons.set(item.id, icon);
                this.relicNames.set(item.id, spriteKey);

                // create invisible hover zone for this icon
                let zone = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.layer, {position: new Vec2(iconX, centerY), text: ""});
                zone.size.set(this.iconSize, this.iconSize);
                zone.backgroundColor = Color.TRANSPARENT;
                this.hoverZones.set(item.id, zone);
            }

            // position the icon
            let icon = this.relicIcons.get(item.id);
            icon.position.set(iconX, centerY);
            icon.visible = true;

            //If doesnt have stack label then initialize new one (only show this is called and already exists because gt 1 then)
            let label = this.stackLabels.get(item.id);
            if (!label) {
                let stackLabel = <Label>this.scene.add.uiElement(UIElementType.LABEL, this.layer, {
                    position: new Vec2(iconX + 8, centerY + 10),
                    text: ""
                });
                stackLabel.backgroundColor = Color.TRANSPARENT;
                stackLabel.textColor = Color.WHITE;
                stackLabel.fontSize = 24;
                stackLabel.visible = false;
                this.stackLabels.set(item.id, stackLabel);

                label = stackLabel;
            }

            label.position.set(iconX + 8, centerY + 10);

            let stack = item.curStack
            if (stack > 1) {
                label.text = `x${stack}`
                label.visible = true;
            }
            else {
                label.visible = false;
            }

            // position the hover zone
            let zone = this.hoverZones.get(item.id);
            zone.position.set(iconX, centerY);
            zone.visible = true;

            // check hover for tooltip
            if (zone["isEntered"]) {
                tooltipText = item.description || this.relicNames.get(item.id);
                //tooltipPos = new Vec2(this.position.x, this.position.y + this.size.y / 2 + 5);
                tooltipPos = new Vec2(iconX, centerY + this.size.y / 2 + 5);
                tooltipVisible = true;
            }
        }

        // update tooltip
        this.tooltip.visible = tooltipVisible;
        if (tooltipVisible) {
            this.tooltip.text = tooltipText;
            //this.tooltip.position.copy(tooltipPos);
            this.tooltip.size.set(tooltipText.length * 10 + 20, 36);
            let fixedX = MathUtils.clamp(tooltipPos.x, this.tooltip.size.x / 2, 550 - this.tooltip.size.x / 2);
            this.tooltip.position.set(fixedX, tooltipPos.y);
        }
    }
}
