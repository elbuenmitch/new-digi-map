// Settings Modal Manager - v4.0
// Complete replacement of the modal system

/**
 * This script completely replaces the original modal management system
 * to fix issues with duplicate modals, event handling, and settings persistence.
 */

// Global state to track initialization
const modalManager = {
    initialized: false,
    originalOpenMethod: null,
    originalCloseMethod: null,
    originalSaveMethod: null
};

/**
 * Initialize the modal manager once the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM loaded and parsed
    initializeModalManager();
});

/**
 * Setup the modal manager by intercepting the original settings methods
 */
function initializeModalManager() {
    // Prevent multiple initializations
    if (modalManager.initialized) {
        // Already initialized
        return;
    }
    
    // Initializing modal manager
    
    // Wait a short time to ensure app and settings are loaded
    setTimeout(() => {
        if (window.app && window.app.settings) {
            interceptSettingsMethods();
            replaceSettingsButton();
            modalManager.initialized = true;
            // Initialization complete
        } else {
            // App or settings not available yet, retrying...
            setTimeout(initializeModalManager, 100); // Try again in 100ms
        }
    }, 0);
}

/**
 * Intercept the original methods on the settings object
 */
function interceptSettingsMethods() {
    const settings = window.app.settings;
    
    // Store original methods
    modalManager.originalOpenMethod = settings.openSettingsModal;
    modalManager.originalCloseMethod = settings.closeSettingsModal;
    modalManager.originalSaveMethod = settings.saveSettings;
    
    // Replace with our enhanced versions
    settings.openSettingsModal = enhancedOpenModal;
    settings.closeSettingsModal = enhancedCloseModal;
    settings.saveSettings = enhancedSaveSettings;
    
    // Settings methods intercepted
}

/**
 * Replace the settings button to ensure it uses our enhanced methods
 */
function replaceSettingsButton() {
    const settingsButton = document.getElementById('settings-btn');
    if (!settingsButton) {
        // Settings button not found
        return;
    }
    
    // Create a new button to replace the existing one
    const newButton = document.createElement('button');
    newButton.id = 'settings-btn';
    newButton.className = settingsButton.className;
    newButton.innerHTML = settingsButton.innerHTML;
    
    // Add our event listener
    newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.app && window.app.settings) {
            // Settings button clicked, opening modal
            window.app.settings.openSettingsModal();
        }
    });
    
    // Replace the button
    if (settingsButton.parentNode) {
        settingsButton.parentNode.replaceChild(newButton, settingsButton);
        // Settings button replaced
    }
}

/**
 * Enhanced version of the openSettingsModal method
 */
function enhancedOpenModal() {
    // Enhanced open modal called
    
    // Get the original modal
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        // Settings modal not found
        return;
    }
    
    // Hide any previous warnings
    const warningEl = document.getElementById('settings-warning');
    if (warningEl) {
        warningEl.style.display = 'none';
    }
    
    // Fill the form with current settings
    fillSettingsForm(modal);
    
    // Show the modal
    showModal(modal);
    
    // Set up close handlers
    setupModalCloseHandlers(modal);
    
    // Set up save handler
    setupSaveHandler(modal);
    
    // Modal opened and configured
}

/**
 * Fill the settings form with current values
 */
function fillSettingsForm(modal) {
    const settings = window.app.settings;
    
    // Canvas settings
    if (modal.querySelector('#canvas-width')) {
        modal.querySelector('#canvas-width').value = settings.canvasWidth || 400;
    }
    
    if (modal.querySelector('#canvas-height')) {
        modal.querySelector('#canvas-height').value = settings.canvasHeight || 300;
    }
    
    if (modal.querySelector('#grid-visible')) {
        modal.querySelector('#grid-visible').checked = settings.gridVisible !== false;
    }
    
    if (modal.querySelector('#zoom-step-size')) {
        modal.querySelector('#zoom-step-size').value = (settings.zoomStepSize || 0.05) * 100;
    }
    
    // Element type settings
    if (window.app.elementTypes) {
        // Location settings
        if (window.app.elementTypes.Location) {
            const loc = window.app.elementTypes.Location;
            if (modal.querySelector('#location-color')) {
                modal.querySelector('#location-color').value = loc.color || '#FFC580';
            }
            if (modal.querySelector('#location-show-name')) {
                modal.querySelector('#location-show-name').checked = loc.showName !== false;
            }
        }
        
        // Barrier settings
        if (window.app.elementTypes.Barrier) {
            const bar = window.app.elementTypes.Barrier;
            if (modal.querySelector('#barrier-color')) {
                modal.querySelector('#barrier-color').value = bar.color || '#444444';
            }
            if (modal.querySelector('#barrier-show-name')) {
                modal.querySelector('#barrier-show-name').checked = bar.showName === true;
            }
        }
    }
    
    // Settings form populated
}

/**
 * Show the modal with proper styling
 */
function showModal(modal) {
    // Remove hidden class and set direct styles
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '1000';
    
    // Modal is now visible
}

/**
 * Set up event handlers to close the modal
 */
function setupModalCloseHandlers(modal) {
    // Handle clicks outside the modal content
    document.addEventListener('click', function outsideClickHandler(e) {
        if (modal.style.display === 'block') {
            // Check if click is outside the modal content
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(e.target) && !e.target.closest('.modal-content')) {
                // Click detected outside modal content
                enhancedCloseModal();
                // Remove this specific handler to avoid memory leaks
                document.removeEventListener('click', outsideClickHandler);
            }
        }
    });
    
    // Close button handler
    const closeButton = modal.querySelector('.close-modal');
    if (closeButton) {
        // Remove existing listeners by cloning and replacing
        const newCloseBtn = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseBtn, closeButton);
        
        // Add our listener
        newCloseBtn.addEventListener('click', function(e) {
            // Close button clicked
            e.preventDefault();
            e.stopPropagation();
            enhancedCloseModal();
        });
    }
}

