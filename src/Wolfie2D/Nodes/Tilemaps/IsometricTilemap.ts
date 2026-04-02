import AABB from "../../DataTypes/Shapes/AABB";
import Shape from "../../DataTypes/Shapes/Shape";
import { TiledTilemapData, TiledLayerData } from "../../DataTypes/Tilesets/TiledData";
import Vec2 from "../../DataTypes/Vec2";
import Debug from "../../Debug/Debug";
import Color from "../../Utils/Color";
import Tilemap from "../Tilemap";
 
 
export default class IsometricTilemap extends Tilemap {
    public getMinColRow(region: AABB): Vec2 {
        return new Vec2(0, 0);
    }
    public getMaxColRow(region: AABB): Vec2 {
        return new Vec2(this.numCols, this.numRows);
    }
 
    public override getWorldPosition(col: number, row: number): Vec2 {
        if (col < 0 || col > this.numCols || row < 0 || row > this.numRows) {
            return Vec2.ZERO;
        }
        let x = Math.floor(this.scale.x * this.tileSize.x / 2 * (col - row));
        let y = Math.floor(this.scale.y * this.tileSize.y / 2 * (col + row));
        
        return new Vec2(x, y);
    }
 
    public override getTilemapPosition(x: number, y: number): Vec2 {
        let hViewportX = this.scene.getViewport().getHalfSize().x;
        let col = Math.floor((x - hViewportX) / this.scale.x / this.tileSize.x + y / this.scale.y / this.tileSize.y);
        let row = Math.floor(y / this.scale.y / this.tileSize.y - (x - hViewportX) / this.scale.x / this.tileSize.x);
        if (col < 0 || col > this.numCols || row < 0 || row > this.numRows) {
            return Vec2.ZERO;
        }
        return new Vec2(col, row);
    }

    public override getTileCollider(col: number, row: number): Shape {
        let tileSize = this.getScaledTileSize();
        let hWidth = tileSize.x / 2;
        let hHeight = tileSize.y / 2;

        let centerX = (col - row) * hWidth;
        let centerY = (col + row) * hHeight;

        return new AABB(new Vec2(centerX, centerY), new Vec2(hWidth, hHeight));
}
 
    protected parseTilemapData(tilemapData: TiledTilemapData, layer: TiledLayerData): void {
        this.numCols = tilemapData.width;
        this.numRows = tilemapData.height;
 
        this.tileSize.set(tilemapData.tilewidth, tilemapData.tileheight);
 
        this.size.set(this.numCols * this.tileSize.x, this.numRows * this.tileSize.y);
        this.position.copy(this.size.scaled(0.5));
        this.data = layer.data;
        this.visible = layer.visible;
 
        this.isCollidable = false;
        if(layer.properties){
            for(let item of layer.properties){
                if(item.name === "Collidable"){
                    this.isCollidable = item.value;
 
                    for(let i = 1; i < this.collisionMap.length; i++){
                        this.collisionMap[i] = true;
                    }
                }
            }
        }
    }
    
    public override debugRender(): void {
        for (let tile = 0; tile < this.data.length; tile++) {
            let pos = this.getTileColRow(tile);
            Debug.drawPoint(this.getWorldPosition(pos.x, pos.y), Color.BLUE);
        }
    }
}