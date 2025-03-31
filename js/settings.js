// Settings manager - handles the application settings
export class SettingsManager {
    constructor(app) {
        this.app = app;
        this.cellSize = 10; // Fixed size of each grid cell (constant)
        
        // Default canvas dimensions (width: 300, height: 400)
        this.canvasWidth = 400; // Width in number of cells
        this.canvasHeight = 300; // Height in number of cells
        
        this.gridVisible = true; // Default grid visibility
        this.zoomStepSize = 0.05; // Default zoom step size (5%)
        
        // Background image settings
        this.backgroundImageVisible = true;
        this.backgroundImageOpacity = 1.0;
        this.backgroundImageFile = null; // Stores pending image file
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Save settings button
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Close modal button
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        // Background image upload
        document.getElementById('background-image-upload')?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.backgroundImageFile = e.target.files[0];
                this.handleBackgroundImageUpload(this.backgroundImageFile);
            }
        });
        
        // Background image opacity control
        document.getElementById('background-image-opacity')?.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                this.backgroundImageOpacity = opacity;
                this.app.setBackgroundImageOpacity(opacity);
                
                // Update display value
                const opacityValue = document.getElementById('background-image-opacity-value');
                if (opacityValue) {
                    opacityValue.textContent = opacity.toFixed(2);
                }
            }
        });
        
        // Background image visibility toggle
        document.getElementById('background-image-visible')?.addEventListener('change', (e) => {
            this.backgroundImageVisible = e.target.checked;
            this.app.toggleBackgroundImageVisibility(e.target.checked);
        });
        
        // Remove background image button
        document.getElementById('remove-background-image')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove the background image?')) {
                this.removeBackgroundImage();
            }
        });
    }
    
    openSettingsModal() {
        // openSettingsModal method called
        
        // Make sure any previous warning is hidden
        const warningEl = document.getElementById('settings-warning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }
        
        // Fill in current settings
        document.getElementById('canvas-width').value = this.canvasWidth;
        document.getElementById('canvas-height').value = this.canvasHeight;
        document.getElementById('grid-visible').checked = this.gridVisible;
        document.getElementById('zoom-step-size').value = this.zoomStepSize * 100; // Convert to percentage
        
        // Fill in element type settings
        for (const type in this.app.elementTypes) {
            const typeConfig = this.app.elementTypes[type];
            const colorInput = document.getElementById(`${type.toLowerCase()}-color`);
            const showNameInput = document.getElementById(`${type.toLowerCase()}-show-name`);
            
            if (colorInput) colorInput.value = typeConfig.color;
            if (showNameInput) showNameInput.checked = typeConfig.showName;
        }
        
        // Update background image settings if elements exist
        this.updateBackgroundImageSettingsDisplay();
        
        // Show/hide background image sections based on state
        this.updateBackgroundImageSectionsVisibility();
        
        // Get modal element
        const modalElement = document.getElementById('settings-modal');
        // Prepare modal element before showing
        
        // Enhanced modal visibility - force visibility with multiple approaches
        if (modalElement) {
            // 1. Remove hidden class
            modalElement.classList.remove('hidden');
            
            // 2. Set display style directly
            modalElement.style.display = 'block';
            
            // 3. Set visibility and opacity
            modalElement.style.visibility = 'visible';
            modalElement.style.opacity = '1';
            
            // 4. Ensure proper z-index
            modalElement.style.zIndex = '1000';
            
            console.log('Modal should now be visible, state:', {
                classList: modalElement.classList,
                display: modalElement.style.display,
                visibility: modalElement.style.visibility,
                zIndex: modalElement.style.zIndex
            });
        } else {
            // Settings modal element not found
        }
    }
    
    closeSettingsModal() {
        document.getElementById('settings-modal').classList.add('hidden');
        
        // Hide any warning messages when closing the modal
        const warningEl = document.getElementById('settings-warning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }
    }
    
    /**
     * Handle background image upload
     * @param {File} file - The image file
     */
    async handleBackgroundImageUpload(file) {
        if (!file) return;
        
        try {
            // Check if file is an image
            if (!file.type.match('image.*')) {
                this.showWarningMessage('Please select a valid image file.');
                return;
            }
            
            // Check file size (max 10MB)
            const MAX_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > MAX_SIZE) {
                this.showWarningMessage('Image file is too large. Maximum size is 10MB.');
                return;
            }
            
            // Process the image
            await this.app.setBackgroundImageFromFile(file);
            
            // Update opacity and visibility inputs
            if (document.getElementById('background-image-opacity')) {
                document.getElementById('background-image-opacity').value = this.backgroundImageOpacity;
            }
            if (document.getElementById('background-image-visible')) {
                document.getElementById('background-image-visible').checked = this.backgroundImageVisible;
            }
            
            // Show preview
            this.showBackgroundImagePreview();
            
            // Update section visibility
            this.updateBackgroundImageSectionsVisibility();
            
            // If there's a saved map, save the image
            if (this.app.currentCentercode && this.app.currentFloor) {
                try {
                    await this.app.saveBackgroundImage();
                } catch (error) {
                    console.error('Error saving background image:', error);
                    this.showWarningMessage('The image was loaded but could not be saved to the database.');
                }
            }
        } catch (error) {
            console.error('Error handling background image:', error);
            this.showWarningMessage('Failed to process image. Please try again.');
        }
    }
    
    /**
     * Update background image sections visibility based on state
     */
    updateBackgroundImageSectionsVisibility() {
        const hasBackgroundImage = !!this.app.backgroundImage.url;
        
        // Upload section (always visible)
        const uploadSection = document.getElementById('background-image-upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'block';
            
            // Update button text
            const uploadButton = document.getElementById('background-image-upload-button');
            if (uploadButton) {
                uploadButton.textContent = hasBackgroundImage ? 'Replace Image' : 'Upload Image';
            }
        }
        
        // Settings section (only visible if image exists)
        const settingsSection = document.getElementById('background-image-settings-section');
        if (settingsSection) {
            settingsSection.style.display = hasBackgroundImage ? 'block' : 'none';
        }
    }
    
    /**
     * Update background image settings display
     */
    updateBackgroundImageSettingsDisplay() {
        // Set values from current state
        const opacityInput = document.getElementById('background-image-opacity');
        if (opacityInput) {
            opacityInput.value = this.app.backgroundImage.opacity;
        }
        
        const visibilityInput = document.getElementById('background-image-visible');
        if (visibilityInput) {
            visibilityInput.checked = this.app.backgroundImage.showImage;
        }
        
        // Update opacity display value
        const opacityValue = document.getElementById('background-image-opacity-value');
        if (opacityValue) {
            opacityValue.textContent = this.app.backgroundImage.opacity.toFixed(2);
        }
    }
    
    /**
     * Show preview of background image
     */
    showBackgroundImagePreview() {
        if (!this.app.backgroundImage.url) return;
        
        // Find or create preview container
        let previewContainer = document.getElementById('background-image-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'background-image-preview';
            previewContainer.style.marginTop = '10px';
            previewContainer.style.maxWidth = '200px';
            previewContainer.style.border = '1px solid #ccc';
            
            const uploadSection = document.getElementById('background-image-upload-section');
            if (uploadSection) {
                uploadSection.appendChild(previewContainer);
            }
        }
        
        // Clear previous preview
        previewContainer.innerHTML = '';
        
        // Add preview image
        const img = document.createElement('img');
        img.src = this.app.backgroundImage.url;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        
        previewContainer.appendChild(img);
    }
    
    /**
     * Remove background image
     */
    async removeBackgroundImage() {
        // If there's a saved map, delete from database
        if (this.app.currentCentercode && this.app.currentFloor) {
            try {
                await this.app.database.deleteBackgroundImage(
                    this.app.currentCentercode,
                    this.app.currentFloor
                );
            } catch (error) {
                console.error('Error deleting background image:', error);
                this.showWarningMessage('Failed to delete image from database.');
                return;
            }
        }
        
        // Clear from app
        this.app.clearBackgroundImage();
        
        // Clear file input
        const fileInput = document.getElementById('background-image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Clear preview
        const previewContainer = document.getElementById('background-image-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        // Update sections visibility
        this.updateBackgroundImageSectionsVisibility();
    }
    
    saveSettings() {
        // Get canvas and grid settings
        const canvasWidthInput = document.getElementById('canvas-width');
        const canvasHeightInput = document.getElementById('canvas-height');
        const gridVisibleInput = document.getElementById('grid-visible');
        const zoomStepSizeInput = document.getElementById('zoom-step-size');
        
        // Get background image settings
        const backgroundImageVisibleInput = document.getElementById('background-image-visible');
        const backgroundImageOpacityInput = document.getElementById('background-image-opacity');
        
        // Check if there are elements directly on the app
        const elements = this.app.elements || [];
        const elementCount = elements.length;
        
        const hasElements = elementCount > 0;
        const canvasSizeChanged = (
            parseInt(canvasWidthInput.value) !== this.canvasWidth ||
            parseInt(canvasHeightInput.value) !== this.canvasHeight
        );
        
        // Block canvas size changes if elements exist
        if (hasElements && canvasSizeChanged) {
            // Show warning message
            this.showWarningMessage('Cannot resize canvas with elements present. Please remove all elements first.');
            
            // Reset the input values to current dimensions
            canvasWidthInput.value = this.canvasWidth;
            canvasHeightInput.value = this.canvasHeight;
            
            // IMPORTANT: Return early to prevent the canvas from being resized
            return;
        } else {
            // Validate canvas width
            const newCanvasWidth = parseInt(canvasWidthInput.value);
            if (newCanvasWidth >= 10 && newCanvasWidth <= 1000) {
                this.canvasWidth = newCanvasWidth;
            } else {
                // Reset to default if invalid
                canvasWidthInput.value = this.canvasWidth;
            }
            
            // Validate canvas height
            const newCanvasHeight = parseInt(canvasHeightInput.value);
            if (newCanvasHeight >= 10 && newCanvasHeight <= 1000) {
                this.canvasHeight = newCanvasHeight;
            } else {
                // Reset to default if invalid
                canvasHeightInput.value = this.canvasHeight;
            }
        }
        
        // Validate zoom step size (1% to 25%)
        const newZoomStepSize = parseFloat(zoomStepSizeInput.value);
        if (newZoomStepSize >= 1 && newZoomStepSize <= 25) {
            this.zoomStepSize = newZoomStepSize / 100; // Convert percentage to decimal
        } else {
            // Reset to default if invalid
            zoomStepSizeInput.value = this.zoomStepSize * 100;
        }
        
        this.gridVisible = gridVisibleInput.checked;
        
        // Update grid visibility
        const gridContainer = document.querySelector('.grid-container');
        if (gridContainer) {
            gridContainer.style.display = this.gridVisible ? 'block' : 'none';
        } else if (this.app.canvas) {
            // If the grid isn't found but we have a canvas, redraw with current visibility
            this.app.canvas.updateGridVisibility(this.gridVisible);
        }
        
        // Save background image settings if we have an image
        if (this.app.backgroundImage.url) {
            // Get values from inputs
            if (backgroundImageVisibleInput) {
                this.backgroundImageVisible = backgroundImageVisibleInput.checked;
                this.app.toggleBackgroundImageVisibility(this.backgroundImageVisible);
            }
            
            if (backgroundImageOpacityInput) {
                const opacity = parseFloat(backgroundImageOpacityInput.value);
                if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                    this.backgroundImageOpacity = opacity;
                    this.app.setBackgroundImageOpacity(this.backgroundImageOpacity);
                }
            }
            
            // If we have a pending image file and a saved map, save the image
            if (this.backgroundImageFile && this.app.currentCentercode && this.app.currentFloor) {
                this.app.saveBackgroundImage().catch(error => {
                    console.error('Error saving background image:', error);
                    this.showWarningMessage('Failed to save background image to database.');
                });
                
                // Clear pending file
                this.backgroundImageFile = null;
            }
        }
        
        // Save element type settings
        for (const type in this.app.elementTypes) {
            const colorInput = document.getElementById(`${type.toLowerCase()}-color`);
            const showNameInput = document.getElementById(`${type.toLowerCase()}-show-name`);
            
            if (colorInput) {
                this.app.elementTypes[type].color = colorInput.value;
            }
            
            if (showNameInput) {
                this.app.elementTypes[type].showName = showNameInput.checked;
            }
        }
        
        // Update existing elements with new settings
        this.updateExistingElements();
        
        // Redraw grid with new size
        this.app.canvas.drawGrid();
        
        // Close settings modal
        this.closeSettingsModal();
    }
    
    updateExistingElements() {
        // Update all elements to reflect new settings
        this.app.elements.forEach(element => {
            const typeConfig = this.app.elementTypes[element.type];
            
            // Update element properties
            element.color = typeConfig.color;
            element.showName = typeConfig.showName;
            
            // Update DOM element
            this.app.canvas.updateElement(element);
        });
    }
    
    getCellSize() {
        return this.cellSize;
    }
    
    getCanvasWidth() {
        return this.canvasWidth;
    }
    
    getCanvasHeight() {
        return this.canvasHeight;
    }
    
    getZoomStepSize() {
        return this.zoomStepSize;
    }
    
    showWarningMessage(message) {
        // Get the warning element that's now permanently in the HTML
        const warningEl = document.getElementById('settings-warning');
        
        if (!warningEl) {
            // Use alert as a fallback if element not found
            alert(message);
            return;
        }
        
        // Force-reset any inline styles that might be hiding the element
        warningEl.setAttribute('style', 'background-color: #ffeeee; color: #cc0000; padding: 10px; margin: 10px 0; border: 1px solid #cc0000; border-radius: 4px; font-weight: bold; text-align: center; display: block !important;');
        
        // Set the message
        warningEl.textContent = message;
        
        // Make sure it's visible
        try {
            warningEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (e) {
            // Silently fail if scrolling doesn't work
        }
        
        // Add a quick flash effect for visibility
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            if (flashCount >= 6) { // Flash 3 times (6 color changes)
                clearInterval(flashInterval);
                warningEl.style.backgroundColor = '#ffeeee';
                return;
            }
            
            warningEl.style.backgroundColor = flashCount % 2 === 0 ? '#ff8888' : '#ffeeee';
            flashCount++;
        }, 200);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            warningEl.style.display = 'none';
        }, 10000);
    }
}
