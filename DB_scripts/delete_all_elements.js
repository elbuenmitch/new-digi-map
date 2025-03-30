// Script to delete all records in the elements table
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase client with the same credentials as the main app
const supabase = createClient(
    'https://nxribktnysqkqwfyapzy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmlia3RueXNxa3F3ZnlhcHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyOTExNzksImV4cCI6MjA1ODg2NzE3OX0.8zRGdwGuw2LVqfilgWD2so1MVAEo_iKUqQlf9it1wLY'
);

/**
 * Delete all records from the elements table
 * @returns {Promise<Object>} Result object with success, count, and message properties
 */
async function deleteAllElements() {
    try {
        console.log('Starting deletion of all elements...');
        
        // First, get a count of all elements to confirm how many will be deleted
        const { count, error: countError } = await supabase
            .from('elements')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.error('Error counting elements:', countError);
            return {
                success: false,
                message: `Error counting elements: ${countError.message}`
            };
        }
        
        console.log(`Found ${count} elements to delete.`);
        
        // Delete all elements
        const { error: deleteError } = await supabase
            .from('elements')
            .delete()
            .neq('id', 0); // This condition will match all records since id is never 0
        
        if (deleteError) {
            console.error('Error deleting elements:', deleteError);
            return {
                success: false,
                message: `Error deleting elements: ${deleteError.message}`
            };
        }
        
        console.log(`Successfully deleted all ${count} elements.`);
        return {
            success: true,
            count: count,
            message: `Successfully deleted all ${count} elements from the database.`
        };
    } catch (error) {
        console.error('Unexpected error deleting elements:', error);
        return {
            success: false,
            message: error.message || 'Unknown error occurred while deleting elements'
        };
    }
}

// Execute the function
deleteAllElements().then(result => {
    console.log(result);
    if (result.success) {
        console.log('✅ Operation completed successfully');
    } else {
        console.log('❌ Operation failed');
    }
}).catch(error => {
    console.error('Fatal error:', error);
});
