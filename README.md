# SVG Shape Editor

A visual editor for creating and editing floor plans with rectangular elements that can be stored in a Supabase database and exported to SVG format. The application is hosted at [https://elbuenmitch.github.io/new-digi-map/](https://elbuenmitch.github.io/new-digi-map/).

## Features

- **Canvas Area**: Large drawing space with grid snapping
- **Element Types**: Currently supports Locations (orange) and Barriers (gray)
- **Navigation Menu**: Tools for element creation, canvas navigation, and settings
- **Grid Snapping**: Elements automatically snap to grid for organization
- **Element Properties**: Edit element IDs and view properties through popup menus
- **Search Functionality**: Find and highlight elements by ID
- **SVG Export**: Export canvas elements to standard SVG format for downstream use
- **Responsive UI**: Zoom and pan controls for navigating large projects
- **Multi-selection**: Select multiple elements by holding Shift while clicking
- **Copy/Paste**: Copy selected elements with Cmd+C/Ctrl+C and paste with Cmd+V/Ctrl+V
- **Drag and Drop**: Move elements around the canvas by selecting and dragging
- **Keyboard Shortcuts**: Quick access to tools: 'V' for Select tool, 'H' for Hand tool, 'B' for Barrier tool, 'L' for Location tool
- **Multi-Element Drag and Drop**: Select multiple elements and drag them as a group
- **Overlap Prevention**: Elements cannot overlap, with automatic notifications when conflicts occur
- **Mouse Wheel Zoom**: Zoom in/out using the mouse wheel directly on the canvas
- **Database Integration**: Save and load floor plans from Supabase database
- **Metadata Display**: Shows centercode and floor information when a map is loaded
- **Background Image Support**: Upload background images for tracing or reference, with adjustable opacity and visibility controls
- **Element Type Management**: Edit properties of element types affecting all instances

## Main Usage

1. **Add Elements**: Select the element type (Location or Barrier) from the left menu and click-drag on the canvas to create.
2. **Edit Elements**: Click any element to view/edit its properties, drag and drop to re-position, press delete button to erase, hold shift to select multiple (and delete all selected), press cmd+c to copy selection, press cmd+v to paste selection.
3. **Multi-Element Manipulation**:
   - Hold Shift and click on elements to select multiple at once
   - Click and drag any selected element to move the entire group together
   - The system will prevent repositioning if it would cause elements to overlap
   - You'll receive a notification if an overlap would occur when releasing the mouse
4. **Working with Background Images**:
   - Upload a background image through the Settings panel
   - Adjust opacity using the slider to make it more or less prominent
   - Toggle visibility on/off as needed during your workflow
   - Background images are automatically saved with your floor plan
   - Each floor plan can have its own unique background image
5. **Navigate Canvas**: Use the Pan tool (press 'H' key) to move around the canvas, the Select tool (press 'V' key) to select elements, and the zoom controls to zoom in/out.
5. **Find Elements**: Use the search box to locate elements by ID.
6. **Configure Settings**: Click Settings to change grid size, upload background image, and change element type properties.
7. **Export**: Click "Export SVG" to download the canvas elements as an SVG file.
8. **Database Operations**:
   - Click "Save to DB" to store the current canvas state in the Supabase database
   - Click "Load from DB" to retrieve a previously saved floor plan
   - Specify centercode and floor when saving or loading

## Element Types
### Properties
- Type: User can create new types.
- ID: a unique name given by the system when the user first creates it. This should also be editable from the popup menu that's available when clicking on an element. Element IDs are unique, so upon submission of an ID through the element popup, non-duplicity is validated and enforced.
- Position and dimensions (x,y,h,w): this information is decided by the user as they click-drag to add elements in the canvas.
- Color: this can be selected from the settings menu, under the "elemet type" section, using a color picker.
- Show_name_flag: true if ID should be displayed or not within the body of the element.
- Element popup: When clicking an existing element, a small popup comes out next to it displaying position, dimensions, ID and type. The user can modify the ID of the element from this popup menu by pressing the enter key on their keyboard.

### Default Element Types
- Locations: 
    - color: #FFC580
    - show_name_flag: true
- Barriers: 
    - color: #444444
    - show_name_flag: false
### Post creation type modifications
- Once instances of a type are created, changes to the element type properties are reflected in all instances created.

## Canvas
- Regardless of the element type that the user is adding, an element is created from the point of mouse press and the point of mouse release.
- The type of element to be placed depends on the element type that is selected in the navigation menu (ie, Location, Barrier, others).
- The user can start placing an element in any coordinate in the canvas, but upon creating the element in the canvas, the system should snap the element to a grid, to keep elements tidy, organized an prevent overlap.
- Element Overlap: Elements do not overlap in the canvas. If the user drags/creates/resizes an alement to a position where it would overlap with another element, the system stops the action and notify the user.
- Panning: Drag and drop with the mouse wheel pressed is supported to pan the canvas. The user can also click and hold a point in the canvas with the "pan" tool selected to pan through the canvas.
- Zoom: Mouse wheel movement zooms in/out in 10% steps. +/- buttons in settings menu also zoom in/out in 10% steps.
- Copy/Paste: Selecting one or more elements allows the option to copy those elements. Pasting them can be done by pressing cmd-v (or ctr-v in PC), pasting happens in a place of the canvas where there's no existing elements so overlap can be prevented.

## Navigation Menu
- From this menu the user can select the type of element to add to the canvas. Initially it will hold only the "Location" (shortcut: 'L' key) and "Barrier" (shortcut: 'B' key) options, but if a new option is added, it should be added to this menu.
- Zoom: zoom level and plus/minus buttons to zoom in/out in 10% steps.
- Select: tool for selecting elements in the canvas. Can be quickly activated by pressing the 'V' key.
- Pan (Hand): the mouse changes to a mode in which the user clicks and holds a point in the canvas to pan through it. Can be quickly activated by pressing the 'H' key.
- Settings: clicking this button opens a modal with the settings menu.
- Search field: this is a text input field where the user can type an element ID, and when pressing enter, the canvas pans to display that element in the center of the screen, and highlight it in a different color. Highlight is removed once the user clicks somewhere else.
- SVG output button: this button exports an SVG file that captures the locations, dimensions, IDs of all elements in the canvas.

### Settings Menu
### Canvas Properties
1. Background Image: User can upload a background image that will be displayed in the canvas in the lowest layer. If the canvas already has elements on it, image upload is not supported.
2. Grid dimension: 
2.1 Auto Input: Grid dimension is automatically calculated based on the background image dimensions.
2.2 Manual Input: Editable in number of squares times number of squares only if there's no background image. Changing the dimensions maintains snap to grid for all existing elements. If the new dimensions are smaller than the current elements, canvas resize should be prevented and the user is notified indicating the reason.

### Element Type Properties
- Editor for element types properties. Applying changes here affects all existing elements of that type.



## Technical Notes
- All elements snap to grid for organization
- Element IDs are unique and can be customized
- Elements cannot overlap, ensuring clear visual separation
- Multi-selection enables bulk operations (copy, delete) for efficiency
- Copy/paste functionality preserves all element properties
- The application is optimized to handle thousands of elements
- Canvas supports panning and zooming for large projects
- Visual feedback is provided for actions (selection, copy, search results)
- Element properties are stored in both memory and the database
- Canvas state is persisted using Supabase database integration
- Metadata display in top-left corner shows centercode and floor information
- The app is deployed on GitHub Pages from the gh-pages branch

## Usage

The application is accessible online at [https://elbuenmitch.github.io/new-digi-map/](https://elbuenmitch.github.io/new-digi-map/).

For local development, open `index.html` in your web browser.
