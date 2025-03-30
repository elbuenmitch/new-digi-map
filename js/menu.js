// Menu manager - handles the navigation menu functionality
export class MenuManager {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Pan tool
        document.getElementById('pan-tool').addEventListener('click', () => {
            // Deactivate all element type selections
            document.querySelectorAll('.tool-button[data-type]').forEach(button => {
                button.classList.remove('active');
            });
            
            // Activate pan tool
            document.getElementById('pan-tool').classList.add('active');
            
            // Change cursor for canvas
            document.getElementById('canvas').style.cursor = 'grab';
        });
        
        // Element type buttons - return to normal cursor
        document.querySelectorAll('.tool-button[data-type]').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById('pan-tool').classList.remove('active');
                document.getElementById('canvas').style.cursor = 'crosshair';
            });
        });
        
        // Close popup on click outside
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('element-popup');
            const clickedOnPopup = popup.contains(e.target);
            const clickedOnElement = e.target.closest('.canvas-element');
            
            if (!clickedOnPopup && !clickedOnElement && !popup.classList.contains('hidden')) {
                this.app.canvas.hideElementPopup();
            }
        });
        
        // Close modal on click outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('settings-modal');
            const modalContent = modal.querySelector('.modal-content');
            
            if (!modal.classList.contains('hidden') && !modalContent.contains(e.target)) {
                this.app.settings.closeSettingsModal();
            }
        });
        
        // Close modal when close button is clicked
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.app.settings.closeSettingsModal();
        });
    }
}
