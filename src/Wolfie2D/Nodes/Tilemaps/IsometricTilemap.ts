import AABB from "../../DataTypes/Shapes/AABB";
import Shape from "../../DataTypes/Shapes/Shape";
import { TiledTilemapData, TiledLayerData } from "../../DataTypes/Tilesets/TiledData";
import Vec2 from "../../DataTypes/Vec2";
import Debug from "../../Debug/Debug";
import Color from "../../Utils/Color";
import Tilemap from "../Tilemap";
import MathUtils from "../../Utils/MathUtils";
 
export default class IsometricTilemap extends Tilemap {
    //public getMinColRow(region: AABB): Vec2 {
      //  return new Vec2(0, 0);
    //}
    /*
    public override getMinColRow(region: AABB): Vec2 {
        let left = region.left;
        let top = region.top;
        
        // Inverse of getWorldPosition to get tile coords from world coords
        let tileW = this.scale.x * this.tileSize.x / 2;
        let tileH = this.scale.y * this.tileSize.y / 2;
        
        // Convert world coords to isometric tile coords
        let col = Math.floor((left / tileW + top / tileH) / 2) - 4;
        let row = Math.floor((top / tileH - left / tileW) / 2) - 5;
        
        // So follows the bounds
        col = MathUtils.clamp(col, 0, this.numCols - 1);
        row = MathUtils.clamp(row, 0, this.numRows - 1);
        
        return new Vec2(col, row);
    }*/
    //public getMaxColRow(region: AABB): Vec2 {
      //  return new Vec2(this.numCols, this.numRows);
    //}
    /*
    public override getMaxColRow(region: AABB): Vec2 {
        let right = region.right;
        let bottom = region.bottom;
        

        let tileW = this.scale.x * this.tileSize.x / 2;
        let tileH = this.scale.y * this.tileSize.y / 2;
        
        let col = Math.ceil((right / tileW + bottom / tileH) / 2) + 4;
        let row = Math.ceil((bottom / tileH - right / tileW) / 2) + 5;
        
        //So that doesnt go beyond bounds
        col = MathUtils.clamp(col, 0, this.numCols - 1);
        row = MathUtils.clamp(row, 0, this.numRows - 1);
        
        return new Vec2(col, row);
    }*/
    public override getMinColRow(region: AABB): Vec2 {
        return new Vec2(0, 0);
    }

    public override getMaxColRow(region: AABB): Vec2 {
        return new Vec2(this.numCols - 1, this.numRows - 1);
    }
    public override getWorldPosition(col: number, row: number): Vec2 {
        if (col < 0 || col > this.numCols || row < 0 || row > this.numRows) {
            return Vec2.ZERO;
        }
        let x = (this.scale.x * this.tileSize.x / 2 * (col - row));
        let y = (this.scale.y * this.tileSize.y / 2 * (col + row));

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
        let hWidth = this.scale.x * this.tileSize.x / 2;
        let hHeight = this.scale.y * this.tileSize.y / 2;

        let centerX = hWidth * (col - row) + hWidth / 2;
        let centerY = hHeight * (col + row) + hHeight / 2;

        return new AABB(new Vec2(centerX, centerY), new Vec2(hWidth / 2, hHeight / 2));
    }
/*     public override getTileCollider(col: number, row: number): Shape {
        let hWidth = this.scale.x * this.tileSize.x / 2;
        let hHeight = this.scale.y * this.tileSize.y / 2;

        let centerX = hWidth * (col - row);
        let centerY = hHeight * (col + row);

        return new AABB(new Vec2(centerX, centerY), new Vec2(hWidth, hHeight));
    } */
 
    protected parseTilemapData(tilemapData: TiledTilemapData, layer: TiledLayerData): void {
        this.numCols = tilemapData.width;
        this.numRows = tilemapData.height;
 
        this.tileSize.set(tilemapData.tilewidth, tilemapData.tileheight);
 
        //this.size.set(this.numCols * this.tileSize.x, this.numRows * this.tileSize.y);
        //this.position.copy(this.size.scaled(0.5));
        this.size.set((this.numCols + this.numRows) * this.tileSize.x / 2, 
        (this.numCols + this.numRows) * this.tileSize.y / 2);
        this.position.set(0, 0);
        this.data = layer.data;
        this.visible = layer.visible;
        
        if(layer.opacity !== undefined){
            this.alpha = layer.opacity;
        }

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