/**
 * Set up the save settings handler
 */
function setupSaveHandler(modal) {
    const saveButton = modal.querySelector('#save-settings');
    if (saveButton) {
        // Remove existing listeners by cloning and replacing
        const newSaveBtn = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveBtn, saveButton);
        
        // Add our listener
        newSaveBtn.addEventListener('click', function(e) {
            // Save settings button clicked
            e.preventDefault();
            e.stopPropagation();
            processSaveSettings(modal);
        });
    } else {
        // Save button not found in modal
    }
}

/**
 * Enhanced version of the closeSettingsModal method
 */
function enhancedCloseModal() {
    // Enhanced close modal called
    
    // Get the modal
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        // Settings modal not found for closing
        return;
    }
    
    // Hide the modal
    modal.classList.add('hidden');
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    
    // Hide any warning messages
    const warningEl = document.getElementById('settings-warning');
    if (warningEl) {
        warningEl.style.display = 'none';
    }
    
    // Modal closed
}

/**
 * Process the form values and save settings
 */
function processSaveSettings(modal) {
    // Get values from form inputs
    const canvasWidth = parseInt(modal.querySelector('#canvas-width').value) || 400;
    const canvasHeight = parseInt(modal.querySelector('#canvas-height').value) || 300;
    const gridVisible = modal.querySelector('#grid-visible').checked;
    const zoomStepSize = parseFloat(modal.querySelector('#zoom-step-size').value) || 5;
    
    // Get element type settings
    const locationColor = modal.querySelector('#location-color').value;
    const locationShowName = modal.querySelector('#location-show-name').checked;
    const barrierColor = modal.querySelector('#barrier-color').value;
    const barrierShowName = modal.querySelector('#barrier-show-name').checked;
    
    // Form values processing
    const formData = {
        canvasWidth, canvasHeight, gridVisible, zoomStepSize,
        locationColor, locationShowName, barrierColor, barrierShowName
    };
    
    // Check if there are elements on the canvas when trying to resize
    if (window.app && window.app.elements && window.app.elements.length > 0) {
        const settings = window.app.settings;
        const canvasSizeChanged = (
            canvasWidth !== settings.canvasWidth ||
            canvasHeight !== settings.canvasHeight
        );
        
        if (canvasSizeChanged) {
            // Cannot resize canvas with elements present
            
            // Show warning message
            const warningEl = modal.querySelector('#settings-warning');
            if (warningEl) {
                warningEl.innerHTML = 'Cannot resize canvas with elements present. Please remove all elements first.';
                warningEl.style.display = 'block';
                warningEl.style.backgroundColor = '#ffeeee';
                warningEl.style.color = '#cc0000';
                warningEl.style.padding = '10px';
                warningEl.style.margin = '10px 0';
                warningEl.style.border = '1px solid #cc0000';
                warningEl.style.borderRadius = '4px';
                warningEl.style.fontWeight = 'bold';
                warningEl.style.textAlign = 'center';
                return; // Don't save settings
            }
        }
    }
    
    // Call the enhanced save settings method
    enhancedSaveSettings({
        canvasWidth, canvasHeight, gridVisible,
        zoomStepSize: zoomStepSize / 100,
        locationColor, locationShowName,
        barrierColor, barrierShowName
    });
    
    // Close the modal
    enhancedCloseModal();
}

/**
 * Enhanced version of the saveSettings method
 */
function enhancedSaveSettings(formValues) {
    // Enhanced save settings called
    
    // Update the settings object with new values
    const settings = window.app.settings;
    
    if (formValues) {
        // Use values from form if provided
        settings.canvasWidth = formValues.canvasWidth;
        settings.canvasHeight = formValues.canvasHeight;
        settings.gridVisible = formValues.gridVisible;
        settings.zoomStepSize = formValues.zoomStepSize;
        
        // Update element types
        if (window.app.elementTypes) {
            if (window.app.elementTypes.Location) {
                window.app.elementTypes.Location.color = formValues.locationColor;
                window.app.elementTypes.Location.showName = formValues.locationShowName;
            }
            
            if (window.app.elementTypes.Barrier) {
                window.app.elementTypes.Barrier.color = formValues.barrierColor;
                window.app.elementTypes.Barrier.showName = formValues.barrierShowName;
            }
        }
    }
    
    // Update grid visibility
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer) {
        gridContainer.style.display = settings.gridVisible ? 'block' : 'none';
        // Updated grid visibility
    }
    
    // Apply canvas dimensions
    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
        const cellSize = settings.cellSize || 20;
        canvasEl.style.width = (settings.canvasWidth * cellSize) + 'px';
        canvasEl.style.height = (settings.canvasHeight * cellSize) + 'px';
        // Applied canvas dimensions
        const dimensions = {
            width: canvasEl.style.width,
            height: canvasEl.style.height
        };
    }
    
    // Redraw grid
    if (window.app.canvas && typeof window.app.canvas.drawGrid === 'function') {
        window.app.canvas.drawGrid();
        // Redrew grid with new dimensions
    }
    
    // Update existing elements
    if (typeof settings.updateExistingElements === 'function') {
        settings.updateExistingElements();
        // Updated existing elements
    }
    
    // Settings saved successfully
}
