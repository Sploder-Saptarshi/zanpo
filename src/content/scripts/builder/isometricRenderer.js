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
    
    drawLightBeam(x, y) {
        const pos = this.toIso(x, y, 0);
        
        // Always draw guide reaching up to 7 layers
        const guideHeight = 7;
        const topPos = this.toIso(x, y, guideHeight);
        
        // Draw vertical light beam - MUCH THICKER AND MORE VISIBLE
        const gradient = this.ctx.createLinearGradient(
            pos.x, pos.y,
            topPos.x, topPos.y
        );
        gradient.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 150, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0.3)');
        
        // Draw much thicker beam (12 pixels wide instead of 6)
        this.ctx.save();
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x - 8, pos.y);
        this.ctx.lineTo(topPos.x - 8, topPos.y);
        this.ctx.lineTo(topPos.x + 8, topPos.y);
        this.ctx.lineTo(pos.x + 8, pos.y);
        this.ctx.closePath();
        this.ctx.fill();
        
    }

    drawPlacementHighlight(x, y, z) {
        // Draw highlight diamond at placement position
        const placementPos = this.toIso(x, y, z);
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 1.0)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(placementPos.x, placementPos.y - this.tileHeight);
        this.ctx.lineTo(placementPos.x + this.tileWidth, placementPos.y);
        this.ctx.lineTo(placementPos.x, placementPos.y + this.tileHeight);
        this.ctx.lineTo(placementPos.x - this.tileWidth, placementPos.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawPlacementGuide(x, y, z, currentMaxZ = 0, previewBlockId = null) {
        // Legacy method - kept for compatibility
        // Now broken into drawLightBeam, drawPlacementHighlight
        this.drawLightBeam(x, y);
        if (previewBlockId && z > 0) {
            this.drawBlock(x, y, z, previewBlockId, 0.6);
        }
        this.drawPlacementHighlight(x, y, z);
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
        
        // Use vizplane from options (controlled by visibility slider)
        const sectionMode = options.sectionMode !== undefined ? options.sectionMode : 0;
        const vizplane = options.vizplane !== undefined ? options.vizplane : 17; // Default = show all
        
        // Collect all blocks with their positions
        const blocks = [];
        
        for (const x in grid) {
            const xInt = parseInt(x);
            for (const y in grid[x]) {
                const yInt = parseInt(y);
                
                // Apply section visibility (matching Flash viewer setviz function)
                let visible = true;
                const gridX = xInt + 4; // Convert from -4..4 to 0..8
                const gridY = yInt + 4;
                
                if (sectionMode === -1) {
                    // Vertical section (by Y)
                    visible = gridY < vizplane / 2;
                } else if (sectionMode === 1) {
                    // Horizontal section (by X)
                    visible = gridX < vizplane / 2;
                } else {
                    // Diagonal section (default) - always active when vizplane < 17
                    visible = gridX + gridY < vizplane;
                }
                
                if (!visible) continue;
                
                for (const z in grid[x][y]) {
                    const zInt = parseInt(z);
                    const blockId = grid[x][y][z];
                    
                    const pos = this.toIso(xInt, yInt, zInt);
                    
                    // Calculate depth based on ROTATED coordinates for proper sorting
                    let rotX = xInt;
                    let rotY = yInt;
                    
                    switch(this.rotation) {
                        case 90:
                            rotX = -yInt;
                            rotY = xInt;
                            break;
                        case 180:
                            rotX = -xInt;
                            rotY = -yInt;
                            break;
                        case 270:
                            rotX = yInt;
                            rotY = -xInt;
                            break;
                        default: // 0 degrees
                            rotX = xInt;
                            rotY = yInt;
                    }
                    
                    blocks.push({
                        x: xInt,
                        y: yInt,
                        z: zInt,
                        blockId,
                        pos,
                        // For isometric, render order should be: back to front, bottom to top
                        // Use ROTATED coordinates for depth calculation
                        depth: (rotY + rotX) * 1000 + zInt
                    });
                }
            }
        }
        
        // Add placement guide elements to the depth-sorted list if hover is active
        if (options.hoverX !== undefined && options.hoverY !== undefined && options.hoverZ !== undefined) {
            const hoverX = options.hoverX;
            const hoverY = options.hoverY;
            const hoverZ = options.hoverZ;
            
            // Check if the hover position is visible based on vizplane/sectionMode
            const hoverGridX = hoverX + 4; // Convert from -4..4 to 0..8
            const hoverGridY = hoverY + 4;
            let hoverVisible = true;
            
            if (sectionMode === -1) {
                // Vertical section (by Y)
                hoverVisible = hoverGridY < vizplane / 2;
            } else if (sectionMode === 1) {
                // Horizontal section (by X)
                hoverVisible = hoverGridX < vizplane / 2;
            } else {
                // Diagonal section (default)
                hoverVisible = hoverGridX + hoverGridY < vizplane;
            }
            
            // Only show visual indicators if the hover position is visible
            if (hoverVisible) {
            
            // Calculate depth for hover elements using same logic
            let rotX = hoverX;
            let rotY = hoverY;
            
            switch(this.rotation) {
                case 90:
                    rotX = -hoverY;
                    rotY = hoverX;
                    break;
                case 180:
                    rotX = -hoverX;
                    rotY = -hoverY;
                    break;
                case 270:
                    rotX = hoverY;
                    rotY = -hoverX;
                    break;
                default:
                    rotX = hoverX;
                    rotY = hoverY;
            }
            
            // Add cubical base (z=0) to rendering queue
            blocks.push({
                x: hoverX,
                y: hoverY,
                z: 0,
                isGuideBase: true,
                depth: (rotY + rotX) * 1000 + 0 // z=0 for base
            });
            
            // Check if there's already a block at the hover position
            const hasBlockAtHover = grid[hoverX] && grid[hoverX][hoverY] && grid[hoverX][hoverY][hoverZ] !== undefined;
            
            // Add preview block if provided (only if NOT hovering over existing block)
            if (options.previewBlockId) {
                // Find the highest block at this position
                let topZ = 0;
                
                
                // Use the maximum of hoverZ and topZ
                const previewZ = Math.max(hoverZ, topZ);
                
                blocks.push({
                    x: hoverX,
                    y: hoverY,
                    z: previewZ,
                    blockId: options.previewBlockId,
                    isPreview: true,
                    depth: (rotY + rotX) * 1000 + previewZ
                });
                
                // Add placement highlight at the same position as preview
                blocks.push({
                    x: hoverX,
                    y: hoverY,
                    z: previewZ,
                    isHighlight: true,
                    depth: (rotY + rotX) * 1000 + previewZ + 0.5 // Slightly above preview block
                });
            } else if (!hasBlockAtHover) {
                // No preview, just show highlight at hover position (only if no block exists)
                blocks.push({
                    x: hoverX,
                    y: hoverY,
                    z: hoverZ,
                    isHighlight: true,
                    depth: (rotY + rotX) * 1000 + hoverZ + 0.5
                });
            }
            } // End of hoverVisible check
        }
        
        // Sort blocks by depth for correct layering
        // Blocks with lower depth value should be drawn first (further back and lower)
        blocks.sort((a, b) => a.depth - b.depth);
        
        // Draw all visible blocks and guide elements in depth order
        blocks.forEach(block => {
            if (block.isPreview) {
                this.drawBlock(block.x, block.y, block.z, block.blockId, 0.6); // 60% opacity for preview
            } else if (block.isHighlight) {
                this.drawPlacementHighlight(block.x, block.y, block.z);
            } else {
                this.drawBlock(block.x, block.y, block.z, block.blockId, 1.0);
            }
        });
        
        // Draw hover highlight at ground level (always on top) - but only if visible
        if (options.hoverX !== undefined && options.hoverY !== undefined) {
            // Check visibility for hover indicators
            const hoverGridX = options.hoverX + 4;
            const hoverGridY = options.hoverY + 4;
            let hoverVisible = true;
            
            if (sectionMode === -1) {
                hoverVisible = hoverGridY < vizplane / 2;
            } else if (sectionMode === 1) {
                hoverVisible = hoverGridX < vizplane / 2;
            } else {
                hoverVisible = hoverGridX + hoverGridY < vizplane;
            }
            
            if (hoverVisible) {
                this.drawHoverHighlight(options.hoverX, options.hoverY);
                
                // Draw light beam (always on top)
                if (options.hoverZ !== undefined) {
                    this.drawLightBeam(options.hoverX, options.hoverY);
                }
            }
        }
    }
}
