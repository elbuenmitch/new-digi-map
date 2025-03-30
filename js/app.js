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
                color: '#FFC580',
                showName: true,
                nextId: 1
            },
            Barrier: {
                color: '#444444',
                showName: false,
                nextId: 1
            }
        };
        
        // Active element type (default: Location)
        this.activeElementType = 'Location';
        
        // Store all elements created
        this.elements = [];
        
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
                console.log('Settings button clicked with error handling');
                
                // Check if settings object exists
                if (!this.settings) {
                    console.error('Error: Settings object is undefined');
                    return;
                }
                
                // Check if the openSettingsModal method exists
                if (typeof this.settings.openSettingsModal !== 'function') {
                    console.error('Error: openSettingsModal is not a function');
                    console.log('settings object:', this.settings);
                    return;
                }
                
                // Log the settings modal element state
                const modal = document.getElementById('settings-modal');
                console.log('Settings modal element:', modal);
                console.log('Settings modal visibility:', modal.classList.contains('hidden') ? 'hidden' : 'visible');
                
                // Call the method with proper logging
                console.log('Attempting to open settings modal...');
                this.settings.openSettingsModal();
                console.log('Settings modal open method called successfully');
            } catch (error) {
                console.error('Error opening settings modal:', error);
                alert('There was an error opening the settings. Please check the console for details.');
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
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
