// Grid Manager - handles grid rendering and visibility
export class GridManager {
    constructor(canvas, app) {
        this.canvas = canvas;
        this.app = app;
    }
    
    // Draw the grid based on cell size and canvas dimensions
    drawGrid() {
        // Clear existing grid
        this.canvas.querySelectorAll('.grid-line').forEach(line => line.remove());
        this.canvas.querySelectorAll('.grid-container').forEach(container => container.remove());
        
        // Get cell size and canvas dimensions
        const cellSize = this.app.getCellSize();
        const canvasWidth = this.app.getCanvasWidth() * cellSize;
        const canvasHeight = this.app.getCanvasHeight() * cellSize;
        
        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        
        // Set initial visibility based on settings
        if (this.app.settings && typeof this.app.settings.gridVisible !== 'undefined') {
            gridContainer.style.display = this.app.settings.gridVisible ? 'block' : 'none';
        }
        
        // Make sure grid is behind all elements
        gridContainer.style.zIndex = '1';
        
        // Draw horizontal grid lines at fixed cell size intervals
        for (let y = 0; y <= canvasHeight; y += cellSize) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal';
            line.style.top = `${y}px`;
            gridContainer.appendChild(line);
        }
        
        // Draw vertical grid lines at fixed cell size intervals
        for (let x = 0; x <= canvasWidth; x += cellSize) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical';
            line.style.left = `${x}px`;
            gridContainer.appendChild(line);
        }
        
        // Add grid as the first child of canvas to ensure it's behind elements
        if (this.canvas.firstChild) {
            this.canvas.insertBefore(gridContainer, this.canvas.firstChild);
        } else {
            this.canvas.appendChild(gridContainer);
        }
    }
    
    // Update grid visibility without redrawing
    updateGridVisibility(visible) {
        const gridContainer = this.canvas.querySelector('.grid-container');
        if (gridContainer) {
            gridContainer.style.display = visible ? 'block' : 'none';
        } else {
            // If grid container doesn't exist, redraw it
            this.drawGrid();
        }
    }
    
    // Snap a coordinate value to the nearest grid point
    snapToGrid(value) {
        const cellSize = this.app.getCellSize();
        return Math.round(value / cellSize) * cellSize;
    }
    
    // Snap a position object (x, y) to grid
    snapPositionToGrid(position) {
        return {
            x: this.snapToGrid(position.x),
            y: this.snapToGrid(position.y)
        };
    }
    
    // Snap element dimensions to grid
    snapDimensionsToGrid(width, height) {
        return {
            width: Math.max(this.app.getCellSize(), this.snapToGrid(width)),
            height: Math.max(this.app.getCellSize(), this.snapToGrid(height))
        };
    }
}
