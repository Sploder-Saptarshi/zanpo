// Block metadata for the Zanpo builder
// This defines families, variants, and block properties

// Generate ranges for block families
function generateRange(start, end) {
    const range = [];
    for (let i = start; i <= end; i++) {
        range.push(i);
    }
    return range;
}

export const blockFamilies = [
    {
        id: 'ground',
        name: 'Ground',
        icon: 1,
        variants: generateRange(1, 39)
    },
    {
        id: 'roads',
        name: 'Roads',
        icon: 40,
        variants: generateRange(40, 64)
    },
    {
        id: 'buildings',
        name: 'Buildings',
        icon: 65,
        variants: generateRange(65, 149)
    },
    {
        id: 'nature',
        name: 'Nature',
        icon: 150,
        variants: generateRange(150, 199)
    },
    {
        id: 'decorations',
        name: 'Decorations',
        icon: 200,
        variants: generateRange(200, 299)
    },
    {
        id: 'special',
        name: 'Special',
        icon: 300,
        variants: generateRange(300, 387)
    }
];

// Generate block data for all blocks
export const blockData = {};

// Auto-generate data for all blocks
for (let i = 1; i <= 387; i++) {
    let family = 'ground';
    let color = '#808080';
    
    if (i >= 1 && i <= 39) {
        family = 'ground';
        color = '#7CFC00';
    } else if (i >= 40 && i <= 64) {
        family = 'roads';
        color = '#404040';
    } else if (i >= 65 && i <= 149) {
        family = 'buildings';
        color = '#BEBEBE';
    } else if (i >= 150 && i <= 199) {
        family = 'nature';
        color = '#228B22';
    } else if (i >= 200 && i <= 299) {
        family = 'decorations';
        color = '#FFD700';
    } else if (i >= 300 && i <= 387) {
        family = 'special';
        color = '#9370DB';
    }
    
    blockData[i] = {
        name: `Block ${i}`,
        family: family,
        color: color
    };
}

export function getBlockInfo(blockId) {
    return blockData[blockId] || { name: 'Unknown', family: 'unknown', color: '#808080' };
}

export function getBlocksByFamily(familyId) {
    const family = blockFamilies.find(f => f.id === familyId);
    return family ? family.variants : [];
}
