import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { TweenableProperties } from "../../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../../Wolfie2D/Utils/EaseFunctions";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import { HudEvent } from "../../Events";

export default class WaveAlerts {

    private wavealerts: AnimatedSprite;

    private viewportSize: Vec2;


    public constructor(sprite: AnimatedSprite, size: Vec2) {
        this.wavealerts = sprite;

        this.viewportSize = size;

        this.wavealerts.position.set(this.viewportSize.x/2 + 10, this.viewportSize.y + 100)

        this.wavealerts.tweens.add("toCenter", {
            startDelay: 0,
            duration: 500,
            effects: [
                {
                    property: TweenableProperties.posY,
                    start: this.viewportSize.y + 100,
                    end: this.viewportSize.y / 2 - 50,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: "WaveAlertInCenter"
        });
        this.wavealerts.tweens.add("fromCenter", {
            startDelay: 1000,
            duration: 500,
            effects: [
                {
                    property: TweenableProperties.posY,
                    start: this.viewportSize.y / 2 - 50,
                    end: -100,
                    ease: EaseFunctionType.IN_OUT_QUAD
                }
            ],
            onEnd: "WaveAlertDone"
        });
    }

    public alertToCenter() {
        this.wavealerts.position.set(this.viewportSize.x/2 + 20, this.viewportSize.y + 100);
        this.wavealerts.tweens.play("toCenter");
    }

    public alertLeave() {
        this.wavealerts.tweens.play("fromCenter");
    }

    public playWave1Incoming(): void {
        this.wavealerts.animation.playIfNotAlready("WAVE_1");
        this.alertToCenter();
    }
    public playWave2Incoming(): void {
        this.wavealerts.animation.playIfNotAlready("WAVE_2");
        this.alertToCenter();
    }
    public playWave3Incoming(): void {
        this.wavealerts.animation.playIfNotAlready("WAVE_3");
        this.alertToCenter();
    }
    public playBossIncoming(): void {
        this.wavealerts.animation.playIfNotAlready("BOSS_INCOMING");
        this.alertToCenter();
    }
    public playWaveDefeated(): void {
        this.wavealerts.animation.playIfNotAlready("WAVE_DEFEATED");
        this.alertToCenter();
    }
    public playBossDefeated(): void {
        this.wavealerts.animation.playIfNotAlready("BOSS_DEFEATED");
        this.alertToCenter();
    }
}
