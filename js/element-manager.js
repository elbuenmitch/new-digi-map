// Element Manager - handles element creation, selection, deletion and manipulation
export class ElementManager {
    constructor(app, canvas, gridManager, uiManager) {
        this.app = app;
        this.canvas = canvas;
        this.gridManager = gridManager;
        this.uiManager = uiManager;
        
        // Element selection and manipulation state
        this.selectedElements = [];
        this.selectedElement = null; // For popup purposes
        this.draggedElements = [];
        this.dragOffsets = [];
        this.copiedElements = [];
        
        // Resizing state
        this.isResizing = false;
        this.resizeElement = null;
        this.resizeHandle = null;
        this.resizeStartCoords = { x: 0, y: 0 };
        this.resizeStartDimensions = { width: 0, height: 0 };
    }
    
    // Create a new element with the given properties
    createElement(type, x, y, width, height, id = null) {
        console.log('!!! createElement DEBUG - Parameters:', { type, x, y, width, height, id });
        console.log('!!! createElement DEBUG - Element type config:', JSON.stringify(this.app.elementTypes[type]));
        
        // Generate a unique ID if not provided
        const elementId = id || Date.now().toString();
        console.log('!!! createElement DEBUG - Using element ID:', elementId);
        
        // Create DOM element
        const element = document.createElement('div');
        element.id = `element-${elementId}`;
        element.className = `canvas-element ${type.toLowerCase()}`; // Removed 'element' class, added lowercase type
        element.style.position = 'absolute'; // Ensure absolute positioning
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        element.style.boxSizing = 'border-box';
        
        // Get color from elementTypes configuration
        const typeConfig = this.app.elementTypes[type];
        const elementColor = typeConfig.color;
        console.log(`!!! createElement DEBUG - Using color: ${elementColor} for type: ${type}`);
        element.style.backgroundColor = elementColor;
        element.style.opacity = '0.7'; // Semi-transparent
        
        // Add ID text if showName is true for this element type
        if (typeConfig.showName) {
            const idText = document.createElement('div');
            idText.className = 'element-id';
            idText.textContent = elementId;
            element.appendChild(idText);
            console.log('!!! createElement DEBUG - Added ID text element:', idText);
        }
        
        console.log('Appending element to canvas:', element);
        
        // Make sure we're adding to the right canvas element
        console.log('Canvas element we are adding to:', this.canvas);
        
        // Check if the canvas exists and is a valid element
        if (!this.canvas || !this.canvas.appendChild) {
            console.error('Canvas is not a valid DOM element', this.canvas);
            // Try to get the canvas directly
            this.canvas = document.getElementById('canvas');
            console.log('Retrieved canvas from document:', this.canvas);
        }
        
        // Add element to canvas
        try {
            this.canvas.appendChild(element);
            console.log('Element successfully appended to canvas');
        } catch (e) {
            console.error('Failed to append element to canvas:', e);
        }
        
        // We already have typeConfig from above, reusing it here
        // Add to app elements array with all properties from type config
        const newElement = {
            id: elementId,
            type: type,
            x: x,
            y: y,
            width: width,
            height: height,
            color: typeConfig.color,         // Get color from type config
            showName: typeConfig.showName    // Get showName property from type config
        };
        
        console.log('Adding element to app.elements array:', newElement);
        this.app.elements.push(newElement);
        
        // Return the created element object
        return newElement;
    }
    
    // Select a single element
    selectElement(element, addToSelection = false) {
        // If not adding to selection, clear current selection
        if (!addToSelection) {
            this.clearSelection();
        }
        
        // Add to selection if not already selected
        if (!this.isElementSelected(element)) {
            this.selectedElements.push(element);
            
            // Apply visual selection
            const el = document.getElementById(`element-${element.id}`);
            if (el) {
                el.classList.add('selected');
            }
        }
    }
    
    // Clear all selections
    clearSelection() {
        this.selectedElements.forEach(element => {
            const el = document.getElementById(`element-${element.id}`);
            if (el) {
                el.classList.remove('selected');
            }
        });
        this.selectedElements = [];
    }
    
    // Check if element is currently selected
    isElementSelected(element) {
        return this.selectedElements.some(el => el.id === element.id);
    }
    
