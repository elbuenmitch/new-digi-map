// SVG Load Dialog - handles UI for loading SVGs from the database
export class LoadDialog {
    constructor(app) {
        this.app = app;
        this.db = app.database;
        this.createDialog();
    }

    createDialog() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('load-svg-modal')) {
            const modalHTML = `
                <div id="load-svg-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <span class="modal-title">Load SVG from Database</span>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="load-warning" style="display: none; background-color: #ffeeee; color: #cc0000; padding: 10px; margin: 10px 0; border: 1px solid #cc0000; border-radius: 4px; font-weight: bold; text-align: center;"></div>
                            
                            <div class="form-group">
                                <label for="load-centercode-select">Centercode:</label>
                                <select id="load-centercode-select"></select>
                            </div>
                            
                            <div class="form-group">
                                <label for="load-floor-select">Floor:</label>
                                <select id="load-floor-select"></select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="load-svg-from-db-btn" class="action-button">Load SVG</button>
                        </div>
                    </div>
                </div>
            `;
            
            const div = document.createElement('div');
            div.innerHTML = modalHTML;
            document.body.appendChild(div.firstElementChild);
            
            // Add event listeners
            document.querySelector('#load-svg-modal .close-modal').addEventListener('click', () => {
                this.closeDialog();
            });
            
            // Centercode selection change
            document.getElementById('load-centercode-select').addEventListener('change', async (e) => {
                const centercode = e.target.value;
                if (centercode) {
                    await this.loadFloors(centercode);
                }
            });
            
            // Load SVG button
            document.getElementById('load-svg-from-db-btn').addEventListener('click', async () => {
                await this.loadSVGFromDatabase();
            });
        }
    }
    
    async openDialog() {
        // Clear any previous warnings
        this.showWarning(null);
        
        // Load centercodes
        await this.loadCentercodes();
        
        // Load floors for the first centercode
        const centercodeSelect = document.getElementById('load-centercode-select');
        if (centercodeSelect.options.length > 0) {
            await this.loadFloors(centercodeSelect.value);
        }
        
        // Show modal
        document.getElementById('load-svg-modal').classList.remove('hidden');
    }
    
    closeDialog() {
        document.getElementById('load-svg-modal').classList.add('hidden');
    }
    
    showWarning(message) {
        const warningEl = document.getElementById('load-warning');
        if (message) {
            warningEl.textContent = message;
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    }
    
    async loadCentercodes() {
        try {
            const centercodes = await this.db.getCentercodes();
            const select = document.getElementById('load-centercode-select');
            
            // Clear existing options
            select.innerHTML = '';
            
            // Add options for each centercode
            centercodes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.centercode;
                option.textContent = c.centercode;
                // No longer need to store ID since we use centercode directly
                select.appendChild(option);
            });
            
            // Enable/disable controls based on whether we have centercodes
            const hasCentercodes = centercodes.length > 0;
            document.getElementById('load-floor-select').disabled = !hasCentercodes;
            document.getElementById('load-svg-from-db-btn').disabled = !hasCentercodes;
        } catch (error) {
            console.error('Error loading centercodes:', error);
            this.showWarning(`Error loading centercodes: ${error.message}`);
        }
    }
    
    async loadFloors(centercode) {
        try {
            const floors = await this.db.getFloors(centercode);
            const select = document.getElementById('load-floor-select');
            
            // Clear existing options
            select.innerHTML = '';
            
            // Add options for each floor
            floors.forEach(f => {
                const option = document.createElement('option');
                option.value = f.floor;
                option.textContent = f.floor;
                select.appendChild(option);
            });
            
            // Enable/disable load button based on whether we have floors
            const hasFloors = floors.length > 0;
            document.getElementById('load-svg-from-db-btn').disabled = !hasFloors;
        } catch (error) {
            console.error('Error loading floors:', error);
            this.showWarning(`Error loading floors: ${error.message}`);
        }
    }
    
    async loadSVGFromDatabase() {
        const centercodeSelect = document.getElementById('load-centercode-select');
        const floorSelect = document.getElementById('load-floor-select');
        
        if (!centercodeSelect.value) {
            this.showWarning('Please select a centercode');
            return;
        }
        
        if (!floorSelect.value) {
            this.showWarning('Please select a floor');
            return;
        }
        
        try {
            // Confirm with user that this will replace their current SVG
            if (this.app.elements.length > 0) {
                if (!confirm('Loading an SVG will replace your current work. Continue?')) {
                    return;
                }
            }
            
            // Use the new populateEditorWithSVG method to handle the entire loading process
            const result = await this.db.populateEditorWithSVG(
                this.app,
                centercodeSelect.value,
                floorSelect.value
            );
            
            if (result.success) {
                // Close the dialog
                this.closeDialog();
                
                // Show success message
                alert(result.message);
            } else {
                // Show error in the warning area
                this.showWarning(result.message);
            }
        } catch (error) {
            console.error('Error loading SVG:', error);
            this.showWarning(`Error loading SVG: ${error.message}`);
        }
    }
}
