// SVG Exporter - handles exporting the canvas elements to SVG format
export class SVGExporter {
    constructor(app) {
        this.app = app;
    }
    
    exportSVG() {
        // Create SVG content
        const svgContent = this.generateSVG();
        
        // Create a Blob with the SVG content
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canvas_export.svg';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    generateSVG() {
        // Get canvas dimensions
        const width = this.app.canvas.canvasSize.width;
        const height = this.app.canvas.canvasSize.height;
        
        // Create SVG header
        let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <title>Canvas Export</title>
    <desc>Exported from SVG Shape Editor</desc>
    
`;
        
        // Add each element to the SVG
        this.app.elements.forEach(element => {
            // Create an SVG rectangle for each element
            svg += this.createSVGElement(element);
        });
        
        // Close SVG
        svg += '</svg>';
        
        return svg;
    }
    
    createSVGElement(element) {
        // Convert element to SVG rectangle
        let svgElement = `    <rect
        id="${element.id}"
        x="${element.x}"
        y="${element.y}"
        width="${element.width}"
        height="${element.height}"
        fill="${element.color}"
        stroke="rgba(0, 0, 0, 0.2)"
        stroke-width="2"
        data-type="${element.type}"
    />
`;

        // Add text element for ID if showName is true
        if (element.showName) {
            const textX = element.x + element.width / 2;
            const textY = element.y + element.height / 2;
            
            svgElement += `    <text
        x="${textX}"
        y="${textY}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#333333"
    >${element.id}</text>
`;
        }
        
        return svgElement;
    }
}