    // Get element at a specific position
    getElementAtPosition(x, y) {
        // Check from end of array (top elements first)
        for (let i = this.app.elements.length - 1; i >= 0; i--) {
            const element = this.app.elements[i];
            if (
                x >= element.x && 
                x <= element.x + element.width &&
                y >= element.y && 
                y <= element.y + element.height
            ) {
                return element;
            }
        }
        return null;
    }
    
    // Delete a specific element by ID
    deleteElement(elementId) {
        // Find the element
        const element = this.app.elements.find(el => el.id === elementId);
        if (!element) return;
        
        // Ask for confirmation before deleting
        if (!this.uiManager.confirmElementDeletion(elementId)) {
            return;
        }
        
        // Remove from DOM
        const el = document.getElementById(`element-${elementId}`);
        if (el) el.remove();
        
        // Remove from app elements array
        this.app.elements = this.app.elements.filter(el => el.id !== elementId);
        
        // Remove from selection if selected
        this.selectedElements = this.selectedElements.filter(el => el.id !== elementId);
        
        // Show feedback notification
        this.uiManager.showNotification(`Element ${elementId} deleted successfully`);
    }
    
    // Delete all selected elements
    deleteSelectedElements() {
        if (this.selectedElements.length === 0) return;
        
        // Ask for confirmation before deleting
        if (!this.uiManager.confirmMultipleElementDeletion(this.selectedElements.length)) {
            return;
        }
        
        // Remove elements from DOM and app elements array
        this.selectedElements.forEach(element => {
            const el = document.getElementById(`element-${element.id}`);
            if (el) el.remove();
        });
        
        this.app.elements = this.app.elements.filter(element => 
            !this.selectedElements.some(sel => sel.id === element.id)
        );
        
        // Show feedback notification
        const message = this.selectedElements.length === 1 
            ? "Element deleted successfully" 
            : `${this.selectedElements.length} elements deleted successfully`;
        
        // Clear selection array
        this.selectedElements = [];
        
        // Show notification
        this.uiManager.showNotification(message);
    }
    
    // Copy selected elements
    copySelectedElements() {
        if (this.selectedElements.length === 0) {
            console.log('No elements selected for copy');
            return 0;
        }
        
        this.copiedElements = this.selectedElements.map(el => ({...el}));
        console.log('Copied elements:', this.copiedElements);
        return this.copiedElements.length;
    }
    
    // Paste copied elements
    pasteElements() {
        console.log('!!! ElementManager: Attempting to paste elements, stack trace:', new Error().stack);
        console.log('!!! ElementManager: Copied elements array:', JSON.stringify(this.copiedElements));
        
        if (!this.copiedElements || this.copiedElements.length === 0) {
            console.log('!!! ElementManager: No elements to paste');
            return 0;
        }
        
        // Clear current selection
        this.clearSelection();
        
        // Create new elements with offset
        const offset = 20; // Pixel offset for pasted elements
        console.log('!!! ElementManager: Creating new elements with offset:', offset);
        
        const newElements = [];
        
        // Use the existing createElement method to create each element
        this.copiedElements.forEach(el => {
            console.log('!!! ElementManager: Processing copied element for paste:', JSON.stringify(el));
            console.log('!!! ElementManager: Getting color from elementTypes:', JSON.stringify(this.app.elementTypes[el.type]));
            
            // Get next ID for the element type
            const elementType = this.app.elementTypes[el.type];
            const nextId = elementType.nextId++;
            const elementId = `${el.type.toLowerCase()}_${nextId}`;
            console.log(`!!! ElementManager: Generated ID: ${elementId} for type: ${el.type}`);
            
            // Use the existing createElement method to create element
            // We'll inspect what createElement is doing with the element
            console.log('!!! ElementManager: Calling createElement with type:', el.type);
            const newElement = this.createElement(
                el.type,
                el.x + offset,
                el.y + offset,
                el.width,
                el.height,
                elementId // Pass the generated ID
            );
            
            console.log('!!! ElementManager: createElement returned:', JSON.stringify(newElement));
            newElements.push(newElement);
            
            // Select the new element
            this.selectElement(newElement, true);
        });
        
        console.log('!!! ElementManager: Pasted elements created:', newElements.length);
        return newElements.length;
    }
    
