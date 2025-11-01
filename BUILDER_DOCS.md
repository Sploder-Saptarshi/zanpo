# Zanpo Builder - Installation & Integration Guide

## Overview

The Zanpo Builder is a JavaScript recreation of the Flash-based city block builder. It overlays on top of the existing Flash application with a transparent background, providing a modern, browser-compatible interface for building city blocks.

## Installation

### Files Created

```
src/
├── content/scripts/builder/
│   ├── index.js              # Entry point (imports builder)
│   ├── builder.js            # Main builder class
│   ├── builder.css           # All styles
│   ├── blockMetadata.js      # Block families and metadata
│   ├── isometricRenderer.js  # Canvas-based 3D renderer
│   └── README.md             # Technical documentation
├── builder-test.html         # Standalone test page
└── QUICKSTART.md             # User guide

Integration with existing:
├── index.php                 # Updated to load builder scripts
└── content/blocks/           # Uses existing 387 SVG files
```

### Dependencies

The builder requires:
- Modern browser with ES6 module support
- Canvas 2D context
- No external libraries needed!

## Integration with index.php

The builder is already integrated into `index.php`:

```html
<!-- Zanpo Builder -->
<link rel="stylesheet" type="text/css" href="content/scripts/builder/builder.css" />
<script type="module" src="content/scripts/builder/index.js"></script>
<script type="module" src="content/scripts/builder/builder.js"></script>
```

The "Open Builder" link calls:
```html
<a onclick="startBuilder();" href="javascript:void(0);">Open Builder</a>
```

## Usage

### For Users

1. **Open Zanpo** in a modern browser
2. **Click "Open Builder"** in the navigation
3. **Build your city block** using the interface
4. **Submit** to download XML file

See `QUICKSTART.md` for detailed user instructions.

### For Developers

#### Starting the Builder Programmatically

```javascript
// The builder is available globally after page load
window.startBuilder();
```

#### Accessing the Builder Instance

```javascript
// Get the singleton instance
const builder = window.builderInstance;

// Example: Pre-load a block
builder.grid[0][0][0] = 65; // Place building block at center
builder.renderGrid();
```

#### Loading Saved Blocks

```javascript
// Parse XML and populate grid
function loadBlockFromXML(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    // Extract block data
    const rows = doc.querySelectorAll('r_*');
    rows.forEach(row => {
        const y = parseInt(row.tagName.split('_')[1]);
        const cols = row.querySelectorAll('c_*');
        
        cols.forEach(col => {
            const x = parseInt(col.tagName.split('_')[1]);
            
            // Get all block layers
            for (let z = 0; z < 10; z++) {
                const blockId = col.getAttribute(`b_${z}`);
                if (blockId) {
                    builder.grid[x][y][z] = parseInt(blockId);
                }
            }
        });
    });
    
    builder.renderGrid();
}
```

## Architecture

### Component Overview

```
┌─────────────────────────────────────────┐
│           ZanpoBuilder (Main)           │
│  - Grid management (9x9x10)             │
│  - Tool handling (place/select/delete)  │
│  - UI state management                  │
│  - XML export                           │
└──────────────┬──────────────────────────┘
               │
               ├── IsometricRenderer
               │   - Canvas drawing
               │   - 2D isometric projection
               │   - Block image loading
               │   - Depth sorting
               │
               └── BlockMetadata
                   - 387 blocks organized
                   - 6 family categories
                   - Auto-generated data
```

### Grid Coordinate System

```
   Y
   ↑
   │
   │    Z (vertical)
   │    ↑
   └────┼────→ X
        │
        ↓

Grid: -4 to +4 in X and Y
      0 to 9 in Z (layers)
```

### Data Structure

```javascript
{
  grid: {
    x: {
      y: {
        z: blockId  // e.g., grid[0][0][0] = 65
      }
    }
  }
}
```

### Rendering Pipeline

```
1. User interacts with canvas
2. Screen coords → Grid coords (fromIso)
3. Grid coords → Isometric coords (toIso)
4. Blocks sorted by depth
5. Canvas cleared and redrawn
6. Blocks rendered in order
7. Guides and highlights drawn
```

## Customization

### Adding New Block Families

Edit `blockMetadata.js`:

```javascript
blockFamilies.push({
    id: 'custom',
    name: 'Custom',
    icon: 400,
    variants: generateRange(400, 450)
});
```

### Changing Grid Size

Edit `builder.js` constructor:

```javascript
this.gridSize = 11; // Change from 9 to 11
this.maxLayers = 15; // Increase height
```

### Custom Themes

Add to `builder.css`:

```css
.builder-left-panel.theme-blue {
    background: linear-gradient(135deg, #1a2a4a 0%, #0a1a2a 100%);
}
```

Then in `builder.js`:

```javascript
setTheme('blue') {
    // Apply theme
}
```

## XML Format

The builder exports blocks in this format:

