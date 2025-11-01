// Isometric 3D Renderer for Zanpo Builder
export class IsometricRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = options.width || 480;
        this.height = options.height || 470;
        // Exact Flash viewer values
        this.tileWidth = 16;
        this.tileHeight = 8;
        this.blockHeight = 20; // z * 20 per layer
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;
        
        this.rotation = 0;
        this.scale = 1;
        
        this.blockImages = {};
        this.loadingImages = {};
    }
    
    setRotation(angle) {
        this.rotation = angle;
    }
    
    toIso(x, y, z = 0) {
        // Apply rotation to grid coordinates first
        let rotX = x;
        let rotY = y;
        
        // Rotate by 90 degree increments
        switch(this.rotation) {
            case 90:
                rotX = -y;
                rotY = x;
                break;
            case 180:
                rotX = -x;
                rotY = -y;
                break;
            case 270:
                rotX = y;
                rotY = -x;
                break;
            default: // 0 degrees
                rotX = x;
                rotY = y;
        }
        
        // Flash viewer formula:
        // Row: _X = -ypos * 16, _Y = ypos * 8
        // Col: _X = xpos * 16, _Y = xpos * 8  (relative to row)
        // Combined: _X = xpos * 16 - ypos * 16, _Y = xpos * 8 + ypos * 8
        const isoX = (rotX - rotY) * this.tileWidth;
        const isoY = (rotX + rotY) * this.tileHeight - z * this.blockHeight;
        
        return {
            x: isoX + this.offsetX,
            y: isoY + this.offsetY
        };
    }
    
    fromIso(screenX, screenY) {
        const x = screenX - this.offsetX;
        const y = screenY - this.offsetY;
        
        // Reverse Flash viewer formula:
        // isoX = (rotX - rotY) * 16, isoY = (rotX + rotY) * 8
        // Solve for rotX, rotY:
        // rotX = (isoX / 16 + isoY / 8) / 2
        // rotY = (isoY / 8 - isoX / 16) / 2
        const rotX = (x / this.tileWidth + y / this.tileHeight) / 2;
        const rotY = (y / this.tileHeight - x / this.tileWidth) / 2;
        
        // Apply reverse rotation
        let gridX, gridY;
        switch(this.rotation) {
            case 90:
                gridX = rotY;
                gridY = -rotX;
                break;
            case 180:
                gridX = -rotX;
                gridY = -rotY;
                break;
            case 270:
                gridX = -rotY;
                gridY = rotX;
                break;
            default: // 0 degrees
                gridX = rotX;
                gridY = rotY;
        }
        
        return {
            x: Math.round(gridX),
            y: Math.round(gridY)
        };
    }
    
    loadBlockImage(blockId) {
        if (this.blockImages[blockId]) {
            return Promise.resolve(this.blockImages[blockId]);
        }
        
        if (this.loadingImages[blockId]) {
            return this.loadingImages[blockId];
        }
        
        this.loadingImages[blockId] = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.blockImages[blockId] = img;
                delete this.loadingImages[blockId];
                resolve(img);
            };
            img.onerror = () => {
                delete this.loadingImages[blockId];
                reject(new Error(`Failed to load block ${blockId}`));
            };
            img.src = `content/blocks/${blockId}.svg`;
        });
        
        return this.loadingImages[blockId];
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    drawGrid(gridSize = 9) {
        const half = Math.floor(gridSize / 2);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let y = -half; y <= half; y++) {
            for (let x = -half; x <= half; x++) {
                const pos = this.toIso(x, y);
                
                // Draw diamond shape for tile (matching Flash viewer)
                // Diamond points at cardinal directions from center
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x, pos.y - this.tileHeight);  // Top
                this.ctx.lineTo(pos.x + this.tileWidth, pos.y);    // Right
                this.ctx.lineTo(pos.x, pos.y + this.tileHeight);   // Bottom
                this.ctx.lineTo(pos.x - this.tileWidth, pos.y);    // Left
                this.ctx.closePath();
                
                this.ctx.fillStyle = 'rgba(50, 50, 50, 0.1)';
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }
    
    drawBlock(x, y, z, blockId, alpha = 1.0) {
        const pos = this.toIso(x, y, z);
        const img = this.blockImages[blockId];
        
        if (!img) {
            // Draw placeholder - isometric cube
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Draw left face
            this.ctx.fillStyle = `rgba(80, 80, 80, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(pos.x - this.tileWidth, pos.y);
            this.ctx.lineTo(pos.x - this.tileWidth, pos.y - this.blockHeight);
            this.ctx.lineTo(pos.x, pos.y - this.blockHeight);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw right face
            this.ctx.fillStyle = `rgba(60, 60, 60, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(pos.x + this.tileWidth, pos.y);
            this.ctx.lineTo(pos.x + this.tileWidth, pos.y - this.blockHeight);
            this.ctx.lineTo(pos.x, pos.y - this.blockHeight);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw top face (diamond)
            this.ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y - this.blockHeight - this.tileHeight);
            this.ctx.lineTo(pos.x + this.tileWidth, pos.y - this.blockHeight);
            this.ctx.lineTo(pos.x, pos.y - this.blockHeight + this.tileHeight);
            this.ctx.lineTo(pos.x - this.tileWidth, pos.y - this.blockHeight);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
            return;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // SVG blocks are 47.5px wide x 118.95px tall
        // The SVG anchor point (from transform) is at (23.35, 95.7)
        // This means the anchor is 23.35px from left (roughly centered) and 95.7px from top
        // We need to position the image so this anchor point aligns with our isometric position
        const blockWidth = 48;
        const blockHeight = 119;
        const anchorX = 23.35; // Horizontal center of the block
        const anchorY = 108;  // Vertical anchor (near bottom, but not quite at bottom)
        
        // Position the image so its anchor point is at pos.x, pos.y
        this.ctx.drawImage(
            img,
            pos.x - anchorX,
            pos.y - anchorY,
            blockWidth,
            blockHeight
        );
        
        this.ctx.restore();
    }
    
    drawPlacementGuide(x, y, z, currentMaxZ = 0) {
        const pos = this.toIso(x, y, 0);
        
        // Always draw guide reaching up to 7 layers
        const guideHeight = 7;
        const topPos = this.toIso(x, y, guideHeight);
        
        // Draw vertical light beam
        const gradient = this.ctx.createLinearGradient(
            pos.x, pos.y,
            topPos.x, topPos.y
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        // Draw thick beam
        this.ctx.save();
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x - 3, pos.y);
        this.ctx.lineTo(topPos.x - 3, topPos.y);
        this.ctx.lineTo(topPos.x + 3, topPos.y);
        this.ctx.lineTo(pos.x + 3, pos.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        
        // Draw highlight at placement position
        const placementPos = this.toIso(x, y, z);
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(placementPos.x, placementPos.y - this.tileHeight);
        this.ctx.lineTo(placementPos.x + this.tileWidth, placementPos.y);
        this.ctx.lineTo(placementPos.x, placementPos.y + this.tileHeight);
        this.ctx.lineTo(placementPos.x - this.tileWidth, placementPos.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawHoverHighlight(x, y) {
        const pos = this.toIso(x, y);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y - this.tileHeight);
        this.ctx.lineTo(pos.x + this.tileWidth, pos.y);
        this.ctx.lineTo(pos.x, pos.y + this.tileHeight);
        this.ctx.lineTo(pos.x - this.tileWidth, pos.y);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    render(grid, options = {}) {
        this.clear();
        this.drawGrid(options.gridSize || 9);
        
        // Collect all blocks with their positions
        const blocks = [];
        
        for (const x in grid) {
            const xInt = parseInt(x);
            for (const y in grid[x]) {
                const yInt = parseInt(y);
                for (const z in grid[x][y]) {
                    const zInt = parseInt(z);
                    const blockId = grid[x][y][z];
                    
                    const pos = this.toIso(xInt, yInt, zInt);
                    blocks.push({
                        x: xInt,
                        y: yInt,
                        z: zInt,
                        blockId,
                        pos,
                        // For isometric, render order should be: back to front, bottom to top
                        // Lower grid y and x should render first (back), higher z renders first (bottom)
                        depth: (yInt + xInt) * 1000 - zInt
                    });
                }
            }
        }
        
        // Sort blocks by depth for correct layering
        // Blocks further back (lower depth value) should be drawn first
        // Depth is calculated as pos.y + pos.x, so lower values = further back
        blocks.sort((a, b) => a.depth - b.depth);
        
        // Draw blocks
        const maxLayer = options.maxLayer !== undefined ? options.maxLayer : 999;
        blocks.forEach(block => {
            const alpha = block.z <= maxLayer ? 1.0 : 0.1;
            this.drawBlock(block.x, block.y, block.z, block.blockId, alpha);
        });
        
        // Draw hover highlight
        if (options.hoverX !== undefined && options.hoverY !== undefined) {
            this.drawHoverHighlight(options.hoverX, options.hoverY);
            
            if (options.hoverZ !== undefined) {
                this.drawPlacementGuide(options.hoverX, options.hoverY, options.hoverZ, options.currentMaxZ || 0);
            }
        }
    }
}