    // Start dragging selected elements
    startDraggingElements(mouseX, mouseY) {
        this.draggedElements = [...this.selectedElements];
        this.dragOffsets = this.draggedElements.map(element => ({
            x: mouseX - element.x,
            y: mouseY - element.y
        }));
    }
    
    // Update element positions during drag
    updateDraggingElements(mouseX, mouseY) {
        if (this.draggedElements.length === 0) return;
        
        // Update positions for each dragged element
        this.draggedElements.forEach((element, index) => {
            const offset = this.dragOffsets[index];
            const newX = mouseX - offset.x;
            const newY = mouseY - offset.y;
            
            // Snap to grid using GridManager
            const snapped = this.gridManager.snapPositionToGrid({x: newX, y: newY});
            const snappedX = snapped.x;
            const snappedY = snapped.y;
            
            // Temporary update of DOM element position
            const el = document.getElementById(`element-${element.id}`);
            if (el) {
                el.style.left = `${snappedX}px`;
                el.style.top = `${snappedY}px`;
                // Add a visual indication of dragging
                el.style.opacity = '0.7';
            }
        });
    }
    
    // Finish dragging elements and commit their new positions
    finishDraggingElements(mouseX, mouseY) {
        if (this.draggedElements.length === 0) return true;
        
        const cellSize = this.app.getCellSize();
        
        // Calculate new positions for all dragged elements
        const newPositions = this.draggedElements.map((element, index) => {
            const offset = this.dragOffsets[index];
            const newX = Math.round((mouseX - offset.x) / cellSize) * cellSize;
            const newY = Math.round((mouseY - offset.y) / cellSize) * cellSize;
            
            return {
                element,
                newBounds: {
                    x: newX,
                    y: newY,
                    width: element.width,
                    height: element.height
                }
            };
        });
        
        // First check if dragged elements would overlap with each other in new positions
        const internalOverlap = this.checkInternalOverlap(newPositions);
        if (internalOverlap) {
            this.revertDragOperation();
            this.uiManager.showNotification("Cannot reposition elements: they would overlap with each other.");
            return false;
        }
        
        // Check for overlap with elements not being dragged
        const externalOverlap = this.checkExternalOverlap(newPositions);
        if (externalOverlap) {
            this.revertDragOperation();
            this.uiManager.showNotification("Cannot reposition elements: they would overlap with existing elements.");
            return false;
        }
        
        // If no overlaps, apply new positions
        this.applyNewPositions(newPositions);
        return true;
    }
    
