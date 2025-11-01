# Zanpo Builder - JavaScript Recreation

This is a JavaScript recreation of the Flash-based Zanpo city builder interface.

## Features

- **Isometric 3D Grid**: 9x9 grid with up to 10 vertical layers
- **Block Placement**: Click to place blocks with vertical layer detection
- **Block Families**: Organized block categories (Ground, Roads, Buildings, Nature, Decorations, Special)
- **Tools**: Place, Select, and Delete modes
- **Visibility Slider**: Control which layers are visible
- **Minimap**: Shows the current state of your block
- **Theme Switcher**: Toggle between default and red theme
- **XML Export**: Generate XML output compatible with the PHP backend

## Usage

### Starting the Builder

Click the "Open Builder" link in the main page, or call:
```javascript
window.startBuilder();
```

### Controls

#### Mouse
- **Left Click**: Place/Delete/Select block (depending on active tool)
- **Hover**: Shows placement guide and highlights cell

#### Keyboard
- **ESC**: Close builder
- **R**: Rotate view clockwise
- **Q**: Rotate view counter-clockwise
- **1**: Place tool
- **2**: Select tool
- **3**: Delete tool
- **Delete/Backspace**: Delete hovered block

#### Tools
- **Place (📦)**: Click to place the selected block
- **Select (👆)**: Click to select an existing block
- **Delete (❌)**: Click to remove a block

### Building Guidelines

1. **Ground Layer**: Start by placing ground blocks (layer 0)
2. **Vertical Placement**: Blocks need support below them - you can't place blocks in mid-air
3. **Layer Detection**: The yellow light shows where your block will be placed
4. **Visibility**: Use the slider to hide upper layers for easier building

### Block Families

- **Ground**: Grass, dirt, sand, water, stone, etc.
- **Roads**: Streets, paths, highways, bridges
- **Buildings**: Walls, windows, doors, roofs, columns
- **Nature**: Trees, bushes, flowers, rocks
- **Decorations**: Lamps, benches, signs, statues
- **Special**: Portals, elevators, platforms

### Exporting

Click the "Submit ➜" button to generate and download an XML file in the format:

```xml
<cb_x_y date="..." title="..." desc="...">
  <r_y>
    <c_x b_0="blockId" b_1="blockId" ... />
  </r_y>
</cb_x_y>
```

## File Structure

```
content/scripts/builder/
├── index.js              # Entry point
├── builder.js            # Main builder class
├── builder.css           # Styles
├── blockMetadata.js      # Block families and variants
└── isometricRenderer.js  # Canvas-based 3D renderer

content/blocks/
└── *.svg                 # Block sprite images
```

## Implementation Notes

### Isometric Rendering

The builder uses a canvas-based isometric renderer that:
- Converts 3D grid coordinates (x, y, z) to 2D isometric screen coordinates
- Renders blocks in depth-sorted order for proper layering
- Supports transparency for hidden layers

### Grid Coordinates

- **X**: -4 to 4 (left to right in isometric view)
- **Y**: -4 to 4 (top to bottom in isometric view)
- **Z**: 0 to 9 (vertical layers)

### XML Format

The XML output follows the format from `php/getblock.php`:
- Rows are tagged as `<r_y>` where y is the Y coordinate
- Columns are tagged as `<c_x>` where x is the X coordinate
- Blocks are attributes `b_z="blockId"` where z is the layer

## Browser Compatibility

- Modern browsers with ES6 module support
- Canvas 2D context required
- Tested on Chrome, Firefox, Safari

## Known Limitations

- Block metadata is currently example data
- Some block SVGs may not exist yet
- Rotation feature is prepared but not yet fully implemented
- Save/Restore functionality is a stub

## Future Enhancements

- [ ] Complete block metadata for all ~400 blocks
- [ ] Implement full rotation
- [ ] Add undo/redo
- [ ] Save/load functionality
- [ ] Copy/paste regions
- [ ] Multi-block selection
- [ ] Block search/filter
- [ ] Preview mode
- [ ] Lighting effects
- [ ] Shadow rendering
