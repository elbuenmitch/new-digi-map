// Canvas manager - handles the drawing canvas and element interactions
import { UIManager } from './ui-manager.js';
import { GridManager } from './grid-manager.js';
import { ElementManager } from './element-manager.js';

export class CanvasManager {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('canvas');
        this.canvasContainer = document.querySelector('.canvas-container');
        
        // Canvas state
        this.scale = 1; // Zoom level
        this.offset = { x: 0, y: 0 }; // Pan offset
        this.isDragging = false;
        this.isPanning = false;
        this.dragStart = { x: 0, y: 0 };
        
        // Mouse position tracking for cursor-centered zoom
        this.mousePosition = { x: 0, y: 0 };
        this.selectedElement = null;
        
        // Canvas state for drag operations
        this.isMultiDragging = false;
        
        // Selection rectangle state
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionRect = null; // DOM element for selection marquee
        
        // Background image container
        this.backgroundImageContainer = null;
        
        // UI manager for popups and notifications
        this.uiManager = new UIManager();
        
        // Grid manager for grid rendering and snapping
        this.gridManager = new GridManager(this.canvas, this.app);
        
        // Element manager for element operations
        this.elementManager = new ElementManager(this.app, this.canvas, this.gridManager, this.uiManager);
        
        // Set initial canvas dimensions based on cell size and canvas size in cells
        this.updateCanvasDimensions();
        
        this.setupCanvas();
        this.gridManager.drawGrid();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        // Set canvas size
        this.updateCanvasDimensions();
        