    // Helper method to check if dragged elements would overlap with each other
    checkInternalOverlap(newPositions) {
        // Check each element against all other dragged elements
        for (let i = 0; i < newPositions.length; i++) {
            const element1 = newPositions[i].newBounds;
            
            for (let j = i + 1; j < newPositions.length; j++) {
                const element2 = newPositions[j].newBounds;
                
                // Check for bounding box intersection
                const overlaps = !(
                    element1.x + element1.width <= element2.x ||
                    element1.x >= element2.x + element2.width ||
                    element1.y + element1.height <= element2.y ||
                    element1.y >= element2.y + element2.height
                );
                
                if (overlaps) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Helper method to check if dragged elements would overlap with non-dragged elements
    checkExternalOverlap(newPositions) {
        return newPositions.some(({ newBounds }) => 
            this.app.elements.some(element => 
                // Skip the element being dragged
                !this.draggedElements.some(draggedEl => draggedEl.id === element.id) && 
                // Check for overlap
                !(
                    newBounds.x + newBounds.width <= element.x ||
                    newBounds.x >= element.x + element.width ||
                    newBounds.y + newBounds.height <= element.y ||
                    newBounds.y >= element.y + element.height
                )
            )
        );
    }
    
    // Helper method to revert to original positions
    revertDragOperation() {
        this.draggedElements.forEach(element => {
            const el = document.getElementById(`element-${element.id}`);
            if (el) {
                el.style.left = `${element.x}px`;
                el.style.top = `${element.y}px`;
                el.style.opacity = '1';
            }
        });
    }
    
    // Helper method to apply new positions
    applyNewPositions(newPositions) {
        newPositions.forEach(({ element, newBounds }) => {
            // Update data
            element.x = newBounds.x;
            element.y = newBounds.y;
            
            // Update DOM
            const el = document.getElementById(`element-${element.id}`);
            if (el) {
                el.style.opacity = '1';
                // Apply the new positions to the DOM
                el.style.left = `${newBounds.x}px`;
                el.style.top = `${newBounds.y}px`;
            }
        });
    }
    
    // Check if an element overlaps with any existing elements
    checkOverlap(newElement) {
        return this.app.elements.some(existingElement => 
            // Skip if comparing with itself (for existing elements being moved)
            existingElement.id !== newElement.id &&
            // Check for overlap using bounding box intersection
            !(
                newElement.x + newElement.width <= existingElement.x ||
                newElement.x >= existingElement.x + existingElement.width ||
                newElement.y + newElement.height <= existingElement.y ||
                newElement.y >= existingElement.y + existingElement.height
            )
        );
    }
    
    // Add resize handles to a selected element
    addResizeHandlesToElement(element) {
        // Only add resize handles if a single element is selected
        if (this.selectedElements.length !== 1) return;
        
        // Get the DOM element
        const el = document.getElementById(`element-${element.id}`);
        if (!el) return;
        
        // Remove existing resize handles if any
        this.removeResizeHandles();
        
        // Define handle positions
        const handlePositions = [
            { position: 'top-left', cursor: 'nwse-resize' },
            { position: 'top-center', cursor: 'ns-resize' },
            { position: 'top-right', cursor: 'nesw-resize' },
            { position: 'middle-left', cursor: 'ew-resize' },
            { position: 'middle-right', cursor: 'ew-resize' },
            { position: 'bottom-left', cursor: 'nesw-resize' },
            { position: 'bottom-center', cursor: 'ns-resize' },
            { position: 'bottom-right', cursor: 'nwse-resize' }
        ];
        
        // Create each handle
        handlePositions.forEach(({ position, cursor }) => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${position}`;
            handle.dataset.position = position;
            handle.style.position = 'absolute';
            handle.style.width = '10px';
            handle.style.height = '10px';
            handle.style.backgroundColor = '#ffffff';
            handle.style.border = '1px solid #333';
            handle.style.cursor = cursor;
            handle.style.zIndex = '10';
            
            // Position the handle
            switch(position) {
                case 'top-left':
                    handle.style.top = '-5px';
                    handle.style.left = '-5px';
                    break;
                case 'top-center':
                    handle.style.top = '-5px';
                    handle.style.left = 'calc(50% - 5px)';
                    break;
                case 'top-right':
                    handle.style.top = '-5px';
                    handle.style.right = '-5px';
                    break;
                case 'middle-left':
                    handle.style.top = 'calc(50% - 5px)';
                    handle.style.left = '-5px';
                    break;
                case 'middle-right':
                    handle.style.top = 'calc(50% - 5px)';
                    handle.style.right = '-5px';
                    break;
                case 'bottom-left':
                    handle.style.bottom = '-5px';
                    handle.style.left = '-5px';
                    break;
                case 'bottom-center':
                    handle.style.bottom = '-5px';
                    handle.style.left = 'calc(50% - 5px)';
                    break;
                case 'bottom-right':
                    handle.style.bottom = '-5px';
                    handle.style.right = '-5px';
                    break;
            }
            
            el.appendChild(handle);
        });
    }
    
    // Remove all resize handles
    removeResizeHandles() {
        const handles = document.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.remove());
    }
    
    // Start resizing an element
    startResizingElement(element, handle, mouseX, mouseY) {
        if (!element) return;
        
        this.isResizing = true;
        this.resizeElement = element;
        this.resizeHandle = handle.dataset.position;
        this.resizeStartCoords = { x: mouseX, y: mouseY };
        this.resizeStartDimensions = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        };
    }
    
    // Update the element dimensions during resizing
    updateResizingElement(mouseX, mouseY) {
        if (!this.isResizing || !this.resizeElement) return;
        
        const cellSize = this.app.getCellSize();
        const handle = this.resizeHandle;
        const startDim = this.resizeStartDimensions;
        const deltaX = mouseX - this.resizeStartCoords.x;
        const deltaY = mouseY - this.resizeStartCoords.y;
        
        // Calculate new dimensions based on which handle is being dragged
        let newX = this.resizeElement.x;
        let newY = this.resizeElement.y;
        let newWidth = this.resizeElement.width;
        let newHeight = this.resizeElement.height;
        
        // Handle different resize directions
        if (handle.includes('left')) {
            newX = startDim.x + deltaX;
            newWidth = startDim.width - deltaX;
        } else if (handle.includes('right')) {
            newWidth = startDim.width + deltaX;
        }
        
        if (handle.includes('top')) {
            newY = startDim.y + deltaY;
            newHeight = startDim.height - deltaY;
        } else if (handle.includes('bottom')) {
            newHeight = startDim.height + deltaY;
        }
        
        // Ensure minimum size
        if (newWidth < cellSize) newWidth = cellSize;
        if (newHeight < cellSize) newHeight = cellSize;
        
        // Adjust x and y if width or height became minimum
        if (newWidth === cellSize && handle.includes('left')) {
            newX = startDim.x + startDim.width - cellSize;
        }
        if (newHeight === cellSize && handle.includes('top')) {
            newY = startDim.y + startDim.height - cellSize;
        }
        
        // Snap to grid
        const snappedPos = this.gridManager.snapPositionToGrid({x: newX, y: newY});
        const snappedDim = this.gridManager.snapDimensionsToGrid(newWidth, newHeight);
        
        // Update the DOM element visually for real-time feedback
        const el = document.getElementById(`element-${this.resizeElement.id}`);
        if (el) {
            el.style.left = `${snappedPos.x}px`;
            el.style.top = `${snappedPos.y}px`;
            el.style.width = `${snappedDim.width}px`;
            el.style.height = `${snappedDim.height}px`;
        }
        
        // Store the proposed new dimensions (will be validated on finishResizing)
        this.proposedDimensions = {
            x: snappedPos.x,
            y: snappedPos.y,
            width: snappedDim.width,
            height: snappedDim.height
        };
    }
    
    // Finish resizing and apply changes if valid
    finishResizingElement() {
        if (!this.isResizing || !this.resizeElement) return true;
        
        // Check if the new dimensions would cause an overlap
        const proposedElement = {
            ...this.resizeElement,
            ...this.proposedDimensions
        };
        
        if (this.checkOverlap(proposedElement)) {
            // Revert to original dimensions if overlap detected
            const el = document.getElementById(`element-${this.resizeElement.id}`);
            if (el) {
                el.style.left = `${this.resizeElement.x}px`;
                el.style.top = `${this.resizeElement.y}px`;
                el.style.width = `${this.resizeElement.width}px`;
                el.style.height = `${this.resizeElement.height}px`;
            }
            
            // Reset state
            this.isResizing = false;
            this.resizeElement = null;
            this.resizeHandle = null;
            
            return false;
        }
        
        // Apply new dimensions to the element data
        this.resizeElement.x = this.proposedDimensions.x;
        this.resizeElement.y = this.proposedDimensions.y;
        this.resizeElement.width = this.proposedDimensions.width;
        this.resizeElement.height = this.proposedDimensions.height;
        
        // Reset state
        this.isResizing = false;
        this.resizeElement = null;
        this.resizeHandle = null;
        
        // Reapply resize handles to the updated element
        this.addResizeHandlesToElement(this.selectedElements[0]);
        
        return true;
    }
    
    // Update element ID with proper sync between app.elements and DOM
    updateElementId(element, newId) {
        const oldId = element.id;
        
        // Update in app.elements array
        const elementIndex = this.app.elements.findIndex(el => el.id === oldId);
        if (elementIndex !== -1) {
            this.app.elements[elementIndex].id = newId;
        }
        
        // Update element reference (in case it's stored elsewhere)
        element.id = newId;
        
        // Update the DOM element
        const domElement = document.getElementById(`element-${oldId}`);
        if (domElement) {
            domElement.id = `element-${newId}`;
            if (element.showName) {
                const idText = domElement.querySelector('.element-id');
                if (idText) {
                    idText.textContent = newId;
                }
            }
        }
    }
}
