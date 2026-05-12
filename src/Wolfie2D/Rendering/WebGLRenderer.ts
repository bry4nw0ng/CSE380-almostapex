import Graph from "../DataTypes/Graphs/Graph";
import Map from "../DataTypes/Collections/Map";
import Vec2 from "../DataTypes/Vec2";
import Debug from "../Debug/Debug";
import CanvasNode from "../Nodes/CanvasNode";
import Graphic from "../Nodes/Graphic";
import { GraphicType } from "../Nodes/Graphics/GraphicTypes";
import Point from "../Nodes/Graphics/Point";
import Rect from "../Nodes/Graphics/Rect";
import AnimatedSprite from "../Nodes/Sprites/AnimatedSprite";
import Sprite from "../Nodes/Sprites/Sprite";
import Tilemap from "../Nodes/Tilemap";
import IsometricTilemap from "../Nodes/Tilemaps/IsometricTilemap";
import UIElement from "../Nodes/UIElement";
import Label from "../Nodes/UIElements/Label";
import ShaderRegistry from "../Registry/Registries/ShaderRegistry";
import RegistryManager from "../Registry/RegistryManager";
import ResourceManager from "../ResourceManager/ResourceManager";
import ParallaxLayer from "../Scene/Layers/ParallaxLayer";
import UILayer from "../Scene/Layers/UILayer";
import Color from "../Utils/Color";
import RenderingUtils from "../Utils/RenderingUtils";
import RenderingManager from "./RenderingManager";
import ShaderType from "./WebGLRendering/ShaderType";

export default class WebGLRenderer extends RenderingManager {

	protected origin: Vec2;
	protected zoom: number;
	protected worldSize: Vec2;

	protected gl: WebGLRenderingContext;
	protected textCtx: CanvasRenderingContext2D;

	initializeCanvas(canvas: HTMLCanvasElement, width: number, height: number): WebGLRenderingContext {
		canvas.width = width;
        canvas.height = height;

		this.worldSize = Vec2.ZERO;
		this.worldSize.x = width;
		this.worldSize.y = height;

		// Get the WebGL context
        this.gl = canvas.getContext("webgl");

		this.gl.viewport(0, 0, canvas.width, canvas.height);

		this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.disable(this.gl.CULL_FACE);

		// Tell the resource manager we're using WebGL
		ResourceManager.getInstance().useWebGL(true, this.gl);

		// Show the text canvas and get its context
		let textCanvas = <HTMLCanvasElement>document.getElementById("text-canvas");
		textCanvas.hidden = false;
		this.textCtx = textCanvas.getContext("2d");

		// Size the text canvas to be the same as the game canvas
		textCanvas.height = height;
		textCanvas.width = width;

        return this.gl;
	}

	render(visibleSet: CanvasNode[], tilemaps: Tilemap[], uiLayers: Map<UILayer>): void {
		visibleSet.sort((a, b) => {
			if(a.getLayer().getDepth() === b.getLayer().getDepth()){
				return (a.boundary.bottom) - (b.boundary.bottom);
			} else {
				return a.getLayer().getDepth() - b.getLayer().getDepth();
			}
		});

		let tilemapIndex = 0;
		let tilemapLength = tilemaps.length;

		let visibleSetIndex = 0;
		let visibleSetLength = visibleSet.length;

		while(tilemapIndex < tilemapLength || visibleSetIndex < visibleSetLength){
			if(tilemapIndex >= tilemapLength){
				let node = visibleSet[visibleSetIndex++];
				if(node.visible){
					this.renderNode(node);
				}
				continue;
			}

			if(visibleSetIndex >= visibleSetLength){
				this.renderTilemap(tilemaps[tilemapIndex++]);
				continue;
			}

			if(tilemaps[tilemapIndex].getLayer().getDepth() <= visibleSet[visibleSetIndex].getLayer().getDepth()){
				this.renderTilemap(tilemaps[tilemapIndex++]);
			} else {
				let node = visibleSet[visibleSetIndex++];
				if(node.visible){
					this.renderNode(node);
				}
			}
		}

		let sortedUILayers = new Array<UILayer>();

		uiLayers.forEach(key => sortedUILayers.push(uiLayers.get(key)));

		sortedUILayers = sortedUILayers.sort((ui1, ui2) => ui1.getDepth() - ui2.getDepth());

		sortedUILayers.forEach(uiLayer => {
			if(!uiLayer.isHidden())
				uiLayer.getItems().forEach(node => {
					if((<CanvasNode>node).visible){
						this.renderNode(<CanvasNode>node)
					}
				})
		});
	}

	clear(color: Color): void {
		this.gl.clearColor(color.r, color.g, color.b, color.a);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.textCtx.clearRect(0, 0, this.worldSize.x, this.worldSize.y);
	}

	protected renderNode(node: CanvasNode): void {
		// Calculate the origin of the viewport according to this sprite
        this.origin = this.scene.getViewTranslation(node);

        // Get the zoom level of the scene
        this.zoom = this.scene.getViewScale();
		
		if(node.hasCustomShader){
			// If the node has a custom shader, render using that
			this.renderCustom(node);
		} else if(node instanceof Graphic){
			this.renderGraphic(node);
		} else if(node instanceof Sprite){
			if(node instanceof AnimatedSprite){
				this.renderAnimatedSprite(node);
			} else {
				this.renderSprite(node);
			}
		} else if(node instanceof UIElement){
			this.renderUIElement(node);
		}
	}

	protected renderSprite(sprite: Sprite): void {
		let shader = RegistryManager.shaders.get(ShaderRegistry.SPRITE_SHADER);
		let options = this.addOptions(shader.getOptions(sprite), sprite);
		shader.render(this.gl, options);
	}