        // Center the canvas initially
        this.centerCanvas();
    }
    
    updateCanvasDimensions() {
        // Calculate canvas dimensions based on cell size and number of cells
        const cellSize = this.app.getCellSize();
        const canvasWidth = this.app.getCanvasWidth();
        const canvasHeight = this.app.getCanvasHeight();
        
        this.canvasSize = {
            width: cellSize * canvasWidth,
            height: cellSize * canvasHeight
        };
        
        // Apply dimensions to canvas element
        this.canvas.style.width = `${this.canvasSize.width}px`;
        this.canvas.style.height = `${this.canvasSize.height}px`;
        
        // Canvas dimensions updated
    }
    
    centerCanvas() {
        const containerWidth = this.canvasContainer.clientWidth;
        const containerHeight = this.canvasContainer.clientHeight;
        
        this.offset.x = (containerWidth - this.canvasSize.width) / 2;
        this.offset.y = (containerHeight - this.canvasSize.height) / 2;
        
        this.updateCanvasPosition();
    }
    
    updateCanvasPosition() {
        this.canvas.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.scale})`;
    }
    
    /**
     * Clear all elements from the canvas
     */
    clearElements() {
        // Remove all element DOM objects from the canvas
        const elementDOMs = document.querySelectorAll('.canvas-element');
        elementDOMs.forEach(el => el.remove());
        
        // Clear selected elements in the element manager
        if (this.elementManager) {
            this.elementManager.selectedElements = [];
        }
        
        // Hide any open popups
        this.hideElementPopup();
        
        // Reset app element type counters
        for (const type in this.app.elementTypes) {
            if (Object.prototype.hasOwnProperty.call(this.app.elementTypes, type)) {
                this.app.elementTypes[type].nextId = 1;
            }
        }
        
        // All elements cleared from canvas
    }
    
    /**
     * Reset the canvas viewport to default settings
     */
    resetViewport() {
        // Reset zoom level
        this.scale = 1;
        
        // Update canvas dimensions based on settings
        this.updateCanvasDimensions();
        
        // Re-center the canvas
        this.centerCanvas();
        
        // Redraw the grid with updated settings
        this.gridManager.drawGrid();
        
        // Canvas viewport reset to default
    }
    
    /**
     * Initialize or get the background image container
     * @returns {HTMLElement} The background image container
     */
    initBackgroundImageContainer() {
        // If container already exists, return it
        if (this.backgroundImageContainer) {
            return this.backgroundImageContainer;
        }
        
        // Create container for background image
        this.backgroundImageContainer = document.createElement('div');
        this.backgroundImageContainer.id = 'background-image-container';
        this.backgroundImageContainer.style.position = 'absolute';
        this.backgroundImageContainer.style.top = '0';
        this.backgroundImageContainer.style.left = '0';
        this.backgroundImageContainer.style.width = '100%';
        this.backgroundImageContainer.style.height = '100%';
        this.backgroundImageContainer.style.zIndex = '-1'; // Below grid and elements
        this.backgroundImageContainer.style.pointerEvents = 'none'; // Don't capture mouse events
        this.backgroundImageContainer.style.transformOrigin = 'top left';
        
        // Insert at the beginning of the canvas so it's behind everything
        this.canvas.insertBefore(this.backgroundImageContainer, this.canvas.firstChild);
        
        return this.backgroundImageContainer;
    }
    
    /**
     * Set background image from URL
     * @param {string} imageUrl - The image URL (data URL or remote URL)
     * @param {number} opacity - Opacity (0-1)
     * @param {boolean} showImage - Whether to show the image
     * @param {number} originalWidth - Original image width
     * @param {number} originalHeight - Original image height
     */
    setBackgroundImage(imageUrl, opacity = 1.0, showImage = true, originalWidth = 0, originalHeight = 0) {
        if (!imageUrl) {
            return;
        }
        
        // Fix potential URL encoding issues by trying to properly format the URL
        try {
            // Replace any double encoded characters
            const cleanUrl = decodeURIComponent(encodeURIComponent(imageUrl));
            
            // Initialize container if needed
            const container = this.initBackgroundImageContainer();
            
            // Clear any existing image
            this.clearBackgroundImage();
            
            // Create image element with error handling
            const img = document.createElement('img');
            img.id = 'background-image';
            
            // Set the image source
            img.src = cleanUrl;
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.opacity = opacity.toString();
            img.style.display = showImage ? 'block' : 'none';
            
            // Add to container
            container.appendChild(img);
            
            // Store reference to image
            this.app.backgroundImage.element = img;
            
            // Store original dimensions
            this.app.backgroundImage.originalWidth = originalWidth;
            this.app.backgroundImage.originalHeight = originalHeight;
        } catch (error) {
            // Silently handle errors
        }
    }
    
    /**
     * Clear background image
     */
    clearBackgroundImage() {
        const container = this.backgroundImageContainer;
        if (container) {
            // Remove all children
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
        
        // Clear reference to image element
        if (this.app.backgroundImage) {
            this.app.backgroundImage.element = null;
        }
    }
    
    /**
     * Update background image opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    updateBackgroundImageOpacity(opacity) {
        if (!this.backgroundImageContainer) return;
        
        const img = this.backgroundImageContainer.querySelector('#background-image');
        if (img) {
            img.style.opacity = opacity.toString();
        }
    }
    
    /**
     * Toggle background image visibility
     * @param {boolean} visible - Whether to show the image
     */
    toggleBackgroundImageVisibility(visible) {
        if (!this.backgroundImageContainer) return;
        
        const img = this.backgroundImageContainer.querySelector('#background-image');
        if (img) {
            img.style.display = visible ? 'block' : 'none';
        }
    }
    
    // Delegate grid drawing to grid manager
    drawGrid() {
        // Update canvas dimensions first (in case canvas size changed)
        this.updateCanvasDimensions();
        this.gridManager.drawGrid();
    }
    
    // Delegate grid visibility to grid manager
    updateGridVisibility(visible) {
        this.gridManager.updateGridVisibility(visible);
    }
    
    // Check if two elements overlap
    checkOverlap(element1, element2) {
        return !(
            element1.x + element1.width <= element2.x ||
            element1.x >= element2.x + element2.width ||
            element1.y + element1.height <= element2.y ||
            element1.y >= element2.y + element2.height
        );
    }
    
    // Check if an element overlaps with any existing elements
    checkOverlap(newElement) {
        return this.app.elements.some(element => {
            return !(
                newElement.x + newElement.width <= element.x ||
                newElement.x >= element.x + element.width ||
                newElement.y + newElement.height <= element.y ||
                newElement.y >= element.y + element.height
            );
        });
    }
    
    // Show warning about element overlap
    showOverlapWarning() {
        const warningEl = document.createElement('div');
        warningEl.className = 'overlap-warning';
        warningEl.textContent = 'Elements cannot overlap!';
        warningEl.style.position = 'fixed';
        warningEl.style.top = '20px';
        warningEl.style.left = '50%';
        warningEl.style.transform = 'translateX(-50%)';
        warningEl.style.backgroundColor = '#e74c3c';
        warningEl.style.color = 'white';
        warningEl.style.padding = '10px 20px';
        warningEl.style.borderRadius = '5px';
        warningEl.style.zIndex = '1000';
        
        document.body.appendChild(warningEl);
        
        // Remove after 2 seconds
        setTimeout(() => {
            warningEl.style.opacity = '0';
            warningEl.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(warningEl);
            }, 500);
        }, 2000);
    }
    
    // Show warning about element overlap during resize
    showResizeOverlapWarning() {
        const warningEl = document.createElement('div');
        warningEl.className = 'overlap-warning';
        warningEl.textContent = 'Cannot resize: would overlap with other elements!';
        warningEl.style.position = 'fixed';
        warningEl.style.top = '20px';
        warningEl.style.left = '50%';
        warningEl.style.transform = 'translateX(-50%)';
        warningEl.style.backgroundColor = '#e74c3c';
        warningEl.style.color = 'white';
        warningEl.style.padding = '10px 20px';
        warningEl.style.borderRadius = '5px';
        warningEl.style.zIndex = '1000';
        
        document.body.appendChild(warningEl);
        
        // Remove after 2 seconds
        setTimeout(() => {
            warningEl.style.opacity = '0';
            warningEl.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(warningEl);
            }, 500);
        }, 2000);
    }
    
    // Handle multi-selection of elements with shift key
    handleElementMultiSelect(element, elementEl) {
        // Toggle element selection using the ElementManager
        if (!this.elementManager.isElementSelected(element)) {
            this.elementManager.selectElement(element, true); // true for add to selection
        } else {
            // For deselection, we need to handle DOM update here
            const index = this.elementManager.selectedElements.findIndex(el => el.id === element.id);
            if (index !== -1) {
                this.elementManager.selectedElements.splice(index, 1);
                elementEl.classList.remove('selected');
            }
        }
        
        // Hide element popup when multi-selecting
        this.hideElementPopup();
        
        // Update UI for multi-selection
        this.updateMultiSelectionUI();
    }
    
    // Handle single element selection and possible dragging
    handleElementSelect(element, elementEl, event) {
        // Check if the click was on a resize handle
        if (event.target.classList.contains('resize-handle')) {
            // Handle resize operation
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (event.clientX - rect.left) / this.scale;
            const mouseY = (event.clientY - rect.top) / this.scale;
            
            // Start resizing
            this.elementManager.startResizingElement(element, event.target, mouseX, mouseY);
            return;
        }
        
        // Get canvas mouse coordinates
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) / this.scale;
        const mouseY = (event.clientY - rect.top) / this.scale;
        
        // Check if the element is already part of a multi-selection
        const isAlreadySelected = this.elementManager.isElementSelected(element);
        
        if (!isAlreadySelected) {
            // Clear existing selection first
            this.clearSelection();
            
            // Select this element using ElementManager
            this.elementManager.selectElement(element, false);
            
            // Add resize handles for single element selection
            this.elementManager.addResizeHandlesToElement(element);
        }
        
        // Prepare for drag operation - for both single elements and multi-selected elements
        this.isMultiDragging = true;
        this.elementManager.startDraggingElements(mouseX, mouseY);
        
        // Show popup after a short delay to avoid immediate popup when dragging
        this.popupTimeout = setTimeout(() => {
            if (this.isMultiDragging) {
                // Don't show popup if we're actually dragging
                return;
            }
            this.showElementPopup(element, event.clientX, event.clientY);
        }, 200);
    }
    
    // Clear all selected elements
    clearSelection() {
        // Use ElementManager to clear selection
        this.elementManager.clearSelection();
        // Remove resize handles
        this.elementManager.removeResizeHandles();
        this.hideElementPopup();
        this.hideMultiSelectionUI();
    }
    
    // Update UI for multi-selection
    updateMultiSelectionUI() {
        if (this.elementManager.selectedElements.length > 0) {
            let multiSelectUI = document.getElementById('multi-select-ui');
            
            if (!multiSelectUI) {
                // Create multi-select UI if it doesn't exist
                multiSelectUI = document.createElement('div');
                multiSelectUI.id = 'multi-select-ui';
                multiSelectUI.className = 'multi-select-ui';
                
                // Position it fixed at the bottom right
                multiSelectUI.style.position = 'fixed';
                multiSelectUI.style.bottom = '20px';
                multiSelectUI.style.right = '20px';
                multiSelectUI.style.padding = '10px';
                multiSelectUI.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                multiSelectUI.style.color = 'white';
                multiSelectUI.style.borderRadius = '5px';
                multiSelectUI.style.zIndex = '100';
                
                // Add buttons
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete Selected';
                deleteBtn.className = 'action-button';
                deleteBtn.style.marginRight = '10px';
                deleteBtn.onclick = () => this.deleteSelectedElements();
                
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy Selected';
                copyBtn.className = 'action-button';
                copyBtn.onclick = () => this.copySelectedElements();
                
                multiSelectUI.appendChild(deleteBtn);
                multiSelectUI.appendChild(copyBtn);
                
                document.body.appendChild(multiSelectUI);
            }
            
            // Update the UI display
            multiSelectUI.querySelector('button:first-child').textContent = 
                `Delete Selected (${this.elementManager.selectedElements.length})`;
        } else {
            this.hideMultiSelectionUI();
        }
    }
    
    // Hide multi-selection UI
    hideMultiSelectionUI() {
        const multiSelectUI = document.getElementById('multi-select-ui');
        if (multiSelectUI) {
            document.body.removeChild(multiSelectUI);
        }
    }
    
    // Delete selected elements (called when using keyboard delete)
    deleteSelectedElements() {
        // Delegate to ElementManager
        this.elementManager.deleteSelectedElements();
        
        // Additional UI cleanup
        this.hideMultiSelectionUI();
        this.hideElementPopup();
    }
    
    // Delete the element currently in the popup
    deleteElementFromPopup() {
        const elementId = document.getElementById('element-id').value;
        if (!elementId) return;
        
        // Delegate to ElementManager
        this.elementManager.deleteElement(elementId);
        
        // Additional UI cleanup
        this.hideMultiSelectionUI();
        this.hideElementPopup();
    }
    
    // Copy selected elements
    copySelectedElements() {
        // Delegate to ElementManager
        const count = this.elementManager.copySelectedElements();
        
        if (count > 0) {
            // Provide visual feedback
            const feedbackEl = document.createElement('div');
            feedbackEl.className = 'copy-feedback';
            feedbackEl.textContent = `Copied ${count} element(s)`;
            feedbackEl.style.position = 'fixed';
            feedbackEl.style.top = '20px';
            feedbackEl.style.left = '50%';
            feedbackEl.style.transform = 'translateX(-50%)';
            feedbackEl.style.backgroundColor = '#27ae60';
            feedbackEl.style.color = 'white';
            feedbackEl.style.padding = '10px 20px';
            feedbackEl.style.borderRadius = '5px';
            feedbackEl.style.zIndex = '1000';
            
            document.body.appendChild(feedbackEl);
            
            // Remove after 2 seconds
            setTimeout(() => {
                feedbackEl.style.opacity = '0';
                feedbackEl.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    document.body.removeChild(feedbackEl);
                }, 500);
            }, 2000);
        }
    }
    
    // Paste copied elements
    pasteElements(offsetX = 20, offsetY = 20) {
        // Attempting to paste elements
        
        // Delegate to ElementManager
        const count = this.elementManager.pasteElements();
        
        // Paste operation completed
        if (count > 0) {
            // Update selection UI
            // Updating multi-selection UI
            this.updateMultiSelectionUI();
        }
    }
    
    setupEventListeners() {
        // Mouse down on canvas - start drawing element or panning
        this.canvas.addEventListener('mousedown', (e) => {
            // Check if clicking on a resize handle
            if (e.target.classList.contains('resize-handle')) {
                const elementEl = e.target.closest('.canvas-element');
                if (elementEl) {
                    const elementId = elementEl.id.replace('element-', '');
                    const element = this.app.elements.find(el => el.id === elementId);
                    
                    if (element) {
                        const rect = this.canvas.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left) / this.scale;
                        const mouseY = (e.clientY - rect.top) / this.scale;
                        
                        // Start resizing operation
                        this.elementManager.startResizingElement(element, e.target, mouseX, mouseY);
                        return;
                    }
                }
            }
            
            // Handle clicking on an existing element (selection, dragging)
            if (e.target.closest('.canvas-element')) {
                const elementEl = e.target.closest('.canvas-element');
                const elementId = elementEl.id.replace('element-', '');
                const element = this.app.elements.find(el => el.id === elementId);
                
                if (element) {
                    if (e.shiftKey) {
                        // Multi-select with shift key
                        this.handleElementMultiSelect(element, elementEl);
                    } else {
                        // Single select and possibly start dragging
                        this.handleElementSelect(element, elementEl, e);
                    }
                }
                return;
            }
            
            // Clear selection if clicking on canvas (unless shift is pressed for multi-select)
            if (!e.shiftKey) {
                this.clearSelection();
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            if (document.getElementById('pan-tool').classList.contains('active')) {
                this.startPanning(x, y);
            } else if (document.getElementById('draw-tool').classList.contains('active')) {
                this.startDrawing(x, y);
            } else {
                // Start selection rectangle
                this.isSelecting = true;
                this.selectionStart = { x, y };
                this.createSelectionRectangle();
                this.updateSelectionRectangle(x, y);
            }
        });
        
        // Mouse move - continue drawing element or panning or dragging or resizing
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.scale;
            const mouseY = (e.clientY - rect.top) / this.scale;
            
            // Handle element resizing
            if (this.elementManager.isResizing) {
                // Delegate to ElementManager
                this.elementManager.updateResizingElement(mouseX, mouseY);
                return;
            }
            
            if (this.isDragging) {
                this.updateTempElement(mouseX, mouseY);
            } else if (this.isPanning) {
                this.updatePanning(e.clientX, e.clientY);
            } else if (this.isMultiDragging) {
                // Handle dragging selected elements
                // Clear any pending popup timeout
                if (this.popupTimeout) {
                    clearTimeout(this.popupTimeout);
                    this.popupTimeout = null;
                }
                
                // Hide popup while dragging
                this.hideElementPopup();
                
                // Delegate element dragging to ElementManager
                this.elementManager.updateDraggingElements(mouseX, mouseY);
            } else if (this.isSelecting) {
                // Update selection rectangle
                this.updateSelectionRectangle(mouseX, mouseY);
            }
        });
        
        // Mouse up - finish drawing element or panning or dragging or resizing
        window.addEventListener('mouseup', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.scale;
            const mouseY = (e.clientY - rect.top) / this.scale;
            
            // Handle element resizing end
            if (this.elementManager.isResizing) {
                // Delegate to ElementManager to finish resizing
                const success = this.elementManager.finishResizingElement();
                
                // Show warning if there was an overlap
                if (!success) {
                    this.showOverlapWarning();
                    this.uiManager.showNotification('Cannot resize: would overlap with other elements');
                }
                
                return;
            }
            
            if (this.isDragging) {
                this.finishDrawing(mouseX, mouseY);
            } else if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            } else if (this.isMultiDragging) {
                // Delegate to ElementManager for finish dragging
                const success = this.elementManager.finishDraggingElements(mouseX, mouseY);
                
                // Show warning if there was an overlap
                if (!success) {
                    this.showOverlapWarning();
                }
                
                // Reset dragging state
                this.isMultiDragging = false;
            } else if (this.isSelecting) {
                // Select elements within the selection rectangle
                this.selectElementsInRectangle(e.shiftKey);
                
                // Clean up selection rectangle
                this.removeSelectionRectangle();
                this.isSelecting = false;
            }
        });
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            // Use the last known mouse position for button zooming
            const zoomStep = this.app.getZoomStepSize();
            this.zoom(zoomStep, this.mousePosition.x, this.mousePosition.y);
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            // Use the last known mouse position for button zooming
            const zoomStep = this.app.getZoomStepSize();
            this.zoom(-zoomStep, this.mousePosition.x, this.mousePosition.y);
        });
        
        // Pan tool
        document.getElementById('pan-tool').addEventListener('click', () => {
            document.querySelectorAll('.tool-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById('pan-tool').classList.add('active');
        });
        
        // Draw tool (to distinguish from selection)
        document.getElementById('draw-tool').addEventListener('click', () => {
            document.querySelectorAll('.tool-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById('draw-tool').classList.add('active');
        });
        
        // Select tool (default)
        document.getElementById('select-tool').addEventListener('click', () => {
            document.querySelectorAll('.tool-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById('select-tool').classList.add('active');
        });
        
        // Mouse wheel for zooming
        this.canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Get configured zoom step size
            const zoomStep = this.app.getZoomStepSize();
            
            // Calculate zoom delta based on wheel direction
            const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
            
            // Zoom centered on the cursor position
            this.zoom(delta, e.clientX, e.clientY);
        });
        
        // Track mouse position for cursor-centered zooming
        this.canvasContainer.addEventListener('mousemove', (e) => {
            this.mousePosition = {
                x: e.clientX,
                y: e.clientY
            };
        });
        
        // REMOVED DUPLICATE KEYBOARD EVENT HANDLER
        
        // Element click - show popup
        this.canvas.addEventListener('click', (e) => {
            // Don't handle clicks if we just finished dragging
            if (this.isMultiDragging) return;
            
            const target = e.target.closest('.canvas-element');
            if (target && !e.shiftKey) {
                const elementId = target.id.replace('element-', '');
                const element = this.app.elements.find(el => el.id === elementId);
                if (element) {
                    this.showElementPopup(element, e.clientX, e.clientY);
                }
            } else if (!target) {
                this.hideElementPopup();
                // Remove any highlights
                document.querySelectorAll('.canvas-element.highlighted').forEach(el => {
                    el.classList.remove('highlighted');
                });
            }
        });
        
        // Element popup close button
        document.querySelector('.close-popup').addEventListener('click', () => {
            this.hideElementPopup();
        });
        
        // Element update button
        document.getElementById('update-element').addEventListener('click', () => {
            this.updateSelectedElement();
        });
        
        // Element delete button in popup
        document.getElementById('delete-element').addEventListener('click', () => {
            this.deleteElementFromPopup();
        });
        
        // Window resize - update canvas
        window.addEventListener('resize', () => {
            this.updateCanvasPosition();
        });
        
        // Keyboard shortcuts for element manipulation
        document.addEventListener('keydown', (e) => {
            // Keyboard shortcut detected
            
            // Delete key pressed
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Only delete if we have selected elements and the focus is not on an input
                if (this.elementManager.selectedElements.length > 0 && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                    this.deleteSelectedElements();
                    e.preventDefault(); // Prevent browser back navigation on backspace
                }
            }
            
            // Copy (Ctrl+C)
            if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                // Copy shortcut detected
                if (this.elementManager.selectedElements.length > 0) {
                    this.copySelectedElements();
                    e.preventDefault();
                }
            }
            
            // Paste (Ctrl+V)
            if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                // Paste shortcut detected
                this.pasteElements();
                e.preventDefault();
            }
        });
    }
    
    startPanning(x, y) {
        this.isPanning = true;
        this.canvas.style.cursor = 'grab';
        this.dragStart = { x, y };
    }
    
    updatePanning(clientX, clientY) {
        if (!this.isPanning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / this.scale;
        const y = (clientY - rect.top) / this.scale;
        
        this.offset.x += (x - this.dragStart.x) * this.scale;
        this.offset.y += (y - this.dragStart.y) * this.scale;
        
        this.updateCanvasPosition();
    }
    
    startDrawing(x, y) {
        this.isDragging = true;
        this.dragStart = { x, y };
        
        // Create temporary element
        const tempElement = document.createElement('div');
        tempElement.id = 'temp-element';
        tempElement.className = `canvas-element ${this.app.activeElementType.toLowerCase()}`;
        tempElement.style.left = `${x}px`;
        tempElement.style.top = `${y}px`;
        tempElement.style.width = '0';
        tempElement.style.height = '0';
        
        this.canvas.appendChild(tempElement);
    }
    
    updateTempElement(currentX, currentY) {
        const tempElement = document.getElementById('temp-element');
        if (!tempElement) return;
        
        const width = Math.abs(currentX - this.dragStart.x);
        const height = Math.abs(currentY - this.dragStart.y);
        
        const left = Math.min(currentX, this.dragStart.x);
        const top = Math.min(currentY, this.dragStart.y);
        
        tempElement.style.left = `${left}px`;
        tempElement.style.top = `${top}px`;
        tempElement.style.width = `${width}px`;
        tempElement.style.height = `${height}px`;
    }
    
    finishDrawing(endX, endY) {
        this.isDragging = false;
        
        const tempElement = document.getElementById('temp-element');
        if (!tempElement) return;
        
        // Calculate element dimensions
        const width = Math.abs(endX - this.dragStart.x);
        const height = Math.abs(endY - this.dragStart.y);
        
        // Only create element if it has a meaningful size
        if (width > 5 && height > 5) {
            const left = Math.min(endX, this.dragStart.x);
            const top = Math.min(endY, this.dragStart.y);
            
            // Snap to grid using GridManager
            const snappedPos = this.gridManager.snapPositionToGrid({x: left, y: top});
            const snappedDim = this.gridManager.snapDimensionsToGrid(width, height);
            const snappedLeft = snappedPos.x;
            const snappedTop = snappedPos.y;
            const snappedWidth = snappedDim.width;
            const snappedHeight = snappedDim.height;
            
            // Check for overlap before creating
            const newElementBounds = {
                x: snappedLeft,
                y: snappedTop,
                width: snappedWidth,
                height: snappedHeight
            };
            
            if (!this.checkOverlap(newElementBounds)) {
                // Create the actual element
                this.createElement(
                    this.app.activeElementType,
                    snappedLeft,
                    snappedTop,
                    snappedWidth,
                    snappedHeight
                );
            } else {
                this.showOverlapWarning();
            }
        }
        
        // Remove temporary element
        tempElement.remove();
    }
    
    createElement(type, x, y, width, height) {
        // Generate a unique ID
        const id = this.app.generateUniqueId(type);
        
        // Get type configuration
        const typeConfig = this.app.elementTypes[type];
        
        // Create element data
        const element = {
            id,
            type,
            x,
            y,
            width,
            height,
            color: typeConfig.color,
            showName: typeConfig.showName
        };
        
        // Add to elements array
        this.app.elements.push(element);
        
        // Create DOM element
        this.renderElement(element);
    }
    
    renderElement(element) {
        const el = document.createElement('div');
        el.id = `element-${element.id}`;
        el.className = `canvas-element ${element.type.toLowerCase()}`;
        el.style.left = `${element.x}px`;
        el.style.top = `${element.y}px`;
        el.style.width = `${element.width}px`;
        el.style.height = `${element.height}px`;
        el.style.backgroundColor = element.color;
        
        // Add ID text if showName is true
        if (element.showName) {
            const idText = document.createElement('div');
            idText.className = 'element-id';
            idText.textContent = element.id;
            el.appendChild(idText);
        }
        
        this.canvas.appendChild(el);
    }
    
    updateElement(element) {
        const el = document.getElementById(`element-${element.id}`);
        if (!el) return;
        
        // Update DOM element
        el.className = `canvas-element ${element.type.toLowerCase()}`;
        el.style.left = `${element.x}px`;
        el.style.top = `${element.y}px`;
        el.style.width = `${element.width}px`;
        el.style.height = `${element.height}px`;
        el.style.backgroundColor = element.color;
        
        // Update ID text
        el.innerHTML = '';
        if (element.showName) {
            const idText = document.createElement('div');
            idText.className = 'element-id';
            idText.textContent = element.id;
            el.appendChild(idText);
        }
    }
    
    showElementPopup(element, clientX, clientY) {
        this.elementManager.selectedElement = element;
        this.uiManager.showElementPopup(element, clientX, clientY, this.canvasContainer);
    }
    
    hideElementPopup() {
        this.uiManager.hideElementPopup();
        this.elementManager.selectedElement = null;
    }
    
    // Selection rectangle methods
    createSelectionRectangle() {
        // Remove any existing selection rectangle
        this.removeSelectionRectangle();
        
        // Create new selection rectangle
        this.selectionRect = document.createElement('div');
        this.selectionRect.id = 'selection-rectangle';
        this.selectionRect.className = 'selection-rectangle';
        
        // Style the selection rectangle
        this.selectionRect.style.position = 'absolute';
        this.selectionRect.style.border = '1px dashed #4285f4';
        this.selectionRect.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
        this.selectionRect.style.pointerEvents = 'none'; // Don't catch mouse events
        this.selectionRect.style.zIndex = '2'; // Above elements but below resize handles
        
        // Add to canvas
        this.canvas.appendChild(this.selectionRect);
    }
    
    removeSelectionRectangle() {
        if (this.selectionRect) {
            this.selectionRect.remove();
            this.selectionRect = null;
        }
    }
    
    updateSelectionRectangle(currentX, currentY) {
        if (!this.selectionRect) return;
        
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);
        
        const left = Math.min(currentX, this.selectionStart.x);
        const top = Math.min(currentY, this.selectionStart.y);
        
        this.selectionRect.style.left = `${left}px`;
        this.selectionRect.style.top = `${top}px`;
        this.selectionRect.style.width = `${width}px`;
        this.selectionRect.style.height = `${height}px`;
    }
    
    getElementsInSelectionRectangle() {
        if (!this.selectionRect) return [];
        
        // Get selection rectangle bounds
        const rectLeft = parseFloat(this.selectionRect.style.left);
        const rectTop = parseFloat(this.selectionRect.style.top);
        const rectRight = rectLeft + parseFloat(this.selectionRect.style.width);
        const rectBottom = rectTop + parseFloat(this.selectionRect.style.height);
        
        // Use faster bounds checking
        return this.app.elements.filter(element => {
            const elementRight = element.x + element.width;
            const elementBottom = element.y + element.height;
            
            return !(rectRight <= element.x ||
                   rectLeft >= elementRight ||
                   rectBottom <= element.y ||
                   rectTop >= elementBottom);
        });
    }
    
    selectElementsInRectangle(addToSelection = false) {
        // Get elements that overlap with the selection rectangle
        const elementsToSelect = this.getElementsInSelectionRectangle();
        
        // If not adding to selection, clear current selection first
        if (!addToSelection) {
            this.clearSelection();
        }
        
        // Select all elements in the selection area
        elementsToSelect.forEach(element => {
            this.elementManager.selectElement(element, true); // true = add to selection
        });
        
        // Update UI to reflect selection
        if (elementsToSelect.length > 0) {
            this.updateMultiSelectionUI();
        }
        
        return elementsToSelect.length;
    }
    
    // Show a temporary notification message
    showNotification(message, duration = 2500) {
        this.uiManager.showNotification(message, duration);
    }
    
    updateSelectedElement() {
        // Get the current selected element from the ElementManager
        const selectedElement = this.elementManager.selectedElement;
        if (!selectedElement) return;
        
        const idInput = document.getElementById('element-id');
        const newId = idInput.value.trim();
        
        // Validate ID (not empty and unique)
        if (!newId) {
            document.getElementById('id-error').textContent = 'ID cannot be empty';
            return;
        }
        
        if (!this.app.isIdUnique(newId, selectedElement.id)) {
            document.getElementById('id-error').textContent = 'ID must be unique';
            return;
        }
        
        // Clear error message
        document.getElementById('id-error').textContent = '';
        
        // Delegate to ElementManager to update the element ID
        this.elementManager.updateElementId(selectedElement, newId);
        
        // Hide popup
        this.hideElementPopup();
    }
    
    zoom(delta, cursorX, cursorY) {
        // Calculate new scale (min: 0.1, max: 3)
        const newScale = Math.max(0.1, Math.min(3, this.scale + delta));
        
        // Use cursor position if provided, otherwise use the last known mouse position or viewport center
        const containerWidth = this.canvasContainer.clientWidth;
        const containerHeight = this.canvasContainer.clientHeight;
        
        // Default to viewport center if no cursor position is available
        const zoomPointX = cursorX || this.mousePosition.x || containerWidth / 2;
        const zoomPointY = cursorY || this.mousePosition.y || containerHeight / 2;
        
        // Calculate the point on the canvas that is under the cursor
        const canvasPointX = (zoomPointX - this.offset.x) / this.scale;
        const canvasPointY = (zoomPointY - this.offset.y) / this.scale;
        
        // Set new scale
        this.scale = newScale;
        
        // Adjust offset to keep the same point under the cursor
        this.offset.x = zoomPointX - canvasPointX * this.scale;
        this.offset.y = zoomPointY - canvasPointY * this.scale;
        
        // Update canvas position
        this.updateCanvasPosition();
        
        // Update zoom level display
        document.getElementById('zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
    }
    
    centerElementInView(element) {
        // Get the center of the viewport
        const containerWidth = this.canvasContainer.clientWidth;
        const containerHeight = this.canvasContainer.clientHeight;
        
        // Calculate the center of the element
        const elementCenterX = element.x + element.width / 2;
        const elementCenterY = element.y + element.height / 2;
        
        // Calculate new offset to center the element
        this.offset.x = containerWidth / 2 - elementCenterX * this.scale;
        this.offset.y = containerHeight / 2 - elementCenterY * this.scale;
        
        // Update canvas position
        this.updateCanvasPosition();
    }
    
    // Return the total number of elements on the canvas
    getElementCount() {
        return this.app.elements.length;
    }
}
