// UI Manager - handles UI elements like notifications and popups
export class UIManager {
    constructor() {
        this.notificationTimeout = null;
    }
    
    // Show a temporary notification message
    showNotification(message, duration = 2500) {
        // Check if notification container exists, if not create it
        let notification = document.getElementById('canvas-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'canvas-notification';
            
            // Add styles to notification
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '10px 15px';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '1000';
            notification.style.fontWeight = 'bold';
            notification.style.transition = 'opacity 0.3s';
            notification.style.opacity = '0';
            
            // Add to document
            document.body.appendChild(notification);
        }
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        // Set message and show notification
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Auto-hide after duration
        this.notificationTimeout = setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }
    
    // Element popup management
    showElementPopup(element, clientX, clientY, canvasContainer) {
        const popup = document.getElementById('element-popup');
        
        // Fill in element data
        document.getElementById('element-id').value = element.id;
        document.getElementById('element-type').textContent = element.type;
        document.getElementById('element-x').textContent = element.x;
        document.getElementById('element-y').textContent = element.y;
        document.getElementById('element-width').textContent = element.width;
        document.getElementById('element-height').textContent = element.height;
        
        // Get element and popup dimensions
        const rect = canvasContainer.getBoundingClientRect();
        const elementRect = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        };
        const popupWidth = popup.offsetWidth || 250; // Default width from CSS if not rendered yet
        const popupHeight = popup.offsetHeight || 200; // Estimated height if not rendered yet
        
        // Determine the best position for the popup
        // Try to position to the right of the element first
        let left = (elementRect.x + elementRect.width + 20) - rect.left;
        let top = elementRect.y - rect.top;
        
        // Check if popup would go off the right edge of the canvas
        if (left + popupWidth > canvasContainer.clientWidth) {
            // If it would, try positioning to the left of the element instead
            left = (elementRect.x - popupWidth - 20) - rect.left;
            
            // If that would go off the left edge, position it above or below
            if (left < 0) {
                left = elementRect.x - rect.left;
                
                // Try below the element
                top = (elementRect.y + elementRect.height + 20) - rect.top;
                
                // If that would go off the bottom, try above
                if (top + popupHeight > canvasContainer.clientHeight) {
                    top = (elementRect.y - popupHeight - 20) - rect.top;
                }
            }
        }
        
        // Ensure popup stays within canvas bounds
        left = Math.max(10, Math.min(canvasContainer.clientWidth - popupWidth - 10, left));
        top = Math.max(10, Math.min(canvasContainer.clientHeight - popupHeight - 10, top));
        
        // Position popup
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        
        // Show popup
        popup.classList.remove('hidden');
    }
    
    hideElementPopup() {
        document.getElementById('element-popup').classList.add('hidden');
    }
    
    // Confirmation dialogs
    confirmElementDeletion(elementId) {
        return confirm(`Are you sure you want to delete the element with ID "${elementId}"?`);
    }
    
    confirmMultipleElementDeletion(count) {
        const message = count === 1 
            ? `Are you sure you want to delete the selected element?` 
            : `Are you sure you want to delete ${count} selected elements?`;
            
        return confirm(message);
    }
}
