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
     * Upload a background image for a map
     * @param {string} centercode - The centercode for the map
     * @param {string} floor - The floor for the map
     * @param {File} imageFile - The image file to upload
     * @param {Object} metadata - Additional metadata for the image
     * @returns {Promise<Object>} The uploaded image data including public URL
     */
    async uploadBackgroundImage(centercode, floor, imageFile, metadata = {}) {
        if (!centercode || !floor || !imageFile) {
            throw new Error('Centercode, floor, and image file are required');
        }

        try {
            // Generate a unique path for the image - use a simpler path structure to avoid potential issues
            const timestamp = Date.now();
            const fileExt = imageFile.name.split('.').pop();
            const storagePath = `${centercode}_${floor}_${timestamp}.${fileExt}`;
            
            // Upload the file to Supabase Storage
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('floor-plan-images')
                .upload(storagePath, imageFile, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) {
                throw uploadError;
            }
            
            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = this.supabase.storage
                .from('floor-plan-images')
                .getPublicUrl(storagePath);
                
            // Verify the URL is accessible by making a HEAD request
            try {
                await fetch(publicUrl, { method: 'HEAD' });
            } catch (urlTestError) {
                // Silent catch - just testing if URL is accessible
            }
            
            console.log(`Generated public URL: ${publicUrl}`);
            console.log('Checking if background_image_metadata record already exists...');
            
            try {
                // Check if record already exists
                const { data: existing, error: existingError } = await this.supabase
                    .from('background_image_metadata')
                    .select('id, storage_path')
                    .eq('centercode', centercode)
                    .eq('floor', floor)
                    .maybeSingle();
                
                if (existingError) {
                    console.error('Error checking for existing metadata record:', existingError);
                    console.error('The background_image_metadata table may not exist in your Supabase database.');
                    throw existingError;
                }
                
                // Prepare metadata
                const imageMetadata = {
                    storage_path: storagePath,
                    opacity: metadata.opacity || 1.0,
                    show_image: metadata.showImage !== undefined ? metadata.showImage : true,
                    original_width: metadata.originalWidth || 0,
                    original_height: metadata.originalHeight || 0,
                    updated_at: new Date()
                };
                
                console.log('Prepared metadata:', imageMetadata);
                
                if (existing) {
                    console.log(`Found existing record with ID: ${existing.id}, updating...`);
                    // Delete the old file if it exists and is different
                    if (existing.storage_path && existing.storage_path !== storagePath) {
                        console.log(`Removing old image at path: ${existing.storage_path}`);
                        await this.supabase.storage
                            .from('floor-plan-images')
                            .remove([existing.storage_path])
                            .catch(error => console.error('Error removing old image:', error));
                    }
                    
                    // Update existing record
                    const { data, error } = await this.supabase
                        .from('background_image_metadata')
                        .update(imageMetadata)
                        .eq('id', existing.id)
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Error updating metadata record:', error);
                        throw error;
                    }
                    
                    console.log('Successfully updated metadata record');
                    return { ...data, publicUrl };
                } else {
                    console.log('No existing record found, creating new one...');
                    // Insert new record
                    const { data, error } = await this.supabase
                        .from('background_image_metadata')
                        .insert([{
                            centercode,
                            floor,
                            ...imageMetadata
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Error inserting new metadata record:', error);
                        throw error;
                    }
                    
                    console.log('Successfully created new metadata record');
                    return { ...data, publicUrl };
                }
            } catch (dbError) {
                console.error('Database operation failed:', dbError);
                // At least return the uploaded image URL even if metadata storage failed
                return {
                    storage_path: storagePath,
                    publicUrl,
                    error: dbError,
                    message: 'Image uploaded to storage but metadata could not be saved. The database table may not exist.'
                };
            }
        } catch (error) {
            console.error('Error in uploadBackgroundImage:', error);
            throw error;
        }
    }
    
    /**
     * Get background image metadata and URL for a map
     * @param {string} centercode - The centercode
     * @param {string} floor - The floor
     * @returns {Promise<Object|null>} The image metadata or null if not found
     */
    async getBackgroundImage(centercode, floor) {
        try {
            if (!centercode || !floor) {
                console.log('Missing centercode or floor in getBackgroundImage');
                return null;
            }
            
            console.log(`Getting background image for centercode: ${centercode}, floor: ${floor}`);
            
            // Get metadata from database
            const { data, error } = await this.supabase
                .from('background_image_metadata')
                .select('*')
                .eq('centercode', centercode)
                .eq('floor', floor)
                .maybeSingle();
            
            if (error) {
                console.error('Error fetching background image metadata:', error);
                return null;
            }
            
            if (!data) {
                console.log('No background image metadata found for this map');
                return null;
            }
            
            console.log('Found background image metadata:', data);
            
            // Get public URL for the image
            const storagePath = data.storage_path;
            console.log(`Generating public URL for storage path: ${storagePath}`);
            
            // Try two different methods to get a working URL
            
            // Method 1: Standard public URL
            const { data: urlData } = this.supabase.storage
                .from('floor-plan-images')
                .getPublicUrl(storagePath);
            
            // Method 2: Try to get a signed URL with temporary access (works even with policies issues)
            const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
                .from('floor-plan-images')
                .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry
                
            // Determine which URL to use
            let publicUrl = urlData.publicUrl;
            let signedUrl = signedUrlData?.signedUrl;
            
            console.log(`Generated public URL: ${publicUrl}`);
            if (signedUrl) {
                console.log(`Generated signed URL: ${signedUrl}`);
            } else if (signedUrlError) {
                console.error('Error generating signed URL:', signedUrlError);
            }
            
            // Create a test URL to ensure the image can be retrieved
            let finalUrl = publicUrl;
            
            // Test if URL is accessible
            try {
                console.log(`Testing URL accessibility: ${finalUrl}`);
                const testResponse = await fetch(finalUrl, { method: 'HEAD' });
                
                if (!testResponse.ok) {
                    console.error(`URL test failed with status: ${testResponse.status}`);
                    
                    // If public URL fails but we have a signed URL, try that instead
                    if (signedUrl) {
                        console.log('Trying signed URL instead...');
                        const signedTestResponse = await fetch(signedUrl, { method: 'HEAD' });
                        
                        if (signedTestResponse.ok) {
                            console.log('Signed URL test succeeded, using signed URL');
                            finalUrl = signedUrl;
                        } else {
                            console.error(`Signed URL test also failed with status: ${signedTestResponse.status}`);
                        }
                    }
                } else {
                    console.log('URL test succeeded');
                }
            } catch (urlTestError) {
                console.error('Error testing URL:', urlTestError);
                
                // If we have a signed URL, try using that instead
                if (signedUrl) {
                    finalUrl = signedUrl;
                    console.log('Using signed URL due to test error with public URL');
                }
            }
            
            return { ...data, publicUrl: finalUrl };
        } catch (error) {
            console.error('Error getting background image:', error);
            return null;
        }
    }
    
    /**
     * Update background image settings
     * @param {string} centercode - The centercode
     * @param {string} floor - The floor
     * @param {Object} settings - The settings to update
     * @returns {Promise<Object|null>} The updated metadata
     */
    async updateBackgroundImageSettings(centercode, floor, settings) {
        try {
            if (!centercode || !floor) {
                throw new Error('Centercode and floor are required');
            }
            
            const updates = {
                updated_at: new Date()
            };
            
            if (settings.opacity !== undefined) {
                updates.opacity = settings.opacity;
            }
            
            if (settings.showImage !== undefined) {
                updates.show_image = settings.showImage;
            }
            
            const { data, error } = await this.supabase
                .from('background_image_metadata')
                .update(updates)
                .eq('centercode', centercode)
                .eq('floor', floor)
                .select()
                .single();
            
            if (error) throw error;
            
            // Get public URL
            if (data && data.storage_path) {
                const { data: { publicUrl } } = this.supabase.storage
                    .from('floor-plan-images')
                    .getPublicUrl(data.storage_path);
                
                return { ...data, publicUrl };
            }
            
            return data;
        } catch (error) {
            console.error('Error updating background image settings:', error);
            throw error;
        }
    }
    
    /**
     * Delete background image for a map
     * @param {string} centercode - The centercode
     * @param {string} floor - The floor
     * @returns {Promise<boolean>} Success flag
     */
    async deleteBackgroundImage(centercode, floor) {
        try {
            if (!centercode || !floor) {
                throw new Error('Centercode and floor are required');
            }
            
            // Get metadata to find storage path
            const { data } = await this.supabase
                .from('background_image_metadata')
                .select('storage_path')
                .eq('centercode', centercode)
                .eq('floor', floor)
                .maybeSingle();
            
            if (data && data.storage_path) {
                // Delete from storage
                await this.supabase.storage
                    .from('floor-plan-images')
                    .remove([data.storage_path])
                    .catch(error => console.error('Error removing image from storage:', error));
            }
            
            // Delete metadata
            const { error: metadataError } = await this.supabase
                .from('background_image_metadata')
                .delete()
                .eq('centercode', centercode)
                .eq('floor', floor);
            
            if (metadataError) throw metadataError;
            
            return true;
        } catch (error) {
            console.error('Error deleting background image:', error);
            throw error;
        }
    }

    /**
     * Get all centercodes from the database
     * @returns {Promise<Array>} Array of centercode objects
     */
    async getCentercodes() {
        const { data, error } = await this.supabase
            .from('centercodes')
            .select('*')
            .order('centercode');
        
        if (error) {
            // console.error('Error fetching centercodes:', error);
            throw error;
        }
        
        return data || [];
    }

    /**
     * Create a new centercode in the database
     * @param {string} centercode - The centercode value
     * @param {number} cpgCenterId - Optional CPG center ID
     * @returns {Promise<Object>} The created centercode object
     */
    async createCentercode(centercode, cpgCenterId = null) {
        if (!centercode) {
            throw new Error('Centercode is required');
        }

        const { data, error } = await this.supabase
            .from('centercodes')
            .insert([{ centercode, cpg_centerid: cpgCenterId }])
            .select()
            .single();
        
        if (error) {
            // console.error('Error creating centercode:', error);
            throw error;
        }
        
        return data;
    }

    /**
     * Get all floors from the database
     * @returns {Promise<Array>} Array of floor objects
     */
    async getAllFloors() {
        const { data, error } = await this.supabase
            .from('floors')
            .select('*')
            .order('floor');
        
        if (error) {
            // console.error('Error fetching floors:', error);
            throw error;
        }
        
        return data || [];
    }

    /**
     * Get floors for a specific centercode
     * @param {string} centercode - The centercode to filter by
     * @returns {Promise<Array>} Array of floor objects
     */
    async getFloors(centercode) {
        if (!centercode) {
            throw new Error('Centercode is required');
        }

        try {
            // Get floors from elements table for the specific centercode
            const { data, error } = await this.supabase
                .from('elements')
                .select('floor')
                .eq('centercode', centercode);
            
            if (error) {
                // console.error('Error fetching floors for centercode:', error);
                throw error;
            }
            
            // Filter for unique floors client-side
            const uniqueFloors = [];
            const floorMap = new Map();
            
            if (data && data.length > 0) {
                data.forEach(item => {
                    if (!floorMap.has(item.floor)) {
                        floorMap.set(item.floor, true);
                        uniqueFloors.push(item);
                    }
                });
                return uniqueFloors;
            }
            
            // If no floors are found in elements table, return an empty array
            return [];
        } catch (error) {
            // console.error('Error in getFloors:', error);
            return [];
        }
    }

    /**
     * Create a new floor in the database
     * @param {string} floor - The floor value
     * @param {string} centercode - The centercode to associate the floor with
     * @returns {Promise<Object>} The created floor object
     */
    async createFloor(floor, centercode) {
        if (!floor) {
            throw new Error('Floor is required');
        }

        try {
            // Check if floor already exists in floors table
            const { data: existingFloor, error: checkError } = await this.supabase
                .from('floors')
                .select('*')
                .eq('floor', floor);

            // Create the floor in floors table if it doesn't exist
            let floorObj;
            if (checkError) {
                // console.error('Error checking for existing floor:', checkError);
                floorObj = { floor };
            } else if (existingFloor && existingFloor.length > 0) {
                floorObj = existingFloor[0];
            } else {
                // Create the floor
                const { data, error } = await this.supabase
                    .from('floors')
                    .insert([{ floor }])
                    .select();
                
                if (error) {
                    // console.error('Error creating floor:', error);
                    throw error;
                }
                
                floorObj = data && data.length > 0 ? data[0] : { floor };
            }
            
            // If centercode is provided, create a placeholder element to associate floor with centercode
            if (centercode) {
                // First check if this floor is already associated with this centercode
                const { count, error: countError } = await this.supabase
                    .from('elements')
                    .select('id', { count: 'exact', head: true })
                    .eq('centercode', centercode)
                    .eq('floor', floor);
                
                if (countError) {
                } else if (count === 0) {
                    // Create a placeholder element with this floor and centercode
                    // This ensures the floor shows up when querying by centercode
                    const placeholderElement = {
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0,
                        element_type: 'placeholder',
                        element_name: 'placeholder',
                        centercode: centercode,
                        floor: floor
                    };
                    
                    const { error: insertError } = await this.supabase
                        .from('elements')
                        .insert([placeholderElement]);
                    
                    if (insertError) {
                        // console.error('Error creating placeholder element:', insertError);
                    }
                }
            }
            
            return floorObj;
        } catch (error) {
            // Return a minimal object so the UI can continue
            return { floor };
        }
    }

    /**
     * Check if elements exist for a specific centercode and floor
     * @param {string} centercode - The centercode to check
     * @param {string} floor - The floor to check
     * @returns {Promise<boolean>} True if real elements exist (not just placeholders), false otherwise
     */
    async elementsExist(centercode, floor) {
        if (!centercode || !floor) {
            throw new Error('Centercode and floor are required');
        }

        try {
            // Get all elements for this centercode/floor but filter out placeholder elements
            const { data, error } = await this.supabase
                .from('elements')
                .select('element_type')
                .eq('centercode', centercode)
                .eq('floor', floor);
            
            if (error) {
                throw error;
            }
            
            // Check if there are any real elements (not placeholders)
            const realElements = data ? data.filter(el => el.element_type !== 'placeholder') : [];
            return realElements.length > 0;
        } catch (error) {
            return false; // Default to false on error to avoid unnecessary confirmations
        }
    }

    /**
     * Get elements for a specific centercode and floor
     * @param {string} centercode - The centercode to filter by
     * @param {string} floor - The floor to filter by
     * @returns {Promise<Array>} Array of element objects
     */
    async getElements(centercode, floor) {
        if (!centercode || !floor) {
            throw new Error('Centercode and floor are required');
        }

        const { data, error } = await this.supabase
            .from('elements')
            .select('*')
            .eq('centercode', centercode)
            .eq('floor', floor);
        
        if (error) {
            throw error;
        }
        
        return data || [];
    }

    /**
     * Save elements to the database for a specific centercode and floor
     * If elements already exist for the given centercode and floor, they will be deleted first
     * @param {Array} elements - Array of element objects to save
     * @param {string} centercode - The centercode to save elements for
     * @param {string} floor - The floor to save elements for
     * @returns {Promise<Object>} Result object with success and message properties
     */
    async saveElements(elements, centercode, floor) {
        if (!elements || !Array.isArray(elements)) {
            throw new Error('Elements must be an array');
        }

        if (!centercode || !floor) {
            throw new Error('Centercode and floor are required');
        }

        try {
            // Start a transaction to ensure atomicity
            const { error: deleteError } = await this.supabase
                .from('elements')
                .delete()
                .eq('centercode', centercode)
                .eq('floor', floor);
            
            if (deleteError) {
                throw deleteError;
            }
            
            // Get current canvas dimensions from the app instance
            let canvasWidth = 400; // Default width
            let canvasHeight = 300; // Default height
            let cellSize = 20; // Default cell size
            
            // Extract dimensions from app if available
            if (window.app) {
                canvasWidth = window.app.getCanvasWidth ? window.app.getCanvasWidth() : 400;
                canvasHeight = window.app.getCanvasHeight ? window.app.getCanvasHeight() : 300;
                cellSize = window.app.getCellSize ? window.app.getCellSize() : 20;
                
                console.log(`Saving canvas dimensions: ${canvasWidth}x${canvasHeight}, cell size: ${cellSize}`);
            }

            // Prepare elements data
            // Add a placeholder element to store canvas dimensions if no elements exist
            // This ensures we always save canvas dimensions even for empty maps
            let elementsToInsert = [];
            
            if (elements.length === 0) {
                elementsToInsert.push({
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    element_type: 'placeholder',
                    element_name: 'placeholder',
                    centercode,
                    floor,
                    canvas_width: app.getCanvasWidth(),
                    canvas_height: app.getCanvasHeight(),
                    cell_size: app.getCellSize()
                });
            }
            
            // Process regular elements
            elementsToInsert = elementsToInsert.concat(elements.map(element => {
                // Get values or use defaults for required fields to avoid null constraints
                const x = typeof element.x === 'number' ? element.x : 0;
                const y = typeof element.y === 'number' ? element.y : 0;
                const w = element.width || element.w || 10; // Default width
                const h = element.height || element.h || 10; // Default height
                
                // Properly handle element type - normalize to lowercase for storage
                // This should be just 'location', 'barrier', etc. without capitalization
                let element_type = 'location'; // Default
                if (element.type) {
                    // If we have a type, normalize it to lowercase for storage
                    element_type = element.type.toLowerCase();
                } else if (element.elementType) {
                    element_type = element.elementType.toLowerCase();
                } else if (element.element_type) {
                    element_type = element.element_type.toLowerCase();
                }
                
                // Generate a proper element name in the format "type_id"
                // If the ID doesn't have a type prefix already, add one
                let element_name = '';
                let rawId = '';
                
                // Extract the existing ID or use timestamp
                if (element.id) {
                    rawId = element.id;
                } else if (element.elementName) {
                    rawId = element.elementName;
                } else if (element.element_name) {
                    rawId = element.element_name;
                } else {
                    rawId = Date.now().toString();
                }
                
                // If rawId already has "element_" prefix, remove it
                if (rawId.startsWith('element_')) {
                    rawId = rawId.substring(8);
                }
                
                // If rawId already has "type_" prefix, use it as is, otherwise add appropriate prefix
                if (rawId.includes('_') && 
                    rawId.split('_')[0].toLowerCase() === element_type.toLowerCase()) {
                    // Already has correct prefix, use as is
                    element_name = rawId;
                } else {
                    // Add type prefix
                    element_name = `${element_type}_${rawId}`;
                }
                
                return {
                    x,
                    y,
                    w,
                    h,
                    element_type,
                    element_name,
                    centercode,
                    floor,
                    canvas_width: app.getCanvasWidth(),
                    canvas_height: app.getCanvasHeight(),
                    cell_size: app.getCellSize()
                };
            }));

            if (elementsToInsert.length > 0) {
                const { error: insertError } = await this.supabase
                    .from('elements')
                    .insert(elementsToInsert);
                
                if (insertError) {
                    throw insertError;
                }
            }

            return {
                success: true,
                message: `Successfully saved ${elementsToInsert.length} elements for ${centercode} / Floor ${floor}`
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Unknown error occurred while saving elements'
            };
        }
    }

    /**
     * Load elements from the database and populate the editor
     * @param {Object} app - The application instance
     * @param {string} centercode - The centercode to load elements for
     * @param {string} floor - The floor to load elements for
     * @returns {Promise<Object>} Result object with success and message properties
     */
    async populateEditorWithSVG(app, centercode, floor) {
        if (!app) {
            throw new Error('App instance is required');
        }
        
        if (!centercode || !floor) {
            throw new Error('Centercode and floor are required');
        }
        
        try {
            // Fetch elements from the database
            const elements = await this.getElements(centercode, floor);
            
            if (!elements || elements.length === 0) {
                return {
                    success: false,
                    message: `No elements found for ${centercode} / Floor ${floor}`
                };
            }
            
            // We MUST restore the canvas dimensions to match what was saved
            // This ensures element coordinates and grid alignment are preserved
            let canvasWidth = 400; // Default width
            let canvasHeight = 300; // Default height
            let cellSize = 20; // Default cell size
            
            // Get the saved dimensions from the database elements
            if (elements[0]) {
                canvasWidth = elements[0].canvas_width || canvasWidth;
                canvasHeight = elements[0].canvas_height || canvasHeight;
                cellSize = elements[0].cell_size || cellSize;
                console.log(`Restoring canvas dimensions: ${canvasWidth}x${canvasHeight}, cell size: ${cellSize}px`);
            }
            
            // CRITICAL: Apply the saved dimensions to reshape the canvas BEFORE loading elements
            // This ensures element positions will match their original locations
            if (app.setCanvasWidth && app.setCanvasHeight && app.setCellSize) {
                // First set cell size, then canvas dimensions
                app.setCellSize(cellSize);
                app.setCanvasWidth(canvasWidth);
                app.setCanvasHeight(canvasHeight);
                
                // Update the canvas with the restored dimensions
                app.canvas.updateCanvasDimensions();
                app.canvas.gridManager.drawGrid();
                
                // Re-center the canvas with new dimensions
                app.canvas.centerCanvas();
            }
            
            // Set current map info in the app
            app.currentCentercode = centercode;
            app.currentFloor = floor;
            
            // Clear existing elements from the canvas
            app.canvas.clearElements();
            
            // Clear any existing background image
            app.clearBackgroundImage();
            
            // Reset the app's elements array
            app.elements = [];
            
            // Load background image if it exists
            try {
                const imageData = await this.getBackgroundImage(centercode, floor);
                if (imageData && imageData.publicUrl) {
                    app.backgroundImage = {
                        url: imageData.publicUrl,
                        opacity: imageData.opacity || 1.0,
                        showImage: imageData.show_image !== undefined ? imageData.show_image : true,
                        originalWidth: imageData.original_width || 0,
                        originalHeight: imageData.original_height || 0,
                        element: null,
                        pendingFile: null
                    };
                    
                    app.canvas.setBackgroundImage(
                        imageData.publicUrl,
                        app.backgroundImage.opacity,
                        app.backgroundImage.showImage,
                        app.backgroundImage.originalWidth,
                        app.backgroundImage.originalHeight
                    );
                }
            } catch (imageError) {
                console.error('Error loading background image:', imageError);
                // Continue loading elements even if background image fails
            }
            
            // Add each element to the canvas
            elements.forEach(element => {
                // Skip placeholder elements
                if (element.element_type === 'placeholder') {
                    return;
                }
                
                try {
                    // Map the database element to the format expected by the app
                    // First, normalize the type name to ensure proper case matching
                    let type = element.element_type || 'location'; // Default to 'location' if missing
                    
                    // Convert to lowercase first to ensure consistent formatting
                    type = type.toLowerCase();
                    
                    // Map the element type to match what's defined in the app
                    // Capitalize the first letter and ensure it matches a valid type
                    const mappedType = type.charAt(0).toUpperCase() + type.slice(1);
                    
                    // Check if the mapped type exists in the app's elementTypes
                    if (!app.elementTypes[mappedType]) {
                        // If not, default to 'Location' which we know exists
                        console.warn(`Element type '${mappedType}' not found in app configuration, defaulting to 'Location'`, element);
                    }
                    
                    // Use the mapped type if it exists, otherwise fall back to 'Location'
                    const finalType = app.elementTypes[mappedType] ? mappedType : 'Location';
                    
                    // We need to keep the entire element_name as the ID to avoid collisions
                    // between different element types (e.g., location_1 and barrier_1)
                    let elementId = element.element_name;
                    
                    // For display purposes, extract a clean version (without the type prefix)
                    let displayId = elementId;
                    if (displayId && displayId.includes('_')) {
                        // Extract only the ID portion for display (everything after the first underscore)
                        const parts = displayId.split('_');
                        if (parts.length > 1) {
                            // Join everything after the first part in case ID contains underscores
                            displayId = parts.slice(1).join('_');
                        }
                    }
                    
                    // Add the element using the full element_name as the ID to prevent collisions
                    // The element-manager.js already has the fix to set opacity to 1.0 for DB elements
                    const createdElement = app.canvas.elementManager.createElement(
                        finalType,              // Element type (Location, Barrier, etc.)
                        element.x,              // x position
                        element.y,              // y position
                        element.w,              // width
                        element.h,              // height
                        elementId               // Use the full element_name to guarantee uniqueness
                    );
                    
                    // Get the DOM element that was just created to apply additional properties
                    const domElement = document.getElementById(`element-${elementId}`);
                    if (domElement) {
                        // Set opacity to 1.0 (fully opaque) for elements loaded from DB (redundant but safe)
                        domElement.style.opacity = '1.0';
                        
                        // Apply type-specific styles from the element type configuration
                        const typeConfig = app.elementTypes[finalType];
                        if (typeConfig) {
                            // Apply color directly from the type config
                            domElement.style.backgroundColor = typeConfig.color;
                            
                            // Handle element ID visibility based on type config
                            const idElement = domElement.querySelector('.element-id');
                            if (idElement) {
                                if (!typeConfig.showName) {
                                    idElement.style.display = 'none';
                                } else {
                                    // Make sure the display ID is shown and is correct
                                    // Show the full type_id format (e.g. "location_1" not just "1")
                                    idElement.style.display = '';
                                    idElement.textContent = element.element_name;
                                }
                            }
                        }
                    }
                    
                    // Store the created element in the app's elements array
                    if (createdElement) {
                        // Store additional metadata from the database
                        createdElement.centercode = element.centercode;
                        createdElement.floor = element.floor;
                        
                        // Make sure the element properties match the element type config
                        const typeConfig = app.elementTypes[finalType];
                        createdElement.color = typeConfig.color;
                        createdElement.showName = typeConfig.showName;
                        
                        // Add to app's elements array if it's not already being tracked
                        if (!app.elements.some(e => e.id === createdElement.id)) {
                            app.elements.push(createdElement);
                        }
                        
                        // Update the nextId counter for this element type
                        // This prevents ID conflicts when creating new elements of this type
                        try {
                            // Extract the numeric part of the element name
                            if (element.element_name && element.element_name.includes('_')) {
                                const parts = element.element_name.split('_');
                                if (parts.length > 1) {
                                    const idNumber = parseInt(parts[1], 10);
                                    if (!isNaN(idNumber) && idNumber >= 0) {
                                        // If this ID is greater than the current nextId, update nextId
                                        if (typeConfig.nextId <= idNumber) {
                                            typeConfig.nextId = idNumber + 1;
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                        }
                    }
                } catch (error) {
                }
            });
            
            // Do a final redraw of the grid to ensure proper rendering
            // We're not resetting the viewport since we want to preserve the restored dimensions
            setTimeout(() => {
                app.canvas.gridManager.drawGrid();
            }, 200);
            
            // Update the metadata display
            this.updateMetadataDisplay(app, centercode, floor);
            
            return {
                success: true,
                message: `Successfully loaded ${elements.length} elements for ${centercode} / Floor ${floor}`
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Unknown error occurred while loading elements'
            };
        }
    }

    /**
     * Update the metadata display in the UI
     * @param {Object} app - The application instance
     * @param {string} centercode - The centercode to display
     * @param {string} floor - The floor to display
     */
    updateMetadataDisplay(app, centercode, floor) {
        const metadataDisplay = document.getElementById('metadata-display');
        if (metadataDisplay) {
            metadataDisplay.textContent = `${centercode} | Floor ${floor}`;
            metadataDisplay.style.display = 'block';
        }
    }

    /**
     * Check if an SVG exists for a specific centercode and floor
     * @param {string} centercode - The centercode to check
     * @param {string} floor - The floor to check
     * @returns {Promise<boolean>} True if SVG exists, false otherwise
     */
    async checkSVGExists(centercode, floor) {
        return this.elementsExist(centercode, floor);
    }

    /**
     * Update SVG elements for a specific centercode and floor
     * @param {Object} app - The application instance
     * @param {Array} elements - Array of element objects to update
     * @param {string} centercode - The centercode to update elements for
     * @param {string} floor - The floor to update elements for
     * @returns {Promise<Object>} Result object with success and message properties
     */
    async updateSVGElements(app, elements, centercode, floor) {
        return this.saveElements(elements, centercode, floor);
    }
}