```xml
<cb_x_y 
    date="2024.11.01" 
    citizen="true" 
    emailaddress="builder@zanpo.com"
    owner="player" 
    startz="1" 
    starty="0" 
    startx="0"
    desc="Block%20Description" 
    title="Block%20Title">
    
    <r_-4>
        <c_-4 b_0="1" b_1="65" />
        <c_-3 b_0="1" />
    </r_-4>
    
    <r_-3>
        <c_-4 b_0="1" />
        <c_-3 b_0="1" b_1="65" b_2="68" />
    </r_-3>
    
    <!-- More rows... -->
    
</cb_x_y>
```

Where:
- `r_y`: Row at Y coordinate
- `c_x`: Column at X coordinate  
- `b_z`: Block ID at layer Z

## Testing

### Test Page

Open `builder-test.html` in a browser:

```bash
cd src
python3 -m http.server 8000
# Open http://localhost:8000/builder-test.html
```

### Integration Test

Start the full application:

```bash
# Using Docker
docker-compose -f docker-compose-dev.yaml up

# Or with PHP built-in server
cd src
php -S localhost:8000
# Open http://localhost:8000/index.php
```

### Browser Console Testing

```javascript
// Test builder initialization
window.startBuilder();

// Place a test block
builderInstance.grid[0][0][0] = 65;
builderInstance.renderGrid();

// Export XML
console.log(builderInstance.generateXML());
```

## Performance

### Optimization Features

- **Lazy Loading**: Block images loaded on-demand
- **Request Animation Frame**: Smooth 60fps rendering
- **Depth Sorting**: Efficient O(n log n) sort
- **Canvas Reuse**: Single canvas element
- **Event Delegation**: Minimal event listeners

### Browser Support

✅ Chrome 80+
✅ Firefox 75+
✅ Safari 13+
✅ Edge 80+

❌ IE 11 (no module support)

## Troubleshooting

### Builder Won't Open

**Symptoms**: Click does nothing
**Check**:
1. Browser console for errors
2. Network tab - scripts loaded?
3. ES6 modules supported?

**Fix**: Use modern browser or transpile to ES5

### Blocks Not Appearing

**Symptoms**: Placed blocks invisible
**Check**:
1. SVG files in `content/blocks/`
2. Network 404 errors
3. Visibility slider position

**Fix**: Ensure SVG files exist, check paths

### Performance Issues

**Symptoms**: Laggy interaction
**Check**:
1. Too many blocks (>1000)?
2. Large block images?
3. Browser GPU acceleration?

**Fix**: Optimize images, enable hardware acceleration

### XML Export Fails

**Symptoms**: Download doesn't work
**Check**:
1. Browser popup blocker
2. Console errors
3. Grid has data?

**Fix**: Allow downloads, check grid state

## API Reference

### ZanpoBuilder Class

```javascript
// Constructor
new ZanpoBuilder()

// Methods
.init()                        // Initialize builder
.show()                        // Show overlay
.close()                       // Hide overlay
.placeBlock(x, y, z)          // Place block at position
.deleteBlock(x, y, z)         // Remove block
.selectBlock(x, y, z)         // Select block
.setTool(tool)                // Change tool ('place'|'select'|'delete')
.rotate(degrees)              // Rotate view
.setTheme(theme)              // Change theme
.generateXML()                // Export to XML
.renderGrid()                 // Redraw canvas
```

### IsometricRenderer Class

```javascript
// Constructor
new IsometricRenderer(canvas, options)

// Methods
.toIso(x, y, z)              // Grid → Screen coords
.fromIso(screenX, screenY)   // Screen → Grid coords
.loadBlockImage(blockId)     // Load block sprite
.render(grid, options)       // Draw scene
.drawBlock(x, y, z, blockId) // Draw single block
.drawGrid(size)              // Draw grid lines
```

## Contributing

To extend the builder:

1. **Fork the repository**
2. **Add your feature** in a new file
3. **Import in builder.js**
4. **Test thoroughly**
5. **Submit pull request**

Example addition:

```javascript
// content/scripts/builder/myFeature.js
export class MyFeature {
    constructor(builder) {
        this.builder = builder;
    }
    
    doSomething() {
        // Your code
    }
}

// In builder.js
import { MyFeature } from './myFeature.js';
// Use in ZanpoBuilder class
```

## Future Enhancements

Planned features:

- [ ] Undo/Redo system
- [ ] Copy/Paste regions
- [ ] Block search/filter
- [ ] Templates library
- [ ] Multi-select blocks
- [ ] 3D rotation (not just view)
- [ ] Lighting/shadow system
- [ ] Collaborative editing
- [ ] Cloud save/load
- [ ] Mobile touch support

## License

Copyright © 2003 Geoff Gaudreault. All Rights Reserved.

This is a modernization of the original Flash-based Zanpo builder.

## Support

- **Documentation**: See README.md and QUICKSTART.md
- **Issues**: Check browser console
- **Contact**: zanpo.emperor [at] gmail.com

---

**Built with ❤️ for the Zanpo community**
