// Main application controller
import { CanvasManager } from './canvas.js';
import { MenuManager } from './menu.js';
import { SettingsManager } from './settings.js';
import { SVGExporter } from './export.js';
import { DatabaseManager } from './database.js';
import { SaveDialog } from './save-dialog.js';
import { LoadDialog } from './load-dialog.js';

class App {
    constructor() {
        // Initialize the application components
        this.settings = new SettingsManager(this);
        this.canvas = new CanvasManager(this);
        this.menu = new MenuManager(this);
        this.exporter = new SVGExporter(this);
        this.database = new DatabaseManager();
        this.saveDialog = new SaveDialog(this);
        this.loadDialog = new LoadDialog(this);
        
        // Element types configuration
        this.elementTypes = {
            Location: {
                color: '#FFDDB3',
                showName: true,
                nextId: 1
            },
            Barrier: {
                color: '#787878',
                showName: false,
                nextId: 1
            }
        };
        
        // Active element type (default: Location)
        this.activeElementType = 'Location';
        
        // Store all elements created
        this.elements = [];
        
        // Background image state
        this.backgroundImage = {
            url: null,
            opacity: 1.0,
            showImage: true,
            originalWidth: 0,
            originalHeight: 0,
            element: null,
            pendingFile: null
        };
        
        // Current map information
        this.currentCentercode = null;
        this.currentFloor = null;
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Element type selection
        document.querySelectorAll('.tool-button[data-type]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.setActiveElementType(e.currentTarget.dataset.type);
                
                // Automatically activate the draw tool when selecting an element type
                document.querySelectorAll('.tool-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.getElementById('draw-tool').classList.add('active');
            });
        });
        
        // Tool selection (select, draw, pan)
        document.getElementById('select-tool').addEventListener('click', () => {
            this.setActiveToolButton('select-tool');
        });
        
        document.getElementById('draw-tool').addEventListener('click', () => {
            this.setActiveToolButton('draw-tool');
        });
        
        document.getElementById('pan-tool').addEventListener('click', () => {
            this.setActiveToolButton('pan-tool');
        });
        
        // Settings button with enhanced error handling
        document.getElementById('settings-btn').addEventListener('click', () => {
            try {
                // Settings button clicked with error handling
                
                // Check if settings object exists
                if (!this.settings) {
                    // Error: Settings object is undefined
                    return;
                }
                
                // Check if the openSettingsModal method exists
                if (typeof this.settings.openSettingsModal !== 'function') {
                    // Error: openSettingsModal is not a function
                    // Debugging settings object reference
                    return;
                }
                
                // Log the settings modal element state
                const modal = document.getElementById('settings-modal');
                // Referencing settings modal element
                // Check settings modal visibility
                
                // Call the method with proper logging
                // Attempting to open settings modal
                this.settings.openSettingsModal();
                // Settings modal open method called successfully
            } catch (error) {
                // Error opening settings modal
                alert('There was an error opening the settings.');
            }
        });
        
        // Export SVG button
        document.getElementById('export-svg-btn').addEventListener('click', () => {
            this.exporter.exportSVG();
        });
        
        // Save to DB button
        document.getElementById('save-svg-btn') && 
        document.getElementById('save-svg-btn').addEventListener('click', () => {
            this.saveDialog.openDialog();
        });
        
        // Load from DB button
        document.getElementById('load-svg-btn') && 
        document.getElementById('load-svg-btn').addEventListener('click', () => {
            this.loadDialog.openDialog();
        });
        
        // Search functionality
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = e.target.value.trim();
                if (searchTerm) {
                    this.searchAndHighlightElement(searchTerm);
                }
            }
        });
    }
    
    setActiveElementType(type) {
        if (this.elementTypes[type]) {
            this.activeElementType = type;
            
            // Update UI to reflect active type
            document.querySelectorAll('.tool-button[data-type]').forEach(button => {
                if (button.dataset.type === type) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }
    
    setActiveToolButton(toolId) {
        // Update the navigation tool buttons
        document.querySelectorAll('.tool-section:nth-child(2) .tool-button').forEach(button => {
            if (button.id === toolId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    generateUniqueId(type) {
        // Generate a unique ID for a new element
        const nextId = this.elementTypes[type].nextId++;
        return `${type.toLowerCase()}_${nextId}`;
    }
    
    isIdUnique(id, currentElementId = null) {
        // Check if an ID is unique (excluding the current element when editing)
        return !this.elements.some(element => 
            element.id === id && element.id !== currentElementId
        );
    }
    
    searchAndHighlightElement(id) {
        // Clear any existing highlights
        document.querySelectorAll('.canvas-element.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Find the element by ID
        const element = this.elements.find(el => el.id === id);
        if (element) {
            // Highlight the element
            const elementDom = document.getElementById(`element-${element.id}`);
            if (elementDom) {
                elementDom.classList.add('highlighted');
                
                // Center the element in the canvas view
                this.canvas.centerElementInView(element);
                
                return true;
            }
        }
        
        // Show 'no results' indicator
        this.showNoSearchResults();
        
        return false;
    }
    
    showNoSearchResults() {
        let noResultsEl = document.getElementById('search-no-results');
        
        if (!noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.id = 'search-no-results';
            noResultsEl.className = 'search-no-results';
            noResultsEl.textContent = 'No matching elements found';
            document.body.appendChild(noResultsEl);
        }
        
        // Show the notification
        noResultsEl.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            noResultsEl.classList.remove('visible');
        }, 3000);
    }
    
    getCellSize() {
        return this.settings.getCellSize();
    }
    
    getCanvasWidth() {
        return this.settings.getCanvasWidth();
    }
    
    getCanvasHeight() {
        return this.settings.getCanvasHeight();
    }
    
    getZoomStepSize() {
        return this.settings.getZoomStepSize();
    }
    
    /**
     * Process and set background image from a file
     * @param {File} file - The image file
     * @returns {Promise<Object>} Image dimensions
     */
    async setBackgroundImageFromFile(file) {
        if (!file || !file.type.match('image.*')) {
            throw new Error('Invalid image file');
        }
        
        // Store the file for later upload if map is saved
        this.backgroundImage.pendingFile = file;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Store dimensions
                    this.backgroundImage.originalWidth = img.width;
                    this.backgroundImage.originalHeight = img.height;
                    this.backgroundImage.url = e.target.result;
                    
                    // Adjust canvas size if needed to fit the image
                    if (this.elements.length === 0) {
                        this.adjustCanvasToImage(img.width, img.height);
                    }
                    
                    // Display the image
                    this.canvas.setBackgroundImage(
                        e.target.result,
                        this.backgroundImage.opacity,
                        this.backgroundImage.showImage,
                        img.width,
                        img.height
                    );
                    
                    resolve({
                        width: img.width,
                        height: img.height
                    });
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read image file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Adjust canvas dimensions to fit the image
     * @param {number} imageWidth - Original image width
     * @param {number} imageHeight - Original image height
     * @returns {boolean} Whether canvas was resized
     */
    adjustCanvasToImage(imageWidth, imageHeight) {
        // Only adjust if no elements exist
        if (this.elements.length > 0) {
            return false;
        }
        
        const cellSize = this.getCellSize();
        
        // Calculate cells needed for width and height
        const widthInCells = Math.ceil(imageWidth / cellSize);
        const heightInCells = Math.ceil(imageHeight / cellSize);
        
        // Update settings
        this.settings.canvasWidth = widthInCells;
        this.settings.canvasHeight = heightInCells;
        
        // Redraw canvas with new dimensions
        this.canvas.updateCanvasDimensions();
        this.canvas.drawGrid();
        
        return true;
    }
    
    /**
     * Set background image opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setBackgroundImageOpacity(opacity) {
        if (opacity < 0) opacity = 0;
        if (opacity > 1) opacity = 1;
        
        this.backgroundImage.opacity = opacity;
        this.canvas.updateBackgroundImageOpacity(opacity);
        
        // If we have a saved map, update in database
        if (this.currentCentercode && this.currentFloor) {
            this.database.updateBackgroundImageSettings(this.currentCentercode, this.currentFloor, {
                opacity: opacity
            }).catch(error => console.error('Error updating image opacity:', error));
        }
    }
    
    /**
     * Toggle background image visibility
     * @param {boolean} visible - Visibility state
     */
    toggleBackgroundImageVisibility(visible) {
        this.backgroundImage.showImage = visible;
        this.canvas.toggleBackgroundImageVisibility(visible);
        
        // If we have a saved map, update in database
        if (this.currentCentercode && this.currentFloor) {
            this.database.updateBackgroundImageSettings(this.currentCentercode, this.currentFloor, {
                showImage: visible
            }).catch(error => console.error('Error updating image visibility:', error));
        }
    }
    
    /**
     * Save background image to database
     * @returns {Promise<boolean>} Success state
     */
    async saveBackgroundImage() {
        if (!this.currentCentercode || !this.currentFloor) {
            throw new Error('No active map to associate image with');
        }
        
        if (!this.backgroundImage.pendingFile && !this.backgroundImage.url) {
            return false; // Nothing to save
        }
        
        try {
            // Upload image file if we have one
            if (this.backgroundImage.pendingFile) {
                const metadata = {
                    opacity: this.backgroundImage.opacity,
                    showImage: this.backgroundImage.showImage,
                    originalWidth: this.backgroundImage.originalWidth,
                    originalHeight: this.backgroundImage.originalHeight
                };
                
                const imageData = await this.database.uploadBackgroundImage(
                    this.currentCentercode,
                    this.currentFloor,
                    this.backgroundImage.pendingFile,
                    metadata
                );
                
                // Update our state with the stored data
                this.backgroundImage.url = imageData.publicUrl;
                this.backgroundImage.pendingFile = null; // Clear pending file
                
                return true;
            } else if (this.backgroundImage.url) {
                // We have a URL but no file, just update settings
                await this.database.updateBackgroundImageSettings(
                    this.currentCentercode,
                    this.currentFloor,
                    {
                        opacity: this.backgroundImage.opacity,
                        showImage: this.backgroundImage.showImage
                    }
                );
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error saving background image:', error);
            throw error;
        }
    }
    
    /**
     * Load background image for the current map
     * @param {string} centercode - Map centercode
     * @param {string} floor - Map floor
     * @returns {Promise<boolean>} Success state
     */
    async loadBackgroundImage(centercode, floor) {
        try {
            // Set current map info
            this.currentCentercode = centercode;
            this.currentFloor = floor;
            
            // Check if there's an image for this map
            const imageData = await this.database.getBackgroundImage(centercode, floor);
            
            if (imageData) {
                // Check if the publicUrl is valid
                if (!imageData.publicUrl) {
                    this.clearBackgroundImage();
                    return false;
                }
                
                let imageUrl = imageData.publicUrl;
                
                // Reset previous image state
                this.backgroundImage = {
                    url: imageUrl,
                    opacity: imageData.opacity || 1.0,
                    showImage: imageData.show_image !== undefined ? imageData.show_image : true,
                    originalWidth: imageData.original_width || 0,
                    originalHeight: imageData.original_height || 0,
                    element: null,
                    pendingFile: null
                };
                
                // Display the image with error handling
                try {
                    this.canvas.setBackgroundImage(
                        imageUrl,
                        this.backgroundImage.opacity,
                        this.backgroundImage.showImage,
                        this.backgroundImage.originalWidth,
                        this.backgroundImage.originalHeight
                    );
                    return true;
                } catch (imageError) {
                    this.clearBackgroundImage();
                    return false;
                }
            } else {
                // No image for this map
                this.clearBackgroundImage();
                return false;
            }
        } catch (error) {
            console.error('Error loading background image:', error);
            this.clearBackgroundImage();
            return false;
        }
    }
    
    /**
     * Clear background image
     */
    clearBackgroundImage() {
        this.backgroundImage = {
            url: null,
            opacity: 1.0,
            showImage: true,
            originalWidth: 0,
            originalHeight: 0,
            element: null,
            pendingFile: null
        };
        
        this.canvas.clearBackgroundImage();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
