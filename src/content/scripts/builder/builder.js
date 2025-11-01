// Zanpo Builder - Main Implementation
import { blockFamilies, blockData, getBlockInfo, getBlocksByFamily } from './blockMetadata.js';
import { IsometricRenderer } from './isometricRenderer.js';

class ZanpoBuilder {
    constructor() {
        this.gridSize = 9; // 9x9 grid
        this.maxLayers = 10; // Maximum height
        this.cellWidth = 32;
        this.cellHeight = 16;
        this.blockHeight = 20; // Height per layer in pixels
        
        this.grid = {}; // Stores blocks: grid[x][y][z] = blockId
        this.selectedFamily = 'ground';
        this.selectedBlock = 1;
        this.currentTool = 'place'; // place, delete, select
        this.rotation = 0; // 0, 90, 180, 270
        this.theme = 'default'; // default or red
        this.visibility = 1.0; // For layer visibility
        this.sectionMode = 0; // 0 = diagonal, -1 = vertical, 1 = horizontal (matching Flash viewer)
        
        this.blockTitle = "A City Block";
        this.blockDescription = "A nondescript city block, in a middle-class neighborhood.";
        
        this.hoveredCell = null;
        this.hoverLayer = 0;
        
        this.isDraggingVisibility = false;
        
        this.renderer = null;
        this.canvas = null;
        this.animationFrame = null;
        
        this.initGrid();
    }
    
