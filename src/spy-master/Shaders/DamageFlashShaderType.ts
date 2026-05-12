import Mat4x4 from "../../Wolfie2D/DataTypes/Mat4x4";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import SpriteShaderType from "../../Wolfie2D/Rendering/WebGLRendering/ShaderTypes/SpriteShaderType";

export const DAMAGE_FLASH_SHADER = "damageFlash";

export default class DamageFlashShaderType extends SpriteShaderType {

	initBufferObject(): void {
		this.bufferObjectKey = "damageFlash";
		this.resourceManager.createBuffer(this.bufferObjectKey);
	}

	render(gl: WebGLRenderingContext, options: Record<string, any>): void {
		const program = this.resourceManager.getShaderProgram(this.programKey);
		const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
		const texture = this.resourceManager.getTexture(options.imageKey);

		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		const vertexData = this.getVertices(options.size.x, options.size.y, options.scale);
		const FSIZE = vertexData.BYTES_PER_ELEMENT;

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

		const a_Position = gl.getAttribLocation(program, "a_Position");
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 4 * FSIZE, 0 * FSIZE);
		gl.enableVertexAttribArray(a_Position);

		const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
		gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 4 * FSIZE, 2 * FSIZE);
		gl.enableVertexAttribArray(a_TexCoord);

		let maxDimension = Math.max(options.size.x, options.size.y);
		let zoom = options.zoom === undefined ? 1 : options.zoom;
		let scaledMaxDimension = maxDimension * zoom;

		let size = new Vec2(scaledMaxDimension, scaledMaxDimension).scale(2 / options.worldSize.x, 2 / options.worldSize.y);
		const translateX = ((options.position.x - options.origin.x) * zoom - options.worldSize.x / 2) / scaledMaxDimension;
		const translateY = -((options.position.y - options.origin.y) * zoom - options.worldSize.y / 2) / scaledMaxDimension;

		this.translation.translate(new Float32Array([translateX, translateY]));
		this.scale.scale(size);
		this.rotation.rotate(options.rotation);
		let transformation = Mat4x4.MULT(this.translation, this.scale, this.rotation);

		const u_Transform = gl.getUniformLocation(program, "u_Transform");
		gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());

		const u_Sampler = gl.getUniformLocation(program, "u_Sampler");
		gl.uniform1i(u_Sampler, 0);

		const u_texShift = gl.getUniformLocation(program, "u_texShift");
		gl.uniform2fv(u_texShift, options.texShift);

		const u_texScale = gl.getUniformLocation(program, "u_texScale");
		gl.uniform2fv(u_texScale, options.texScale);

		const u_FlashAmount = gl.getUniformLocation(program, "u_FlashAmount");
		gl.uniform1f(u_FlashAmount, options.flashAmount);

		const u_FlashColor = gl.getUniformLocation(program, "u_FlashColor");
		gl.uniform3fv(u_FlashColor, options.flashColor);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	getOptions(sprite: Sprite): Record<string, any> {
		const options = super.getOptions(sprite);

		const anySprite = sprite as any;
		const flashAmount = typeof anySprite.flashAmount === "number" ? anySprite.flashAmount : 0;
		const flashColor = anySprite.flashColor instanceof Float32Array
			? anySprite.flashColor
			: new Float32Array([1.0, 0.0, 0.0]);

		options.flashAmount = Math.max(0, Math.min(1, flashAmount));
		options.flashColor = flashColor;

		return options;
	}
}
