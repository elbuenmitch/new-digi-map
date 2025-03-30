#!/bin/bash

# Create a temp directory for deployment files
mkdir -p deploy_temp

# Copy essential files
cp index.html deploy_temp/
cp styles.css deploy_temp/
cp -r js/ deploy_temp/
mkdir -p deploy_temp/exports
cp -r exports/ deploy_temp/

# Navigate to Supabase web console for uploading
echo "==================================================="
echo "Your files are prepared for deployment in the deploy_temp directory."
echo "Next steps:"
echo "1. Log in to your Supabase project at https://supabase.com/dashboard/project/nxribktnysqkqwfyapzy"
echo "2. Navigate to Storage in the sidebar"
echo "3. Create a new bucket named 'svg-editor' if it doesn't exist"
echo "4. Make the bucket public by clicking on the bucket settings"
echo "5. Upload all files from the deploy_temp directory, maintaining the folder structure"
echo "6. Enable website hosting in the bucket settings"
echo "7. Set index.html as your entry point"
echo "==================================================="
echo "After uploading, your site will be available at:"
echo "https://nxribktnysqkqwfyapzy.supabase.co/storage/v1/object/public/svg-editor/index.html"
echo "==================================================="