	protected renderAnimatedSprite(sprite: AnimatedSprite): void {
		let shader = RegistryManager.shaders.get(ShaderRegistry.SPRITE_SHADER);
		let options = this.addOptions(shader.getOptions(sprite), sprite);
		shader.render(this.gl, options);
	}

	protected renderGraphic(graphic: Graphic): void {

		if(graphic instanceof Point){
			let shader = RegistryManager.shaders.get(ShaderRegistry.POINT_SHADER);
			let options = this.addOptions(shader.getOptions(graphic), graphic);
			shader.render(this.gl, options);
		} else if(graphic instanceof Rect) {
			let shader = RegistryManager.shaders.get(ShaderRegistry.RECT_SHADER);
			let options = this.addOptions(shader.getOptions(graphic), graphic);
			shader.render(this.gl, options);
		} 
	}

	protected renderTilemap(tilemap: Tilemap): void {
		if(!tilemap.visible){
			return;
		}

		this.origin = this.scene.getViewTranslation(tilemap);
		this.zoom = this.scene.getViewScale();

		let minColRow = tilemap.getMinColRow(this.scene.getViewport().getView());
		let maxColRow = tilemap.getMaxColRow(this.scene.getViewport().getView());

		let minSum = minColRow.x + minColRow.y;
		let maxSum = maxColRow.x + maxColRow.y;

		for(let sum = minSum; sum <= maxSum; sum++){
			for(let col = minColRow.x; col <= maxColRow.x; col++){
				let row = sum - col;
				if(row < minColRow.y || row > maxColRow.y) continue;

				let tile = tilemap.getTile(col, row);
				if(tile === 0) continue;

				const mask = 0xF0000000;
				const rotFlip = ((tile & mask) >>> 28) & 0xF;
				tile = tile & ~mask;

				for(let tileset of tilemap.getTilesets()){
					if(tileset.hasTile(tile)){
						this.renderTile(tilemap, tileset, tile, col, row, rotFlip);
					}
				}
			}
		}
	}

	protected renderTile(tilemap: Tilemap, tileset: any, tileIndex: number, col: number, row: number, rotFlip: number): void {
		let imageKey = tileset.getImageKey();
		let image = this.resourceManager.getImage(imageKey);
		let tileSize = tileset.getTileSize();
		let imageOffset = tileset.getImageOffsetForTile(tileIndex);
		let position = tilemap.getWorldPosition(col, row);

		if(tilemap instanceof IsometricTilemap){
			position = new Vec2(
				position.x + tileSize.x*tilemap.scale.x/2,
				position.y + (tilemap.getTileSize().y - tileSize.y)*tilemap.scale.y/2
			);
		} else {
			position = new Vec2(
				position.x + tileSize.x*tilemap.scale.x/2,
				position.y + tileSize.y*tilemap.scale.y/2
			);
		}

		let texShiftX = imageOffset.x / image.width;
		let texShiftY = imageOffset.y / image.height;
		let texScaleX = tileSize.x / image.width;
		let texScaleY = tileSize.y / image.height;

		if(rotFlip & 8){
			texShiftX += texScaleX;
			texScaleX *= -1;
		}
		if(rotFlip & 4){
			texShiftY += texScaleY;
			texScaleY *= -1;
		}

		let options: Record<string, any> = {
			position,
			rotation: 0,
			size: tileSize,
			scale: tilemap.scale.toArray(),
			imageKey,
			texShift: new Float32Array([texShiftX, texShiftY]),
			texScale: new Float32Array([texScaleX, texScaleY])
		};

		let shader = RegistryManager.shaders.get(ShaderRegistry.SPRITE_SHADER);
		shader.render(this.gl, this.addOptions(options, tilemap));
	}

	protected renderUIElement(uiElement: UIElement): void {
		if(uiElement instanceof Label){
			let shader = RegistryManager.shaders.get(ShaderRegistry.LABEL_SHADER);
			let options = this.addOptions(shader.getOptions(uiElement), uiElement);
			shader.render(this.gl, options);

			this.textCtx.setTransform(1, 0, 0, 1, (uiElement.position.x - this.origin.x)*this.zoom, (uiElement.position.y - this.origin.y)*this.zoom);
			this.textCtx.rotate(-uiElement.rotation);
			let globalAlpha = this.textCtx.globalAlpha;
			this.textCtx.globalAlpha = uiElement.alpha;

			// Render text
			this.textCtx.font = uiElement.getFontString();
			let offset = uiElement.calculateTextOffset(this.textCtx);
			this.textCtx.fillStyle = uiElement.calculateTextColor();
			this.textCtx.globalAlpha = uiElement.textColor.a;
			this.textCtx.fillText(uiElement.text, offset.x - uiElement.size.x/2, offset.y - uiElement.size.y/2);

			this.textCtx.globalAlpha = globalAlpha;
        	this.textCtx.setTransform(1, 0, 0, 1, 0, 0);
		}
	}

	protected renderCustom(node: CanvasNode): void {
		let shader = RegistryManager.shaders.get(node.customShaderKey);
		let options = this.addOptions(shader.getOptions(node), node);
		shader.render(this.gl, options);
	}

	protected addOptions(options: Record<string, any>, node: CanvasNode): Record<string, any> {
		// Give the shader access to the world size
		options.worldSize = this.worldSize;
		options.zoom = this.zoom;
		options.alpha = node.alpha !== undefined ? node.alpha : node.getLayer().getAlpha();

		// Adjust the origin position to the parallax
		let layer = node.getLayer();
		let parallax = new Vec2(1, 1);
		if(layer instanceof ParallaxLayer){
			parallax = (<ParallaxLayer>layer).parallax;
		}

		options.origin = this.origin.clone().mult(parallax);

		return options;
	}

}