    initGrid() {
        for (let x = -4; x <= 4; x++) {
            this.grid[x] = {};
            for (let y = -4; y <= 4; y++) {
                this.grid[x][y] = {};
            }
        }
    }
    
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'zanpo-builder-overlay';
        overlay.innerHTML = `
            <div class="builder-container">
                <div class="builder-main">
                    <button class="builder-close-button" id="builder-close">×</button>
                    
                    <!-- Left Panel -->
                    <div class="builder-left-panel" id="left-panel">
                        <div class="builder-logo">BUILD</div>
                        
                        <div class="builder-minimap">
                            <div class="minimap-grid" id="minimap-grid"></div>
                        </div>
                        
                        <button class="builder-tips-button" style="display:none;" id="tips-button">TIPS!</button>
                        
                        <div class="builder-visibility-control">
                            <div class="visibility-label">Visibility</div>
                            <div class="visibility-slider" id="visibility-slider">
                                <div class="visibility-track" id="visibility-track">
                                    <div class="visibility-thumb" id="visibility-thumb"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="builder-section-control">
                            <div class="visibility-label">Section View</div>
                            <div class="section-buttons">
                                <button class="section-button selected" id="section-diagonal" title="Diagonal Section">⬘</button>
                                <button class="section-button" id="section-horizontal" title="Horizontal Section">—</button>
                                <button class="section-button" id="section-vertical" title="Vertical Section">|</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Center Panel - 3D View -->
                    <div class="builder-center" id="center-panel">
                        <div class="builder-viewport" id="viewport">
                            <button class="rotation-button rotation-left" id="rotate-left">↺</button>
                            <canvas id="iso-canvas" style="display: block;"></canvas>
                            <button class="rotation-button rotation-right" id="rotate-right">↻</button>
                        </div>
                        
                        <div class="builder-bottom-tools">
                            <div class="tool-button selected" id="tool-place" title="Place Block">
                                <span style="font-size: 24px;">📦</span>
                            </div>
                            <div class="tool-button" id="tool-select" title="Select Block">
                                <span style="font-size: 24px;">👆</span>
                            </div>
                            <div class="tool-button" id="tool-delete" title="Delete Block">
                                <span style="font-size: 24px;">❌</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Panel -->
                    <div class="builder-right-panel" id="right-panel">
                        <div class="block-info-panel">
                            <input type="text" class="block-title-input" id="block-title" 
                                   placeholder="Block Title" value="A City Block">
                            <textarea class="block-description-input" id="block-description" 
                                      placeholder="Block Description">A nondescript city block, in a middle-class neighborhood.</textarea>
                        </div>
                        
                        <div class="panel-section-title">• Block Families •</div>
                        <div class="block-families" id="block-families"></div>
                        
                        <div class="panel-section-title">• Block Variants •</div>
                        <div class="block-variants" id="block-variants"></div>
                        
                        <div class="color-selector" id="color-selector">
                            <div class="color-option selected" data-theme="default" style="background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);"></div>
                            <div class="color-option" data-theme="red" style="background: linear-gradient(135deg, #4a1a1a 0%, #2a0a0a 100%);"></div>
                        </div>
                        
                        <div class="builder-action-buttons">
                            <button class="action-button restore" id="btn-restore">Hold / Restore</button>
                            <button class="action-button submit" id="btn-submit">Submit ➜</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }
    
    init() {
        this.overlay = this.createOverlay();
        this.canvas = document.getElementById('iso-canvas');
        this.renderer = new IsometricRenderer(this.canvas, {
            width: 480,
            height: 470
        });
        this.setupEventListeners();
        this.renderFamilies();
        this.renderVariants();
        this.preloadBlockImages();
        this.renderGrid();
        this.renderMinimap();
        this.updateTheme();
        this.startRenderLoop();
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('builder-close').addEventListener('click', () => this.close());
        
        // Tool buttons
        document.getElementById('tool-place').addEventListener('click', () => this.setTool('place'));
        document.getElementById('tool-select').addEventListener('click', () => this.setTool('select'));
        document.getElementById('tool-delete').addEventListener('click', () => this.setTool('delete'));
        
        // Rotation
        document.getElementById('rotate-left').addEventListener('click', () => this.rotate(-90));
        document.getElementById('rotate-right').addEventListener('click', () => this.rotate(90));
        
        // Action buttons
        document.getElementById('btn-restore').addEventListener('click', () => this.restore());
        document.getElementById('btn-submit').addEventListener('click', () => this.submit());
        document.getElementById('tips-button').addEventListener('click', () => this.showTips());
        
        // Title and description
        document.getElementById('block-title').addEventListener('input', (e) => {
            this.blockTitle = e.target.value;
        });
        document.getElementById('block-description').addEventListener('input', (e) => {
            this.blockDescription = e.target.value;
        });
        
        // Theme selector
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.setTheme(theme);
            });
        });
        
        // Canvas interactions
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredCell = null;
            this.renderGrid();
        });
        
        // Visibility slider
        this.setupVisibilitySlider();
        
        // Section buttons
        document.getElementById('section-diagonal').addEventListener('click', () => this.setSectionMode(0));
        document.getElementById('section-horizontal').addEventListener('click', () => this.setSectionMode(1));
        document.getElementById('section-vertical').addEventListener('click', () => this.setSectionMode(-1));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    setupVisibilitySlider() {
        const slider = document.getElementById('visibility-slider');
        const thumb = document.getElementById('visibility-thumb');
        const track = document.getElementById('visibility-track');
        
        const updateVisibility = (e) => {
            const rect = slider.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            // Visibility controls vizplane (0 to 17), matching Flash viewer
            // 0 = show nothing, 1 = show everything
            this.visibility = percentage;
            track.style.width = (percentage * 100) + '%';
            this.updateVisibility();
        };
        
        thumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDraggingVisibility = true;
            updateVisibility(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingVisibility) {
                updateVisibility(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDraggingVisibility = false;
        });
        
        slider.addEventListener('click', updateVisibility);
    }
    
    updateVisibility() {
        // Visibility controls the cutting plane, not layers
        this.renderGrid();
    }
    
    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(`tool-${tool}`).classList.add('selected');
    }
    
    setTheme(theme) {
        this.theme = theme;
        this.updateTheme();
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`[data-theme="${theme}"]`).classList.add('selected');
    }
    
    updateTheme() {
        const panels = ['left-panel', 'center-panel', 'right-panel'];
        panels.forEach(id => {
            const panel = document.getElementById(id);
            if (this.theme === 'red') {
                panel.classList.add('theme-red');
            } else {
                panel.classList.remove('theme-red');
            }
        });
    }
    
    setSectionMode(mode) {
        this.sectionMode = mode;
        document.querySelectorAll('.section-button').forEach(btn => btn.classList.remove('selected'));
        
        if (mode === 0) {
            document.getElementById('section-diagonal').classList.add('selected');
        } else if (mode === 1) {
            document.getElementById('section-horizontal').classList.add('selected');
        } else if (mode === -1) {
            document.getElementById('section-vertical').classList.add('selected');
        }
        
        this.renderGrid();
    }
    
    rotate(degrees) {
        this.rotation = (this.rotation + degrees + 360) % 360;
        if (this.renderer) {
            this.renderer.setRotation(this.rotation);
        }
        this.renderGrid();
    }
    
    renderFamilies() {
        const container = document.getElementById('block-families');
        container.innerHTML = '';
        
        blockFamilies.forEach(family => {
            const button = document.createElement('div');
            button.className = 'family-button';
            if (family.id === this.selectedFamily) {
                button.classList.add('selected');
            }
            
            const img = document.createElement('img');
            img.src = `content/blocks/${family.icon}.svg`;
            img.alt = family.name;
            img.onerror = () => {
                img.style.display = 'none';
                button.textContent = family.name.substring(0, 3).toUpperCase();
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
                button.style.color = '#ccc';
                button.style.fontSize = '10px';
            };
            
            button.appendChild(img);
            button.title = family.name;
            button.addEventListener('click', () => {
                this.selectedFamily = family.id;
                this.renderFamilies();
                this.renderVariants();
            });
            
            container.appendChild(button);
        });
    }
    
    renderVariants() {
        const container = document.getElementById('block-variants');
        container.innerHTML = '';
        
        const variants = getBlocksByFamily(this.selectedFamily);
        
        variants.forEach(blockId => {
            const button = document.createElement('div');
            button.className = 'variant-button';
            if (blockId === this.selectedBlock) {
                button.classList.add('selected');
            }
            
            const img = document.createElement('img');
            img.src = `content/blocks/${blockId}.svg`;
            const info = getBlockInfo(blockId);
            img.alt = info.name;
            img.onerror = () => {
                img.style.display = 'none';
                button.style.backgroundColor = info.color;
            };
            
            button.appendChild(img);
            button.title = info.name;
            button.addEventListener('click', () => {
                this.selectedBlock = blockId;
                this.renderVariants();
            });
            
            container.appendChild(button);
        });
    }
    
    preloadBlockImages() {
        // Preload some common blocks
        const commonBlocks = [1, 2, 3, 40, 41, 65, 100];
        commonBlocks.forEach(blockId => {
            this.renderer.loadBlockImage(blockId).catch(err => {
                console.warn(`Failed to load block ${blockId}:`, err);
            });
        });
    }
    
    startRenderLoop() {
        const render = () => {
            this.renderGrid();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    
    renderGrid() {
        if (!this.renderer) return;
        
        // Visibility controls vizplane (0 to 17), matching Flash viewer
        const vizplane = this.visibility * 17;
        
        // Get current max Z for hovered cell
        let currentMaxZ = 0;
        if (this.hoveredCell) {
            const { x, y } = this.hoveredCell;
            if (this.grid[x] && this.grid[x][y]) {
                for (let z = 0; z < this.maxLayers; z++) {
                    if (this.grid[x][y][z]) {
                        currentMaxZ = z;
                    }
                }
            }
        }
        
        this.renderer.render(this.grid, {
            gridSize: this.gridSize,
            vizplane: vizplane,
            sectionMode: this.sectionMode,
            hoverX: this.hoveredCell?.x,
            hoverY: this.hoveredCell?.y,
            hoverZ: this.hoveredCell ? this.hoverLayer : undefined,
            currentMaxZ: currentMaxZ
        });
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Step 1: Check all existing blocks from front to back, top to bottom
        let bestBlockHit = null;
        let bestBlockPriority = -Infinity;

        for (let gridX = 4; gridX >= -4; gridX--) {
            for (let gridY = 4; gridY >= -4; gridY--) {
                for (let z = this.maxLayers - 1; z >= 0; z--) {
                    if (this.grid[gridX]?.[gridY]?.[z]) {
                        const isoPos = this.renderer.toIso(gridX, gridY, z);
                        const dx = Math.abs(screenX - isoPos.x);
                        const dy = Math.abs(screenY - (isoPos.y + this.renderer.blockHeight / 2));

                        // Check if cursor is within the diamond shape of the block top
                        if (dx / this.renderer.tileWidth + dy / this.renderer.tileHeight <= 1) {
                            const priority = (gridY + gridX) * 1000 + z;
                            if (priority > bestBlockPriority) {
                                bestBlockPriority = priority;
                                bestBlockHit = { x: gridX, y: gridY, z: z };
                            }
                        }
                    }
                }
            }
        }

        // If we hit an existing block, select it
        if (bestBlockHit) {
            this.hoveredCell = { x: bestBlockHit.x, y: bestBlockHit.y };
            this.hoverLayer = bestBlockHit.z;
            this.renderMinimap();
            return;
        }

        // Step 2: No block was hit. Now check if we're in a "light beam zone"
        // Light beam is ONLY available when hovering vertically above an existing block in the same column
        
        for (let gridX = -4; gridX <= 4; gridX++) {
            for (let gridY = -4; gridY <= 4; gridY++) {
                // Find the highest block in this column
                let highestBlockZ = -1;
                for (let z = 0; z < this.maxLayers; z++) {
                    if (this.grid[gridX]?.[gridY]?.[z]) {
                        highestBlockZ = z;
                    }
                }

                // If there's at least one block in this column (or it's ground level)
                if (highestBlockZ >= -1) {
                    const groundPos = this.renderer.toIso(gridX, gridY, 0);
                    const topBlockPos = this.renderer.toIso(gridX, gridY, highestBlockZ >= 0 ? highestBlockZ : 0);
                    
                    // Check if cursor is within the vertical beam area (narrow horizontal range)
                    const horizontalDist = Math.abs(screenX - groundPos.x);
                    
                    // Tighter threshold for light beam - must be very close to column center
                    if (horizontalDist <= this.renderer.tileWidth / 2) {
                        // Check if cursor is above the top block
                        const layer7Pos = this.renderer.toIso(gridX, gridY, 7);
                        
                        if (screenY >= layer7Pos.y && screenY < topBlockPos.y) {
                            // Calculate Z position for placement
                            const yDiff = groundPos.y - screenY;
                            let calculatedZ = Math.round(yDiff / this.renderer.blockHeight);
                            calculatedZ = Math.max(0, Math.min(this.maxLayers - 1, calculatedZ));

                            // Only allow placement ABOVE the highest existing block
                            if (calculatedZ > highestBlockZ) {
                                const priority = (gridY + gridX) * 1000;
                                if (!bestBlockHit || priority > bestBlockPriority) {
                                    this.hoveredCell = { x: gridX, y: gridY };
                                    this.hoverLayer = calculatedZ;
                                    this.renderMinimap();
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }

        // No block and no light beam zone found
        this.hoveredCell = null;
    }
    
    handleCanvasClick(e) {
        if (!this.hoveredCell) return;
        
        const { x, y } = this.hoveredCell;
        
        if (this.currentTool === 'place') {
            this.placeBlock(x, y, this.hoverLayer);
        } else if (this.currentTool === 'delete') {
            this.deleteBlock(x, y, this.hoverLayer);
        } else if (this.currentTool === 'select') {
            this.selectBlock(x, y, this.hoverLayer);
        }
    }
    
    placeBlock(x, y, z) {
        if (!this.grid[x]) this.grid[x] = {};
        if (!this.grid[x][y]) this.grid[x][y] = {};
        
        // If there's already a block at this position, don't place
        if (this.grid[x][y][z]) {
            console.log('Block already exists at this position');
            return;
        }
        
        // Check if there's support below (except for ground layer z=0)
        if (z > 0) {
            let hasSupport = false;
            // Check all layers below to see if there's any block
            for (let checkZ = 0; checkZ < z; checkZ++) {
                if (this.grid[x][y][checkZ]) {
                    hasSupport = true;
                    break;
                }
            }
            
            if (!hasSupport) {
                console.log('Cannot place block without support below');
                return;
            }
        }
        
        this.grid[x][y][z] = this.selectedBlock;
        
        // Load the image for this block
        this.renderer.loadBlockImage(this.selectedBlock).catch(err => {
            console.warn(`Failed to load block ${this.selectedBlock}:`, err);
        });
        
        this.renderGrid();
        this.renderMinimap();
    }
    
    deleteBlock(x, y, z) {
        if (this.grid[x] && this.grid[x][y] && this.grid[x][y][z]) {
            delete this.grid[x][y][z];
            
            // Remove all blocks above this one
            for (let layer = z + 1; layer < this.maxLayers; layer++) {
                if (this.grid[x][y][layer]) {
                    delete this.grid[x][y][layer];
                }
            }
            
            this.renderGrid();
            this.renderMinimap();
        }
    }
    
    selectBlock(x, y, z) {
        if (this.grid[x] && this.grid[x][y] && this.grid[x][y][z]) {
            const blockId = this.grid[x][y][z];
            this.selectedBlock = blockId;
            
            const info = getBlockInfo(blockId);
            if (info.family) {
                this.selectedFamily = info.family;
            }
            
            this.renderFamilies();
            this.renderVariants();
        }
    }
    
    renderMinimap() {
        const container = document.getElementById('minimap-grid');
        container.innerHTML = '';
        
        for (let y = -4; y <= 4; y++) {
            for (let x = -4; x <= 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'minimap-cell';
                
                // Check if this cell has any blocks
                let hasBlocks = false;
                if (this.grid[x] && this.grid[x][y]) {
                    for (let z = 0; z < this.maxLayers; z++) {
                        if (this.grid[x][y][z]) {
                            hasBlocks = true;
                            break;
                        }
                    }
                }
                
                if (hasBlocks) {
                    cell.classList.add('filled');
                }
                
                if (this.hoveredCell && this.hoveredCell.x === x && this.hoveredCell.y === y) {
                    cell.classList.add('current');
                }
                
                container.appendChild(cell);
            }
        }
    }
    
    handleKeyboard(e) {
        if (!this.overlay.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                this.close();
                break;
            case 'r':
            case 'R':
                this.rotate(90);
                break;
            case 'q':
            case 'Q':
                this.rotate(-90);
                break;
            case '1':
                this.setTool('place');
                break;
            case '2':
                this.setTool('select');
                break;
            case '3':
                this.setTool('delete');
                break;
            case 'Delete':
            case 'Backspace':
                if (this.hoveredCell) {
                    this.deleteBlock(this.hoveredCell.x, this.hoveredCell.y, this.hoverLayer);
                }
                break;
        }
    }
    
    restore() {
        if (confirm('Restore to last saved state?')) {
            // TODO: Implement save/restore functionality
            this.initGrid();
            this.renderGrid();
            this.renderMinimap();
        }
    }
    
    submit() {
        const xml = this.generateXML();
        console.log('Generated XML:', xml);
        
        // Create download
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cityblock.xml';
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Block XML generated and downloaded!');
    }
    
    generateXML() {
        // Generate XML in the format specified in getblock.php
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        const title = encodeURIComponent(this.blockTitle);
        const desc = encodeURIComponent(this.blockDescription);
        
        let xml = `<cb_x_y date="${date}" citizen="true" emailaddress="builder@zanpo.com" `;
        xml += `owner="player" startz="1" starty="0" startx="0" `;
        xml += `desc="${desc}" title="${title}">`;
        
        // Group blocks by row (y coordinate)
        const minY = -4, maxY = 4;
        
        for (let y = minY; y <= maxY; y++) {
            const rowData = [];
            
            for (let x = -4; x <= 4; x++) {
                if (this.grid[x] && this.grid[x][y]) {
                    const cellData = [];
                    for (let z = 0; z < this.maxLayers; z++) {
                        if (this.grid[x][y][z]) {
                            cellData.push(`b_${z}="${this.grid[x][y][z]}"`);
                        }
                    }
                    
                    if (cellData.length > 0) {
                        rowData.push(`<c_${x} ${cellData.join(' ')} />`);
                    }
                }
            }
            
            if (rowData.length > 0) {
                xml += `<r_${y}>${rowData.join('')}</r_${y}>`;
            }
        }
        
        xml += '</cb_x_y>';
        return xml;
    }
    
    showTips() {
        alert(`ZANPO BUILDER TIPS:

• Click on the grid to place blocks
• Move mouse up/down to change layer height
• Yellow light shows where you can place
• Blocks need support below them
• Use tools: Place (1), Select (2), Delete (3)
• Rotate view: Q/R keys or buttons
• Press ESC to close builder

Have fun building your city!`);
    }
    
    show() {
        this.overlay.classList.add('active');
        if (!this.animationFrame) {
            this.startRenderLoop();
        }
    }
    
    close() {
        this.overlay.classList.remove('active');
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

// Global instance
let builderInstance = null;

// Function to start builder (called from index.php)
window.startBuilder = function() {
    if (!builderInstance) {
        builderInstance = new ZanpoBuilder();
        builderInstance.init();
    }
    builderInstance.show();
};

// Auto-start if in development
if (window.location.search.includes('builder=1')) {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.startBuilder(), 1000);
    });
}
