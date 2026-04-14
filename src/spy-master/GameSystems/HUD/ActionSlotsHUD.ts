import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Color from "../../../Wolfie2D/Utils/Color";
import Scene from "../../../Wolfie2D/Scene/Scene";
import Label from "../../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Updateable from "../../../Wolfie2D/DataTypes/Interfaces/Updateable";
import Inventory from "../ItemSystem/Inventory";
import Item from "../ItemSystem/Item";

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
 * Shows equipped item sprites and tooltip on hover.
 */
export default class ActionSlotsHUD implements Updateable {

    private scene: Scene;
    private layer: string;

    /** The 4 box backgrounds: index 0 = weapon, 1-3 = abilities */
    private boxes: Label[];
    /** Center positions of each box */
    private boxPositions: Vec2[];
    private boxSize: number;

    /** The inventories to watch */
    private equippables: Inventory;
    private abilities: Inventory;

    /** Sprites currently displayed in each slot */
    private slotIcons: (Sprite | null)[];
    /** Item IDs currently in each slot (to detect changes) */
    private slotItemIds: (number | null)[];

    /** Original box colors for restoring after cooldown */
    private boxColors: Color[];
    private cooldownColor: Color = new Color(80, 80, 80, 200);

    /** Tooltip label shown on hover */
    private tooltip: Label;

    public constructor(scene: Scene, layer: string, equippables: Inventory, abilities: Inventory, options: ActionSlotsOptions) {
        this.scene = scene;
        this.layer = layer;
        this.equippables = equippables;
        this.abilities = abilities;
        this.boxes = [];
        this.boxPositions = [];
        this.boxColors = [];
        this.boxSize = options.boxWidth;
        this.slotIcons = [null, null, null, null];
        this.slotItemIds = [null, null, null, null];

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
            box.textColor = Color.WHITE;
            box.fontSize = 20;
            box.font = "Arial";

            this.boxes.push(box);
            this.boxPositions.push(new Vec2(centerX, centerY));
            this.boxColors.push(i === 0 ? weaponColor : abilityColor);
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
        // Find weapon from equippables
        let weapon: Item | null = this.equippables.find(item => item.isWeapon);
        // Get abilities as array
        let abilityList: Item[] = [...this.abilities.items()];

        // Map slot index to item: 0 = weapon, 1-3 = abilities
        let slotItems: (Item | null)[] = [
            weapon,
            abilityList[0] || null,
            abilityList[1] || null,
            abilityList[2] || null
        ];

        let tooltipVisible = false;
        let tooltipText = "";
        let tooltipPos = Vec2.ZERO;

        for (let i = 0; i < 4; i++) {
            let item = slotItems[i];
            let pos = this.boxPositions[i];
            let itemId = item ? item.id : null;

            // If item changed in this slot, update the icon
            if (itemId !== this.slotItemIds[i]) {
                // Hide old icon
                if (this.slotIcons[i]) {
                    this.slotIcons[i].visible = false;
                }
                this.slotIcons[i] = null;
                this.slotItemIds[i] = null;

                // Create new icon if there's an item
                if (item) {
                    let spriteKey = item.getSprite().imageId;
                    let icon = this.scene.add.sprite(spriteKey, this.layer);
                    let scale = (this.boxSize * 0.35) / Math.max(icon.size.x, icon.size.y);
                    icon.scale.set(scale, scale);
                    this.slotIcons[i] = icon;
                    this.slotItemIds[i] = itemId;
                }
            }

            // Position icon and handle cooldown visuals
            if (this.slotIcons[i]) {
                this.slotIcons[i].position.copy(pos);
                this.slotIcons[i].visible = true;

                if (item && item.isCoolingDown) {
                    this.slotIcons[i].alpha = 0.3;
                    this.boxes[i].backgroundColor = this.cooldownColor;
                    let secondsLeft = Math.ceil(item.cooldownProgress * item.cooldownDuration / 1000);
                    this.boxes[i].text = secondsLeft + "s";
                } else {
                    this.slotIcons[i].alpha = 1;
                    this.boxes[i].backgroundColor = this.boxColors[i];
                    this.boxes[i].text = "";
                }
            } else {
                this.boxes[i].backgroundColor = this.boxColors[i];
            }

            // Check hover for tooltip
            if (this.boxes[i]["isEntered"] && item) {
                tooltipText = item.description || item.getSprite().imageId;
                tooltipPos = new Vec2(pos.x, pos.y + this.boxSize / 2 + 5);
                tooltipVisible = true;
            }
        }

        // Update tooltip
        this.tooltip.visible = tooltipVisible;
        if (tooltipVisible) {
            this.tooltip.text = tooltipText;
            this.tooltip.position.copy(tooltipPos);
        }
    }
}
