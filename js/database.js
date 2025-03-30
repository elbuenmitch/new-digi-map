// Database interaction module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export class DatabaseManager {
    constructor() {
        // Initialize Supabase client
        // Note: In a production environment, these values should be securely stored
        this.supabase = createClient(
            'https://nxribktnysqkqwfyapzy.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmlia3RueXNxa3F3ZnlhcHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyOTExNzksImV4cCI6MjA1ODg2NzE3OX0.8zRGdwGuw2LVqfilgWD2so1MVAEo_iKUqQlf9it1wLY'
        );
    }

    /**
     * Get all centercodes
     */
    async getCentercodes() {
        const { data, error } = await this.supabase
            .from('centercodes')
            .select('*')
            .order('centercode');
        
        if (error) {
            console.error('Error fetching centercodes:', error);
            throw error;
        }
        
        return data || [];
    }

    /**
     * Get floors for a specific centercode
     */
    async getFloors(centercode) {
        const { data: centercodeData } = await this.supabase
            .from('centercodes')
            .select('id')
            .eq('centercode', centercode)
            .single();
            
        if (!centercodeData) {
            throw new Error(`Centercode "${centercode}" not found`);
        }
            
        const { data, error } = await this.supabase
            .from('floors')
            .select('*')
            .eq('centercode', centercodeData.id)
            .order('picking_floor');
        
        if (error) {
            console.error('Error fetching floors:', error);
            throw error;
        }
        
        return data || [];
    }

    /**
     * Create a new centercode
     */
    async createCentercode(centercode) {
        const { data, error } = await this.supabase
            .from('centercodes')
            .insert([{ centercode }])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating centercode:', error);
            throw error;
        }
        
        return data;
    }

    /**
     * Create a new floor
     */
    async createFloor(centercodeId, pickingFloor) {
        const { data, error } = await this.supabase
            .from('floors')
            .insert([{ 
                centercode: centercodeId,
                picking_floor: pickingFloor 
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating floor:', error);
            throw error;
        }
        
        return data;
    }

    /**
     * Check if an SVG already exists for a centercode/floor combination
     */
    async checkSVGExists(centercodeId, floorId) {
        const { data, error } = await this.supabase
            .from('elements')
            .select('id')
            .eq('centercode', centercodeId)
            .eq('picking_floor', floorId)
            .limit(1);
        
        if (error) {
            console.error('Error checking SVG existence:', error);
            throw error;
        }
        
        return data && data.length > 0;
    }

    /**
     * Save elements to the database
     */
    async saveElements(elements, centercodeId, floorId) {
        // Convert elements to the database format
        const dbElements = elements.map(element => ({
            centercode: centercodeId,
            picking_floor: floorId,
            element_id: element.id,
            x: element.x,
            y: element.y,
            w: element.width,
            h: element.height,
            element_type: element.type
        }));
        
        const { data, error } = await this.supabase
            .from('elements')
            .insert(dbElements);
        
        if (error) {
            console.error('Error saving elements:', error);
            throw error;
        }
        
        return true;
    }

    /**
     * Load elements from the database for a specific centercode/floor
     */
    async loadElements(centercodeId, floorId) {
        const { data, error } = await this.supabase
            .from('elements')
            .select('*')
            .eq('centercode', centercodeId)
            .eq('picking_floor', floorId);
        
        if (error) {
            console.error('Error loading elements:', error);
            throw error;
        }
        
        // Convert database format back to app format
        return data.map(dbElement => ({
            id: dbElement.element_id,
            x: dbElement.x,
            y: dbElement.y,
            width: dbElement.w,
            height: dbElement.h,
            type: dbElement.element_type,
            // Set color and showName based on element type (these will be overridden by app settings)
            color: '#CCCCCC',
            showName: true
        }));
    }

    /**
     * Populate the editor with SVG content from the database based on centercode and floor
     * Handles the entire process of loading an SVG: clearing previous content,
     * resetting canvas dimensions, and displaying metadata
     */
    async populateEditorWithSVG(app, centercode, floorName) {
        try {
            // Step 1: Get centercode and floor IDs
            const { data: centercodeData } = await this.supabase
                .from('centercodes')
                .select('id')
                .eq('centercode', centercode)
                .single();
                
            if (!centercodeData) {
                throw new Error(`Centercode "${centercode}" not found`);
            }
            
            const { data: floorData } = await this.supabase
                .from('floors')
                .select('id')
                .eq('centercode', centercodeData.id)
                .eq('picking_floor', floorName)
                .single();
                
            if (!floorData) {
                throw new Error(`Floor "${floorName}" not found for centercode "${centercode}"`);
            }
            
            // Step 2: Check if elements exist for this centercode/floor combination
            const exists = await this.checkSVGExists(centercodeData.id, floorData.id);
            if (!exists) {
                throw new Error(`No SVG data found for centercode "${centercode}" and floor "${floorName}"`);
            }
            
            // Step 3: Load elements from database
            const elements = await this.loadElements(centercodeData.id, floorData.id);
            
            // Step 4: Update element properties based on element types in app settings
            elements.forEach(element => {
                if (app.elementTypes[element.type]) {
                    element.color = app.elementTypes[element.type].color;
                    element.showName = app.elementTypes[element.type].showName;
                }
            });
            
            // Step 5: Clear existing canvas content and reset canvas state
            app.canvas.clearElements();
            
            // Reset canvas dimensions and zoom to default
            app.canvas.resetViewport();
            
            // Step 6: Set the loaded elements as the current elements
            app.elements = elements;
            
            // Step 7: Render each element to the canvas with full opacity
            elements.forEach(element => {
                // Create the element using the standard createElement method
                app.canvas.elementManager.createElement(
                    element.type,
                    element.x,
                    element.y,
                    element.width,
                    element.height,
                    element.id
                );
                
                // Then immediately set its opacity to 1.0 (full color)
                const domElement = document.getElementById(`element-${element.id}`);
                if (domElement) {
                    domElement.style.opacity = '1.0';
                }
            });
            
            // Step 8: Update UI to display centercode and floor information
            this.updateMetadataDisplay(centercode, floorName);
            
            return { success: true, message: `SVG for ${centercode} - Floor ${floorName} loaded successfully` };
        } catch (error) {
            console.error('Error populating editor with SVG:', error);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * Update the UI to display centercode and floor information
     */
    updateMetadataDisplay(centercode, floorName) {
        // Check if metadata container exists, if not create it
        let metadataContainer = document.getElementById('svg-metadata-container');
        
        if (!metadataContainer) {
            metadataContainer = document.createElement('div');
            metadataContainer.id = 'svg-metadata-container';
            metadataContainer.className = 'svg-metadata-container';
            
            // Position below SVG EDITOR logo in top left
            const header = document.querySelector('.app-header');
            if (header) {
                header.insertAdjacentElement('afterend', metadataContainer);
            } else {
                // Fallback if header not found
                document.body.insertBefore(metadataContainer, document.body.firstChild);
            }
        }
        
        // Update metadata content
        metadataContainer.innerHTML = `
            <div class="svg-metadata">
                <span class="metadata-label">Centercode:</span>
                <span class="metadata-value">${centercode}</span>
                <span class="metadata-label">Floor:</span>
                <span class="metadata-value">${floorName}</span>
            </div>
        `;
    }
    
    /**
     * Update SVG elements in the database
     * This will delete all existing elements for the centercode/floor combination
     * and replace them with the new elements
     * 
     * @param {Array} elements - Array of elements to save
     * @param {string} centercode - Centercode name
     * @param {string} floorName - Floor name
     * @returns {Object} - Result of the operation
     */
    async updateSVGElements(app, elements, centercode, floorName) {
        try {
            // Validate input
            if (!centercode || !floorName) {
                return { 
                    success: false, 
                    message: 'Centercode and picking floor must be specified for update' 
                };
            }
            
            // Step 1: Get centercode and floor IDs
            const { data: centercodeData } = await this.supabase
                .from('centercodes')
                .select('id')
                .eq('centercode', centercode)
                .single();
                
            if (!centercodeData) {
                return { 
                    success: false, 
                    message: `Centercode "${centercode}" not found` 
                };
            }
            
            const { data: floorData } = await this.supabase
                .from('floors')
                .select('id')
                .eq('centercode', centercodeData.id)
                .eq('picking_floor', floorName)
                .single();
                
            if (!floorData) {
                return { 
                    success: false, 
                    message: `Floor "${floorName}" not found for centercode "${centercode}"` 
                };
            }
            
            // Step 2: Delete all existing elements for this centercode/floor
            const { error: deleteError } = await this.supabase
                .from('elements')
                .delete()
                .eq('centercode', centercodeData.id)
                .eq('picking_floor', floorData.id);
            
            if (deleteError) {
                console.error('Error deleting existing elements:', deleteError);
                return { 
                    success: false, 
                    message: `Error deleting existing elements: ${deleteError.message}` 
                };
            }
            
            // Step 3: Insert new elements
            // Convert elements to the database format
            const dbElements = elements.map(element => ({
                centercode: centercodeData.id,
                picking_floor: floorData.id,
                element_id: element.id,
                x: element.x,
                y: element.y,
                w: element.width,
                h: element.height,
                element_type: element.type
            }));
            
            const { error: insertError } = await this.supabase
                .from('elements')
                .insert(dbElements);
            
            if (insertError) {
                console.error('Error saving updated elements:', insertError);
                return { 
                    success: false, 
                    message: `Error saving updated elements: ${insertError.message}` 
                };
            }
            
            // Step 4: Refresh the editor view with the updated elements
            await this.populateEditorWithSVG(app, centercode, floorName);
            
            return { 
                success: true, 
                message: `SVG for ${centercode} - Floor ${floorName} updated successfully` 
            };
        } catch (error) {
            console.error('Error updating SVG elements:', error);
            return { 
                success: false, 
                message: error.message 
            };
        }
    }
}
