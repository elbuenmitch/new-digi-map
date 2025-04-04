// SVG Save Dialog - handles UI for saving SVGs to the database
export class SaveDialog {
    constructor(app) {
        this.app = app;
        this.db = app.database;
        this.createDialog();
    }

    createDialog() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('save-svg-modal')) {
            const modalHTML = `
                <div id="save-svg-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <span class="modal-title">Save SVG to Database</span>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="save-warning" style="display: none; background-color: #ffeeee; color: #cc0000; padding: 10px; margin: 10px 0; border: 1px solid #cc0000; border-radius: 4px; font-weight: bold; text-align: center;"></div>
                            
                            <div class="form-group">
                                <label for="centercode-select">Centercode:</label>
                                <div class="select-with-add">
                                    <select id="centercode-select"></select>
                                    <button id="add-centercode-btn" title="Add New Centercode">+</button>
                                </div>
                            </div>
                            
                            <div id="new-centercode-container" class="form-group" style="display: none;">
                                <label for="new-centercode">New Centercode:</label>
                                <input type="text" id="new-centercode" placeholder="Enter new centercode">
                                <div class="button-group">
                                    <button id="save-centercode-btn" class="action-button">Save</button>
                                    <button id="cancel-centercode-btn" class="action-button">Cancel</button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="floor-select">Floor:</label>
                                <div class="select-with-add">
                                    <select id="floor-select"></select>
                                    <button id="add-floor-btn" title="Add New Floor">+</button>
                                </div>
                            </div>
                            
                            <div id="new-floor-container" class="form-group" style="display: none;">
                                <label for="new-floor">New Floor:</label>
                                <input type="text" id="new-floor" placeholder="Enter new floor">
                                <div class="button-group">
                                    <button id="save-floor-btn" class="action-button">Save</button>
                                    <button id="cancel-floor-btn" class="action-button">Cancel</button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="save-svg-to-db-btn" class="action-button">Save SVG</button>
                        </div>
                    </div>
                </div>
            `;
            
            const div = document.createElement('div');
            div.innerHTML = modalHTML;
            document.body.appendChild(div.firstElementChild);
            
            // Add event listeners
            document.querySelector('#save-svg-modal .close-modal').addEventListener('click', () => {
                this.closeDialog();
            });
            
            // Centercode add button
            document.getElementById('add-centercode-btn').addEventListener('click', () => {
                document.getElementById('centercode-select').parentElement.style.display = 'none';
                document.getElementById('new-centercode-container').style.display = 'block';
            });
            
            // Centercode save button
            document.getElementById('save-centercode-btn').addEventListener('click', async () => {
                const newCentercode = document.getElementById('new-centercode').value.trim();
                if (newCentercode) {
                    try {
                        await this.db.createCentercode(newCentercode);
                        await this.loadCentercodes();
                        document.getElementById('centercode-select').value = newCentercode;
                        await this.loadFloors(newCentercode);
                        this.showAddCentercodeForm(false);
                    } catch (error) {
                        this.showWarning(`Error creating centercode: ${error.message}`);
                    }
                } else {
                    this.showWarning('Please enter a centercode');
                }
            });
            
            // Centercode cancel button
            document.getElementById('cancel-centercode-btn').addEventListener('click', () => {
                this.showAddCentercodeForm(false);
            });
            
            // Floor add button
            document.getElementById('add-floor-btn').addEventListener('click', () => {
                document.getElementById('floor-select').parentElement.style.display = 'none';
                document.getElementById('new-floor-container').style.display = 'block';
            });
            
            // Floor save button
            document.getElementById('save-floor-btn').addEventListener('click', async () => {
                const newFloor = document.getElementById('new-floor').value.trim();
                const centercode = document.getElementById('centercode-select').value;
                
                if (newFloor && centercode) {
                    try {
                        // Get centercode ID
                        const centercodes = await this.db.getCentercodes();
                        const centercodeObj = centercodes.find(c => c.centercode === centercode);
                        
                        if (centercodeObj) {
                            await this.db.createFloor(centercodeObj.id, newFloor);
                            await this.loadFloors(centercode);
                            document.getElementById('floor-select').value = newFloor;
                            this.showAddFloorForm(false);
                        } else {
                            this.showWarning('Selected centercode not found');
                        }
                    } catch (error) {
                        this.showWarning(`Error creating floor: ${error.message}`);
                    }
                } else {
                    this.showWarning('Please enter a floor and select a centercode');
                }
            });
            
            // Floor cancel button
            document.getElementById('cancel-floor-btn').addEventListener('click', () => {
                this.showAddFloorForm(false);
            });
            
            // Centercode selection change
            document.getElementById('centercode-select').addEventListener('change', async (e) => {
                const centercode = e.target.value;
                if (centercode) {
                    await this.loadFloors(centercode);
                }
            });
            
            // Save SVG button
            document.getElementById('save-svg-to-db-btn').addEventListener('click', async () => {
                await this.saveSVGToDatabase();
            });
        }
    }
    
    showAddCentercodeForm(show) {
        document.getElementById('centercode-select').parentElement.style.display = show ? 'none' : 'flex';
        document.getElementById('new-centercode-container').style.display = show ? 'block' : 'none';
        document.getElementById('new-centercode').value = '';
    }
    
    showAddFloorForm(show) {
        document.getElementById('floor-select').parentElement.style.display = show ? 'none' : 'flex';
        document.getElementById('new-floor-container').style.display = show ? 'block' : 'none';
        document.getElementById('new-floor').value = '';
    }
    
    async openDialog() {
        // Clear any previous warnings
        this.showWarning(null);
        
        // Reset and hide add forms
        this.showAddCentercodeForm(false);
        this.showAddFloorForm(false);
        
        // Load centercodes
        await this.loadCentercodes();
        
        // Load floors for the first centercode
        const centercodeSelect = document.getElementById('centercode-select');
        if (centercodeSelect.options.length > 0) {
            await this.loadFloors(centercodeSelect.value);
        }
        
        // Show modal
        document.getElementById('save-svg-modal').classList.remove('hidden');
    }
    
    closeDialog() {
        document.getElementById('save-svg-modal').classList.add('hidden');
    }
    
    showWarning(message) {
        const warningEl = document.getElementById('save-warning');
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
            const select = document.getElementById('centercode-select');
            
            // Clear existing options
            select.innerHTML = '';
            
            // Add options for each centercode
            centercodes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.centercode;
                option.textContent = c.centercode;
                select.appendChild(option);
            });
            
            // Enable/disable controls based on whether we have centercodes
            const hasCentercodes = centercodes.length > 0;
            document.getElementById('floor-select').disabled = !hasCentercodes;
            document.getElementById('add-floor-btn').disabled = !hasCentercodes;
            document.getElementById('save-svg-to-db-btn').disabled = !hasCentercodes;
        } catch (error) {
            console.error('Error loading centercodes:', error);
            this.showWarning(`Error loading centercodes: ${error.message}`);
        }
    }
    
    async loadFloors(centercode) {
        try {
            const floors = await this.db.getFloors(centercode);
            const select = document.getElementById('floor-select');
            
            // Clear existing options
            select.innerHTML = '';
            
            // Add options for each floor
            floors.forEach(f => {
                const option = document.createElement('option');
                option.value = f.picking_floor;
                option.textContent = f.picking_floor;
                option.dataset.id = f.id;
                select.appendChild(option);
            });
            
            // Enable/disable save button based on whether we have floors
            const hasFloors = floors.length > 0;
            document.getElementById('save-svg-to-db-btn').disabled = !hasFloors;
        } catch (error) {
            console.error('Error loading floors:', error);
            this.showWarning(`Error loading floors: ${error.message}`);
        }
    }
    
    async saveSVGToDatabase() {
        const centercodeSelect = document.getElementById('centercode-select');
        const floorSelect = document.getElementById('floor-select');
        
        if (!centercodeSelect.value) {
            this.showWarning('Please select a centercode');
            return;
        }
        
        if (!floorSelect.value) {
            this.showWarning('Please select a floor');
            return;
        }
        
        try {
            // Get centercode and floor info
            const centercodes = await this.db.getCentercodes();
            const centercodeObj = centercodes.find(c => c.centercode === centercodeSelect.value);
            
            if (!centercodeObj) {
                this.showWarning('Selected centercode not found');
                return;
            }
            
            const floors = await this.db.getFloors(centercodeSelect.value);
            const floorObj = floors.find(f => f.picking_floor === floorSelect.value);
            
            if (!floorObj) {
                this.showWarning('Selected floor not found');
                return;
            }
            
            // Check if an SVG already exists for this centercode/floor
            const exists = await this.db.checkSVGExists(centercodeObj.id, floorObj.id);
            if (exists) {
                // Ask user if they want to update the existing SVG
                if (confirm('An SVG already exists for this centercode/floor combination. Do you want to update it?')) {
                    // Update the SVG elements in the database
                    const result = await this.db.updateSVGElements(this.app, this.app.elements, centercodeSelect.value, floorSelect.value);
                    
                    // Close the dialog
                    this.closeDialog();
                    
                    // Show result message
                    if (result.success) {
                        alert(result.message);
                    } else {
                        alert(`Error updating SVG: ${result.message}`);
                    }
                }
                return;
            }
            
            // Save elements to database as new entry
            await this.db.saveElements(this.app.elements, centercodeObj.id, floorObj.id);
            
            // Close the dialog
            this.closeDialog();
            
            // Show success message
            alert('SVG saved successfully');
        } catch (error) {
            console.error('Error saving SVG:', error);
            this.showWarning(`Error saving SVG: ${error.message}`);
        }
    }
}
