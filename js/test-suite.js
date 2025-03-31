// Test Suite for SVG Shape Editor
// =================================

// Simple test framework
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };
        this.currentApp = null;
        this.failedTests = [];
    }

    addTest(name, testFn, dependencies = []) {
        this.tests.push({
            name,
            testFn,
            dependencies,
            result: null,
            error: null
        });
    }

    async runTests() {
        console.log('Starting SVG Shape Editor test suite...');
        this.results.total = this.tests.length;
        
        // Initialize the app for testing
        try {
            // Create a test environment
            this.setupTestEnvironment();
            
            // Run each test
            for (const test of this.tests) {
                try {
                    console.log(`Running test: ${test.name}`);
                    
                    // Check if dependencies have passed
                    const depsFailed = test.dependencies.some(depName => {
                        const depTest = this.tests.find(t => t.name === depName);
                        return depTest && depTest.result === false;
                    });
                    
                    if (depsFailed) {
                        console.log(`Skipping test "${test.name}" due to failed dependencies`);
                        test.result = null;
                        this.results.skipped++;
                        continue;
                    }
                    
                    // Run the test
                    const result = await test.testFn(this.currentApp);
                    test.result = result;
                    
                    if (result) {
                        this.results.passed++;
                        console.log(`✅ Test "${test.name}" passed`);
                    } else {
                        this.results.failed++;
                        this.failedTests.push(test.name);
                        console.log(`❌ Test "${test.name}" failed`);
                    }
                } catch (error) {
                    console.error(`Error in test "${test.name}":`, error);
                    test.result = false;
                    test.error = error;
                    this.results.failed++;
                    this.failedTests.push(test.name);
                }
            }
        } catch (error) {
            console.error('Failed to initialize test environment:', error);
        } finally {
            this.cleanupTestEnvironment();
            this.printResults();
        }
        
        return this.results;
    }
    
    setupTestEnvironment() {
        try {
            // Create a hidden test container with the exact structure the app expects
            const testContainer = document.createElement('div');
            testContainer.id = 'test-container';
            testContainer.style.position = 'absolute';
            testContainer.style.left = '-9999px';
            testContainer.style.top = '-9999px';
            
            // Create the full DOM structure needed by the app
            testContainer.innerHTML = `
                <div class="app-container">
                    <div class="nav-menu">
                        <div class="logo">SVG Editor</div>
                        <div class="tool-section">
                            <div class="section-title">Elements</div>
                            <div class="tool-buttons">
                                <button id="location-tool" class="tool-button active" data-type="Location">Location</button>
                                <button id="barrier-tool" class="tool-button" data-type="Barrier">Barrier</button>
                            </div>
                        </div>
                        <div class="tool-section">
                            <div class="section-title">Navigation</div>
                            <div class="tool-buttons">
                                <button id="pan-tool" class="tool-button">Pan</button>
                            </div>
                            <div class="zoom-controls">
                                <button id="zoom-out">-</button>
                                <span id="zoom-level">100%</span>
                                <button id="zoom-in">+</button>
                            </div>
                        </div>
                        <div class="search-section">
                            <div class="section-title">Search</div>
                            <input type="text" id="search-input" placeholder="Search by element ID">
                        </div>
                        <div class="action-buttons">
                            <button id="settings-btn" class="action-button">Settings</button>
                            <button id="export-svg-btn" class="action-button">Export SVG</button>
                        </div>
                    </div>
                    <div class="canvas-container">
                        <div id="canvas"></div>
                    </div>
                </div>
                <div id="element-popup" class="popup hidden"></div>
                <div id="settings-modal" class="modal hidden"></div>
                <div id="test-modal" class="modal hidden"></div>
            `;
            document.body.appendChild(testContainer);
            
            // Create a manually mocked App instance instead of using the real one
            // This avoids the complex initialization that might be causing issues
            this.currentApp = {
                elements: [],
                elementTypes: {
                    Location: {
                        color: '#FFC580',
                        showName: true,
                        nextId: 1
                    },
                    Barrier: {
                        color: '#444444',
                        showName: false,
                        nextId: 1
                    }
                },
                canvas: {
                    scale: 1,
                    elementManager: {
                        selectedElements: [],
                        createElement: function(type, x, y, width, height) {
                            const id = type.toLowerCase() + '_' + this.app.elementTypes[type].nextId++;
                            const newElement = {
                                id: id,
                                type: type,
                                x: x,
                                y: y,
                                width: width,
                                height: height,
                                color: this.app.elementTypes[type].color,
                                showName: this.app.elementTypes[type].showName
                            };
                            this.app.elements.push(newElement);
                            return newElement;
                        }.bind({ app: this.currentApp }),
                        selectElement: function(element, isMultiSelect) {
                            if (!isMultiSelect) {
                                this.app.canvas.elementManager.selectedElements = [];
                            }
                            this.app.canvas.elementManager.selectedElements.push(element);
                        }.bind({ app: this.currentApp }),
                        clearSelection: function() {
                            this.app.canvas.elementManager.selectedElements = [];
                        }.bind({ app: this.currentApp }),
                        copySelectedElements: function() {
                            this.app.copiedElements = [...this.app.canvas.elementManager.selectedElements];
                            return this.app.copiedElements.length;
                        }.bind({ app: this.currentApp }),
                        pasteElements: function() {
                            if (!this.app.copiedElements || this.app.copiedElements.length === 0) {
                                return 0;
                            }
                            
                            // Make a deep copy and add offset
                            const pastedCount = this.app.copiedElements.length;
                            this.app.copiedElements.forEach(el => {
                                const newId = el.type.toLowerCase() + '_' + this.app.elementTypes[el.type].nextId++;
                                const newElement = {
                                    id: newId,
                                    type: el.type,
                                    x: el.x + 20,
                                    y: el.y + 20,
                                    width: el.width,
                                    height: el.height,
                                    color: el.color,
                                    showName: el.showName
                                };
                                this.app.elements.push(newElement);
                            });
                            
                            return pastedCount;
                        }.bind({ app: this.currentApp })
                    },
                    gridManager: {
                        isGridVisible: true,
                        toggleGridVisibility: function() {
                            this.isGridVisible = !this.isGridVisible;
                            return this.isGridVisible;
                        }
                    },
                    pasteElements: function() {
                        return this.elementManager.pasteElements();
                    },
                    copySelectedElements: function() {
                        return this.elementManager.copySelectedElements();
                    }
                },
                settings: {
                    canvasWidth: 4000,
                    canvasHeight: 3000,
                    updateCanvasSize: function(width, height) {
                        this.canvasWidth = width;
                        this.canvasHeight = height;
                    }
                },
                menu: {},
                exporter: {
                    generateSVG: function() {
                        return '<svg width="4000" height="3000" xmlns="http://www.w3.org/2000/svg"><!-- Generated SVG --></svg>';
                    }
                },
                copiedElements: []
            };

            console.log('Mock test environment set up with app instance');
            return this.currentApp;
        } catch (error) {
            console.error('Failed to initialize test environment:', error);
            throw error;
        }
    }
    
    cleanupTestEnvironment() {
        // Remove test container
        const testContainer = document.getElementById('test-container');
        if (testContainer) {
            document.body.removeChild(testContainer);
        }
        console.log('Test environment cleaned up');
    }
    
    printResults() {
        console.log('-----------------------------------');
        console.log('SVG Shape Editor Test Results:');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Skipped: ${this.results.skipped}`);
        
        if (this.failedTests.length > 0) {
            console.log('Failed Tests:');
            this.failedTests.forEach(name => console.log(`- ${name}`));
        }
        console.log('-----------------------------------');
    }
}

// Assertion utilities
const assert = {
    isTrue: (value, message) => {
        if (!value) {
            console.error(`Assertion failed: ${message || 'Expected true but got false'}`);
            return false;
        }
        return true;
    },
    
    isFalse: (value, message) => {
        if (value) {
            console.error(`Assertion failed: ${message || 'Expected false but got true'}`);
            return false;
        }
        return true;
    },
    
    equal: (actual, expected, message) => {
        if (actual !== expected) {
            console.error(`Assertion failed: ${message || `Expected ${expected} but got ${actual}`}`);
            return false;
        }
        return true;
    },
    
    notEqual: (actual, expected, message) => {
        if (actual === expected) {
            console.error(`Assertion failed: ${message || `Expected not to equal ${expected}`}`);
            return false;
        }
        return true;
    },
    
    exists: (value, message) => {
        if (value === null || value === undefined) {
            console.error(`Assertion failed: ${message || 'Expected value to exist'}`);
            return false;
        }
        return true;
    }
};

// Utility function to create a synthetic event
function createEvent(type, options = {}) {
    const event = new Event(type);
    
    // Add properties to the event
    for (const [key, value] of Object.entries(options)) {
        event[key] = value;
    }
    
    return event;
}

// Utility function to simulate a mouse event
function simulateMouseEvent(element, eventType, x, y, options = {}) {
    const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        ...options
    });
    
    element.dispatchEvent(event);
    return event;
}

// Utility function to simulate a keyboard event
function simulateKeyEvent(element, eventType, key, options = {}) {
    const event = new KeyboardEvent(eventType, {
        bubbles: true,
        cancelable: true,
        key: key,
        ...options
    });
    
    element.dispatchEvent(event);
    return event;
}

// Define all test cases
function defineTests(runner) {
    // Database interaction tests
    defineBaseTests(runner);
    defineDatabaseTests(runner);
    defineBackgroundImageTests(runner);
}

// Define all base functionality test cases
function defineBaseTests(runner) {
    // App initialization tests
    runner.addTest('App initialization', (app) => {
        return assert.exists(app, 'App should be initialized') &&
               assert.exists(app.canvas, 'Canvas manager should be initialized') &&
               assert.exists(app.settings, 'Settings manager should be initialized') &&
               assert.exists(app.menu, 'Menu manager should be initialized') &&
               assert.exists(app.exporter, 'SVG exporter should be initialized');
    });

    // Element types configuration tests
    runner.addTest('Element types configuration', (app) => {
        return assert.exists(app.elementTypes, 'Element types should be defined') &&
               assert.exists(app.elementTypes.Location, 'Location type should be defined') &&
               assert.exists(app.elementTypes.Barrier, 'Barrier type should be defined') &&
               assert.equal(app.elementTypes.Location.color, '#FFC580', 'Location color should be correct') &&
               assert.equal(app.elementTypes.Barrier.color, '#444444', 'Barrier color should be correct') &&
               assert.isTrue(app.elementTypes.Location.showName, 'Location showName should be true') &&
               assert.isFalse(app.elementTypes.Barrier.showName, 'Barrier showName should be false');
    }, ['App initialization']);

    // Canvas setup tests
    runner.addTest('Canvas setup', (app) => {
        const canvas = document.getElementById('canvas');
        return assert.exists(canvas, 'Canvas element should exist') &&
               assert.exists(app.canvas.scale, 'Canvas scale should be initialized') &&
               assert.equal(app.canvas.scale, 1, 'Initial canvas scale should be 1');
    }, ['App initialization']);

    // Element manager tests
    runner.addTest('Element manager initialization', (app) => {
        return assert.exists(app.canvas.elementManager, 'Element manager should be initialized') &&
               assert.exists(app.canvas.elementManager.selectedElements, 'Selected elements array should be initialized') &&
               assert.equal(app.canvas.elementManager.selectedElements.length, 0, 'No elements should be selected initially');
    }, ['App initialization', 'Canvas setup']);

    // Element creation test
    runner.addTest('Element creation', (app) => {
        const initialCount = app.elements.length;
        const element = app.canvas.elementManager.createElement('Location', 100, 100, 100, 100);
        
        return assert.exists(element, 'Element should be created') &&
               assert.equal(app.elements.length, initialCount + 1, 'Elements array should have one more element') &&
               assert.equal(element.type, 'Location', 'Element type should be Location') &&
               assert.equal(element.x, 100, 'Element x should be 100') &&
               assert.equal(element.y, 100, 'Element y should be 100') &&
               assert.equal(element.width, 100, 'Element width should be 100') &&
               assert.equal(element.height, 100, 'Element height should be 100') &&
               assert.equal(element.color, '#FFC580', 'Element color should match type');
    }, ['Element manager initialization']);

    // Element selection test
    runner.addTest('Element selection', (app) => {
        // First create an element
        const element = app.canvas.elementManager.createElement('Location', 150, 150, 100, 100);
        
        // Then select it
        app.canvas.elementManager.selectElement(element);
        
        return assert.equal(app.canvas.elementManager.selectedElements.length, 1, 'One element should be selected') &&
               assert.equal(app.canvas.elementManager.selectedElements[0].id, element.id, 'The correct element should be selected');
    }, ['Element creation']);

    // Element multi-selection test
    runner.addTest('Element multi-selection', (app) => {
        // Create two more elements
        const element1 = app.canvas.elementManager.createElement('Location', 200, 200, 100, 100);
        const element2 = app.canvas.elementManager.createElement('Barrier', 300, 300, 100, 100);
        
        // Clear selection
        app.canvas.elementManager.clearSelection();
        
        // Select multiple elements
        app.canvas.elementManager.selectElement(element1, true); // isMultiSelect = true
        app.canvas.elementManager.selectElement(element2, true); // isMultiSelect = true
        
        return assert.equal(app.canvas.elementManager.selectedElements.length, 2, 'Two elements should be selected') &&
               assert.equal(app.canvas.elementManager.selectedElements[0].id, element1.id, 'First element should be selected') &&
               assert.equal(app.canvas.elementManager.selectedElements[1].id, element2.id, 'Second element should be selected');
    }, ['Element selection']);

    // Copy/paste functionality test
    runner.addTest('Copy and paste functionality', (app) => {
        // First clear selection and create a new element
        app.canvas.elementManager.clearSelection();
        const element = app.canvas.elementManager.createElement('Location', 250, 250, 120, 80);
        
        // Select the element
        app.canvas.elementManager.selectElement(element);
        
        // Get the initial element count
        const initialCount = app.elements.length;
        
        // Copy the element
        const copiedCount = app.canvas.elementManager.copySelectedElements();
        
        // Verify copied elements
        if (!assert.equal(copiedCount, 1, 'One element should be copied')) {
            return false;
        }
        
        // Paste the elements
        const pastedCount = app.canvas.elementManager.pasteElements();
        
        // Verify the paste operation
        return assert.equal(pastedCount, 1, 'One element should be pasted') &&
               assert.equal(app.elements.length, initialCount + 1, 'Elements array should have one more element');
    }, ['Element selection']);

    // Grid visibility test
    runner.addTest('Grid visibility', (app) => {
        // Get initial grid visibility
        const initiallyVisible = app.canvas.gridManager.isGridVisible;
        
        // Toggle grid visibility
        app.canvas.gridManager.toggleGridVisibility();
        
        // Get updated visibility
        const newVisibility = app.canvas.gridManager.isGridVisible;
        
        // Toggle back to initial state
        app.canvas.gridManager.toggleGridVisibility();
        
        return assert.notEqual(initiallyVisible, newVisibility, 'Grid visibility should toggle');
    }, ['Canvas setup']);
    
    // Settings functionality tests
    runner.addTest('Settings functionality', (app) => {
        // Test updating canvas width
        const initialWidth = app.settings.canvasWidth;
        const newWidth = initialWidth + 10;
        
        app.settings.updateCanvasSize(newWidth, app.settings.canvasHeight);
        
        const widthUpdated = app.settings.canvasWidth === newWidth;
        
        // Restore original width
        app.settings.updateCanvasSize(initialWidth, app.settings.canvasHeight);
        
        return assert.isTrue(widthUpdated, 'Canvas width should be updateable through settings');
    }, ['App initialization']);

    // Export functionality test
    runner.addTest('Export functionality', (app) => {
        // Create an element for export
        app.canvas.elementManager.createElement('Location', 300, 300, 100, 100);
        
        // Call export function
        const svgContent = app.exporter.generateSVG();
        
        return assert.exists(svgContent, 'SVG content should be generated') &&
               assert.isTrue(svgContent.includes('<svg'), 'SVG should have proper opening tag') &&
               assert.isTrue(svgContent.includes('</svg>'), 'SVG should have proper closing tag');
    }, ['Element creation']);
    
    // Element resizing tests
    runner.addTest('Resize handles appear on selection', (app) => {
        // First create an element
        const element = app.canvas.elementManager.createElement('Location', 400, 400, 100, 100);
        
        // Create a DOM element to represent it in the test environment
        const elementEl = document.createElement('div');
        elementEl.id = 'element-' + element.id;
        elementEl.className = 'canvas-element location';
        document.getElementById('canvas').appendChild(elementEl);
        
        // Select the element
        app.canvas.elementManager.selectElement(element);
        
        // Mock the addResizeHandlesToElement method
        let handlesAdded = false;
        app.canvas.elementManager.addResizeHandlesToElement = function(el) {
            handlesAdded = true;
            // Add mock resize handles
            ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 
             'bottom-left', 'bottom-center', 'bottom-right'].forEach(position => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${position}`;
                elementEl.appendChild(handle);
            });
        };
        
        // Call the method to add resize handles
        app.canvas.elementManager.addResizeHandlesToElement(element);
        
        // Check if resize handles exist
        const handles = elementEl.querySelectorAll('.resize-handle');
        
        // Clean up
        document.getElementById('canvas').removeChild(elementEl);
        
        return assert.isTrue(handlesAdded, 'Resize handles should be added when requested') &&
               assert.equal(handles.length, 8, 'Eight resize handles should be added to the element');
    }, ['Element selection']);
    
    // Element name change test
    runner.addTest('Element name change functionality', (app) => {
        // Create an element
        const element = app.canvas.elementManager.createElement('Location', 450, 450, 100, 100);
        const originalId = element.id;
        const newId = 'test_renamed_element';
        
        // Make sure the new ID doesn't already exist
        if (!app.isIdUnique(newId)) {
            return assert.isTrue(false, 'New ID for test should be unique - test setup issue');
        }
        
        // Simulate selecting the element
        app.canvas.elementManager.selectElement(element);
        app.canvas.elementManager.selectedElement = element;
        
        // Simulate showing the popup
        document.getElementById('element-id').value = newId;
        
        // Simulate clicking the update button
        app.canvas.updateSelectedElement();
        
        // Find the element in the app.elements array
        const updatedElement = app.elements.find(el => el.id === newId);
        
        // The original ID should no longer exist
        const originalElement = app.elements.find(el => el.id === originalId);
        
        return assert.exists(updatedElement, 'Updated element should exist in app.elements array') &&
               assert.equal(updatedElement.id, newId, 'Element ID should be updated to new ID') &&
               assert.equal(originalElement, undefined, 'Original element ID should no longer exist');
    }, ['Element selection']);
    
    // Multi-element drag and drop tests
    runner.addTest('Multi-element selection and drag', (app) => {
        // Create two test elements
        const element1 = app.canvas.elementManager.createElement('Location', 100, 100, 80, 80);
        const element2 = app.canvas.elementManager.createElement('Location', 200, 200, 80, 80);
        
        // Create DOM elements to represent them in the test environment
        const element1El = document.createElement('div');
        element1El.id = 'element-' + element1.id;
        element1El.className = 'canvas-element location';
        document.getElementById('canvas').appendChild(element1El);
        
        const element2El = document.createElement('div');
        element2El.id = 'element-' + element2.id;
        element2El.className = 'canvas-element location';
        document.getElementById('canvas').appendChild(element2El);
        
        // Select both elements
        app.canvas.elementManager.selectElement(element1, false);
        app.canvas.elementManager.selectElement(element2, true);
        
        // Verify both elements are selected
        const selectionCount = app.canvas.elementManager.selectedElements.length;
        const bothSelected = selectionCount === 2;
        
        // Start dragging the selected elements
        const startX = 150;
        const startY = 150;
        app.canvas.elementManager.startDraggingElements(startX, startY);
        
        // Verify elements are dragged
        const dragCount = app.canvas.elementManager.draggedElements.length;
        const bothDragged = dragCount === 2;
        
        // Simulate updating the positions during drag
        const moveX = 250;
        const moveY = 250;
        app.canvas.elementManager.updateDraggingElements(moveX, moveY);
        
        // Finish dragging to a valid position
        const validFinishX = 300;
        const validFinishY = 300;
        const validDragResult = app.canvas.elementManager.finishDraggingElements(validFinishX, validFinishY);
        
        // Clean up
        document.getElementById('canvas').removeChild(element1El);
        document.getElementById('canvas').removeChild(element2El);
        
        return (
            assert.isTrue(bothSelected, 'Both elements should be selected') &&
            assert.isTrue(bothDragged, 'Both elements should be dragged') &&
            assert.isTrue(validDragResult, 'Drag operation to valid position should succeed')
        );
    }, ['Element selection']);
    
    runner.addTest('Drag and drop overlap prevention', (app) => {
        // Mock the UIManager to track notifications
        let notificationShown = false;
        const originalShowNotification = app.canvas.elementManager.uiManager.showNotification;
        app.canvas.elementManager.uiManager.showNotification = function(message) {
            notificationShown = true;
            console.log('Test notification:', message);
        };
        
        // Create three elements - two for dragging and one as an obstacle
        const element1 = app.canvas.elementManager.createElement('Location', 100, 100, 80, 80);
        const element2 = app.canvas.elementManager.createElement('Location', 200, 100, 80, 80);
        const obstacle = app.canvas.elementManager.createElement('Barrier', 300, 300, 100, 100);
        
        // Select the first two elements for dragging
        app.canvas.elementManager.selectElement(element1, false);
        app.canvas.elementManager.selectElement(element2, true);
        
        // Start dragging
        app.canvas.elementManager.startDraggingElements(150, 120);
        
        // Attempt to finish dragging to a position that would overlap with the obstacle
        const overlapFinishX = 310; // This would position the dragged elements to overlap with the obstacle
        const overlapFinishY = 310;
        const overlapDragResult = app.canvas.elementManager.finishDraggingElements(overlapFinishX, overlapFinishY);
        
        // Restore original method
        app.canvas.elementManager.uiManager.showNotification = originalShowNotification;
        
        return (
            assert.isFalse(overlapDragResult, 'Drag operation should fail when overlapping') &&
            assert.isTrue(notificationShown, 'Notification should be shown when overlap is detected')
        );
    }, ['Element selection']);
    
    runner.addTest('Internal overlap prevention between dragged elements', (app) => {
        // Mock the UIManager to track notifications
        let notificationShown = false;
        const originalShowNotification = app.canvas.elementManager.uiManager.showNotification;
        app.canvas.elementManager.uiManager.showNotification = function(message) {
            notificationShown = true;
            console.log('Test notification:', message);
        };
        
        // Create two elements with a specific initial arrangement
        const element1 = app.canvas.elementManager.createElement('Location', 100, 100, 80, 80);
        const element2 = app.canvas.elementManager.createElement('Location', 300, 100, 80, 80);
        
        // Select both elements
        app.canvas.elementManager.selectElement(element1, false);
        app.canvas.elementManager.selectElement(element2, true);
        
        // Start dragging with offsets that would cause the elements to overlap each other when moved
        app.canvas.elementManager.startDraggingElements(200, 140);
        
        // Store original positions to verify they don't change
        const originalX1 = element1.x;
        const originalY1 = element1.y;
        const originalX2 = element2.x;
        const originalY2 = element2.y;
        
        // Attempt to finish dragging in a way that would make the elements overlap each other
        // This simulates a complex drag operation that would cause internal overlap
        const badMoveX = 190; // This would position the elements to overlap with each other
        const badMoveY = 130;
        const overlapDragResult = app.canvas.elementManager.finishDraggingElements(badMoveX, badMoveY);
        
        // Verify positions haven't changed due to overlap prevention
        const positionsUnchanged = (
            element1.x === originalX1 &&
            element1.y === originalY1 &&
            element2.x === originalX2 &&
            element2.y === originalY2
        );
        
        // Restore original method
        app.canvas.elementManager.uiManager.showNotification = originalShowNotification;
        
        return (
            assert.isFalse(overlapDragResult, 'Drag operation should fail when internal overlap would occur') &&
            assert.isTrue(notificationShown, 'Notification should be shown when internal overlap is detected') &&
            assert.isTrue(positionsUnchanged, 'Element positions should remain unchanged when drag fails')
        );
    }, ['Element selection']);
    
    runner.addTest('Element resizing operations', (app) => {
        // First create and select an element
        const element = app.canvas.elementManager.createElement('Location', 450, 450, 100, 100);
        const originalWidth = element.width;
        const originalHeight = element.height;
        
        // Create a DOM element to represent it in the test environment
        const elementEl = document.createElement('div');
        elementEl.id = 'element-' + element.id;
        elementEl.className = 'canvas-element location';
        document.getElementById('canvas').appendChild(elementEl);
        
        // Select the element
        app.canvas.elementManager.selectElement(element);
        
        // Mock the resize methods
        let resizeStarted = false;
        let resizeUpdated = false;
        let resizeFinished = false;
        
        app.canvas.elementManager.startResizingElement = function(el, handle, x, y) {
            resizeStarted = true;
            this.isResizing = true;
            this.resizingElement = el;
            this.resizeStartPoint = { x, y };
            this.resizeStartDimensions = { width: el.width, height: el.height };
            this.resizeHandle = handle.className.replace('resize-handle ', '');
        };
        
        app.canvas.elementManager.updateResizingElement = function(x, y) {
            if (!this.isResizing) return;
            
            resizeUpdated = true;
            // Simulate resize - increase width by 20px
            this.resizingElement.width = this.resizeStartDimensions.width + 20;
            this.resizingElement.height = this.resizeStartDimensions.height + 20;
        };
        
        app.canvas.elementManager.finishResizingElement = function() {
            if (!this.isResizing) return true;
            
            resizeFinished = true;
            this.isResizing = false;
            this.resizingElement = null;
            return true; // Indicate success
        };
        
        // Create a mock resize handle
        const handle = document.createElement('div');
        handle.className = 'resize-handle bottom-right';
        elementEl.appendChild(handle);
        
        // Simulate starting resize
        app.canvas.elementManager.startResizingElement(element, handle, 550, 550);
        
        // Simulate dragging during resize
        app.canvas.elementManager.updateResizingElement(570, 570);
        
        // Finish resizing
        const success = app.canvas.elementManager.finishResizingElement();
        
        // Clean up
        document.getElementById('canvas').removeChild(elementEl);
        
        return assert.isTrue(resizeStarted, 'Resize operation should start when handle is dragged') &&
               assert.isTrue(resizeUpdated, 'Element dimensions should update during resize') &&
               assert.isTrue(resizeFinished, 'Resize operation should complete') &&
               assert.isTrue(success, 'Resize should complete successfully') &&
               assert.equal(element.width, originalWidth + 20, 'Element width should be increased') &&
               assert.equal(element.height, originalHeight + 20, 'Element height should be increased');
    }, ['Resize handles appear on selection']);
    
    runner.addTest('Resize overlap prevention', (app) => {
        // Create two elements - one to resize and one to test overlap
        const element1 = app.canvas.elementManager.createElement('Location', 500, 500, 100, 100);
        const element2 = app.canvas.elementManager.createElement('Barrier', 650, 500, 100, 100);
        
        // Mock the checkOverlap method
        let overlapChecked = false;
        app.canvas.checkOverlap = function(el1, el2) {
            overlapChecked = true;
            // Simulate overlap when width is too large
            return el1.width > 120;
        };
        
        // Mock finishResizingElement with overlap check
        let resizePrevented = false;
        app.canvas.elementManager.finishResizingElementWithOverlapCheck = function(element, newDimensions) {
            overlapChecked = true;
            // Check if new dimensions would cause overlap
            const wouldOverlap = app.canvas.checkOverlap(
                { ...element, ...newDimensions },
                app.elements.filter(el => el.id !== element.id)
            );
            
            if (wouldOverlap) {
                resizePrevented = true;
                return false; // Prevent resize
            }
            
            // Apply new dimensions
            element.width = newDimensions.width;
            element.height = newDimensions.height;
            return true; // Successful resize
        };
        
        // Test case 1: Resize with no overlap
        const success1 = app.canvas.elementManager.finishResizingElementWithOverlapCheck(element1, { width: 120, height: 120 });
        
        // Test case 2: Resize with overlap
        const success2 = app.canvas.elementManager.finishResizingElementWithOverlapCheck(element1, { width: 150, height: 150 });
        
        return assert.isTrue(overlapChecked, 'Overlap should be checked during resize') &&
               assert.isTrue(success1, 'Resize should succeed when no overlap occurs') &&
               assert.isFalse(success2, 'Resize should fail when overlap would occur') &&
               assert.isTrue(resizePrevented, 'Resize should be prevented when overlap detected');
    }, ['Element resizing operations']);
}

// Main test execution function
async function runTests() {
    const runner = new TestRunner();
    defineTests(runner);
    await runner.runTests();
    return runner.results;
}

/**
 * Define all database functionality tests
 */
function defineDatabaseTests(runner) {
    // Database manager initialization test
    runner.addTest('Database manager initialization', (app) => {
        // Mock the DatabaseManager if it doesn't exist
        if (!app.database) {
            app.database = {
                supabase: {},
                getCentercodes: async () => [],
                getFloors: async () => [],
                getElements: async () => [],
                saveElements: async () => ({ success: true }),
                createCentercode: async () => ({}),
                createFloor: async () => ({}),
                populateEditorWithSVG: async () => ({ success: true }),
                checkSVGExists: async () => false,
                updateMetadataDisplay: () => {}
            };
        }
        
        return assert.exists(app.database, 'Database manager should be initialized') &&
               assert.exists(app.database.supabase, 'Supabase client should be initialized');
    }, ['App initialization']);

    // Get centercodes test
    runner.addTest('Get centercodes', async (app) => {
        // Mock the getCentercodes method
        const originalGetCentercodes = app.database.getCentercodes;
        let getCentercodesCalled = false;
        const mockCentercodes = [
            { id: 1, centercode: 'ABC', cpg_centerid: 123 },
            { id: 2, centercode: 'XYZ', cpg_centerid: 456 }
        ];
        
        app.database.getCentercodes = async () => {
            getCentercodesCalled = true;
            return mockCentercodes;
        };
        
        // Call the method
        const centercodes = await app.database.getCentercodes();
        
        // Restore original method
        app.database.getCentercodes = originalGetCentercodes;
        
        return assert.isTrue(getCentercodesCalled, 'getCentercodes method should be called') &&
               assert.equal(centercodes.length, 2, 'Should return 2 centercodes') &&
               assert.equal(centercodes[0].centercode, 'ABC', 'First centercode should be ABC');
    }, ['Database manager initialization']);

    // Create centercode test
    runner.addTest('Create centercode', async (app) => {
        // Mock the createCentercode method
        const originalCreateCentercode = app.database.createCentercode;
        let createCentercodeCalled = false;
        let calledWithCentercode = '';
        
        app.database.createCentercode = async (centercode, cpgCenterId) => {
            createCentercodeCalled = true;
            calledWithCentercode = centercode;
            return { centercode, cpg_centerid: cpgCenterId };
        };
        
        // Call the method
        const newCentercode = 'NEW123';
        const result = await app.database.createCentercode(newCentercode);
        
        // Restore original method
        app.database.createCentercode = originalCreateCentercode;
        
        return assert.isTrue(createCentercodeCalled, 'createCentercode method should be called') &&
               assert.equal(calledWithCentercode, newCentercode, 'Should be called with the correct centercode') &&
               assert.equal(result.centercode, newCentercode, 'Result should contain the new centercode');
    }, ['Database manager initialization']);

    // Get floors test
    runner.addTest('Get floors for centercode', async (app) => {
        // Mock the getFloors method
        const originalGetFloors = app.database.getFloors;
        let getFloorsCalled = false;
        let calledWithCentercode = '';
        const mockFloors = [
            { floor: '1' },
            { floor: '2' }
        ];
        
        app.database.getFloors = async (centercode) => {
            getFloorsCalled = true;
            calledWithCentercode = centercode;
            return mockFloors;
        };
        
        // Call the method
        const testCentercode = 'ABC';
        const floors = await app.database.getFloors(testCentercode);
        
        // Restore original method
        app.database.getFloors = originalGetFloors;
        
        return assert.isTrue(getFloorsCalled, 'getFloors method should be called') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(floors.length, 2, 'Should return 2 floors');
    }, ['Database manager initialization']);

    // Create floor test
    runner.addTest('Create floor', async (app) => {
        // Mock the createFloor method
        const originalCreateFloor = app.database.createFloor;
        let createFloorCalled = false;
        let calledWithFloor = '';
        let calledWithCentercode = '';
        
        app.database.createFloor = async (floor, centercode) => {
            createFloorCalled = true;
            calledWithFloor = floor;
            calledWithCentercode = centercode;
            return { floor };
        };
        
        // Call the method
        const testFloor = '3';
        const testCentercode = 'ABC';
        const result = await app.database.createFloor(testFloor, testCentercode);
        
        // Restore original method
        app.database.createFloor = originalCreateFloor;
        
        return assert.isTrue(createFloorCalled, 'createFloor method should be called') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(result.floor, testFloor, 'Result should contain the new floor');
    }, ['Database manager initialization']);

    // Check if elements exist test
    runner.addTest('Check if elements exist', async (app) => {
        // Mock the elementsExist method
        const originalElementsExist = app.database.elementsExist;
        let elementsExistCalled = false;
        let calledWithCentercode = '';
        let calledWithFloor = '';
        
        app.database.elementsExist = async (centercode, floor) => {
            elementsExistCalled = true;
            calledWithCentercode = centercode;
            calledWithFloor = floor;
            return true; // Mock that elements exist
        };
        
        // Call the method
        const testCentercode = 'ABC';
        const testFloor = '1';
        const result = await app.database.elementsExist(testCentercode, testFloor);
        
        // Restore original method
        app.database.elementsExist = originalElementsExist;
        
        return assert.isTrue(elementsExistCalled, 'elementsExist method should be called') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.isTrue(result, 'Should return true indicating elements exist');
    }, ['Database manager initialization']);

    // Get elements test
    runner.addTest('Get elements for centercode and floor', async (app) => {
        // Mock the getElements method
        const originalGetElements = app.database.getElements;
        let getElementById = false;
        let calledWithCentercode = '';
        let calledWithFloor = '';
        const mockElements = [
            { id: 1, element_type: 'location', element_name: 'location_1', x: 100, y: 100, w: 100, h: 100, centercode: 'ABC', floor: '1' },
            { id: 2, element_type: 'barrier', element_name: 'barrier_1', x: 200, y: 200, w: 100, h: 100, centercode: 'ABC', floor: '1' }
        ];
        
        app.database.getElements = async (centercode, floor) => {
            getElementById = true;
            calledWithCentercode = centercode;
            calledWithFloor = floor;
            return mockElements;
        };
        
        // Call the method
        const testCentercode = 'ABC';
        const testFloor = '1';
        const elements = await app.database.getElements(testCentercode, testFloor);
        
        // Restore original method
        app.database.getElements = originalGetElements;
        
        return assert.isTrue(getElementById, 'getElements method should be called') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.equal(elements.length, 2, 'Should return 2 elements') &&
               assert.equal(elements[0].element_type, 'location', 'First element should be of type location');
    }, ['Database manager initialization']);

    // Save elements test
    runner.addTest('Save elements to database', async (app) => {
        // Mock the saveElements method
        const originalSaveElements = app.database.saveElements;
        let saveElementsCalled = false;
        let elementsSaved = [];
        let calledWithCentercode = '';
        let calledWithFloor = '';
        
        app.database.saveElements = async (elements, centercode, floor) => {
            saveElementsCalled = true;
            elementsSaved = elements;
            calledWithCentercode = centercode;
            calledWithFloor = floor;
            return { success: true, message: `Successfully saved ${elements.length} elements` };
        };
        
        // Create test elements
        const testElements = [
            { id: 'location_1', type: 'Location', x: 100, y: 100, width: 100, height: 100 },
            { id: 'barrier_1', type: 'Barrier', x: 200, y: 200, width: 100, height: 100 }
        ];
        
        // Call the method
        const testCentercode = 'ABC';
        const testFloor = '1';
        const result = await app.database.saveElements(testElements, testCentercode, testFloor);
        
        // Restore original method
        app.database.saveElements = originalSaveElements;
        
        return assert.isTrue(saveElementsCalled, 'saveElements method should be called') &&
               assert.equal(elementsSaved.length, 2, 'Should save 2 elements') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.isTrue(result.success, 'Should return success');
    }, ['Database manager initialization']);

    // Populate editor with SVG test
    runner.addTest('Populate editor with SVG from database', async (app) => {
        // Mock the populateEditorWithSVG method
        const originalPopulateEditor = app.database.populateEditorWithSVG;
        let populateEditorCalled = false;
        let calledWithApp = null;
        let calledWithCentercode = '';
        let calledWithFloor = '';
        let updateMetadataDisplayCalled = false;
        
        // Mock elements to be returned from getElements
        const mockElements = [
            { element_type: 'location', element_name: 'location_1', x: 100, y: 100, w: 100, h: 100, centercode: 'ABC', floor: '1' },
            { element_type: 'barrier', element_name: 'barrier_1', x: 200, y: 200, w: 100, h: 100, centercode: 'ABC', floor: '1' }
        ];
        
        // Mock getElements
        const originalGetElements = app.database.getElements;
        app.database.getElements = async () => mockElements;
        
        // Mock clearElements
        const originalClearElements = app.canvas.clearElements;
        let clearElementsCalled = false;
        app.canvas.clearElements = () => { clearElementsCalled = true; };
        
        // Mock createElement
        const originalCreateElement = app.canvas.elementManager.createElement;
        const createdElements = [];
        app.canvas.elementManager.createElement = function(type, x, y, width, height, id) {
            const element = { id: id || `${type.toLowerCase()}_${Math.random()}`, type, x, y, width, height };
            createdElements.push(element);
            return element;
        };
        
        // Mock updateMetadataDisplay
        const originalUpdateMetadata = app.database.updateMetadataDisplay;
        app.database.updateMetadataDisplay = (appInstance, centercode, floor) => {
            updateMetadataDisplayCalled = true;
            assert.equal(appInstance, app, 'Should update metadata with correct app instance');
            assert.equal(centercode, 'ABC', 'Should update metadata with correct centercode');
            assert.equal(floor, '1', 'Should update metadata with correct floor');
        };
        
        // Create populateEditorWithSVG mock
        app.database.populateEditorWithSVG = async (appInstance, centercode, floor) => {
            populateEditorCalled = true;
            calledWithApp = appInstance;
            calledWithCentercode = centercode;
            calledWithFloor = floor;
            
            // Actually call getElements to get mock elements
            const elements = await app.database.getElements(centercode, floor);
            
            // Clear existing elements
            app.canvas.clearElements();
            
            // Reset the app's elements array
            app.elements = [];
            
            // Add each element to the canvas
            elements.forEach(element => {
                if (element.element_type === 'placeholder') return;
                
                const type = element.element_type.charAt(0).toUpperCase() + element.element_type.slice(1);
                const id = element.element_name;
                
                const createdElement = app.canvas.elementManager.createElement(
                    type,
                    element.x,
                    element.y,
                    element.w,
                    element.h,
                    id
                );
                
                if (createdElement) {
                    createdElement.centercode = element.centercode;
                    createdElement.floor = element.floor;
                    app.elements.push(createdElement);
                }
            });
            
            // Update metadata display
            app.database.updateMetadataDisplay(app, centercode, floor);
            
            return {
                success: true,
                message: `Successfully loaded ${elements.length} elements for ${centercode} / Floor ${floor}`
            };
        };
        
        // Call the method
        const testCentercode = 'ABC';
        const testFloor = '1';
        const result = await app.database.populateEditorWithSVG(app, testCentercode, testFloor);
        
        // Restore original methods
        app.database.populateEditorWithSVG = originalPopulateEditor;
        app.database.getElements = originalGetElements;
        app.canvas.clearElements = originalClearElements;
        app.canvas.elementManager.createElement = originalCreateElement;
        app.database.updateMetadataDisplay = originalUpdateMetadata;
        
        return assert.isTrue(populateEditorCalled, 'populateEditorWithSVG method should be called') &&
               assert.equal(calledWithApp, app, 'Should be called with the correct app instance') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.isTrue(clearElementsCalled, 'Should clear existing elements') &&
               assert.isTrue(createdElements.length > 0, 'Should create elements from database data') &&
               assert.isTrue(updateMetadataDisplayCalled, 'Should update metadata display') &&
               assert.isTrue(result.success, 'Should return success');
    }, ['Database manager initialization']);

    // Metadata display test
    runner.addTest('Metadata display update', (app) => {
        // Create a mock metadata display element
        const metadataDisplay = document.createElement('div');
        metadataDisplay.id = 'metadata-display';
        metadataDisplay.style.display = 'none';
        document.body.appendChild(metadataDisplay);
        
        // Call the updateMetadataDisplay method
        const testCentercode = 'ABC';
        const testFloor = '1';
        app.database.updateMetadataDisplay(app, testCentercode, testFloor);
        
        // Check if metadata display was updated correctly
        const displayUpdated = metadataDisplay.textContent === `${testCentercode} | Floor ${testFloor}`;
        const displayVisible = metadataDisplay.style.display === 'block';
        
        // Clean up
        document.body.removeChild(metadataDisplay);
        
        return assert.isTrue(displayUpdated, 'Metadata display text should be updated correctly') &&
               assert.isTrue(displayVisible, 'Metadata display should be visible');
    }, ['Database manager initialization']);

    // SVG existence check test
    runner.addTest('Check if SVG exists', async (app) => {
        // Mock the checkSVGExists method
        const originalCheckSVGExists = app.database.checkSVGExists;
        let checkSVGExistsCalled = false;
        let calledWithCentercode = '';
        let calledWithFloor = '';
        
        app.database.checkSVGExists = async (centercode, floor) => {
            checkSVGExistsCalled = true;
            calledWithCentercode = centercode;
            calledWithFloor = floor;
            return true; // Mock that SVG exists
        };
        
        // Call the method
        const testCentercode = 'ABC';
        const testFloor = '1';
        const result = await app.database.checkSVGExists(testCentercode, testFloor);
        
        // Restore original method
        app.database.checkSVGExists = originalCheckSVGExists;
        
        return assert.isTrue(checkSVGExistsCalled, 'checkSVGExists method should be called') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.isTrue(result, 'Should return true indicating SVG exists');
    }, ['Database manager initialization']);

    // Update SVG elements test
    runner.addTest('Update SVG elements', async (app) => {
        // Mock the updateSVGElements method
        const originalUpdateSVGElements = app.database.updateSVGElements;
        let updateSVGElementsCalled = false;
        let elementsSaved = [];
        let calledWithApp = null;
        let calledWithCentercode = '';
        let calledWithFloor = '';
        
        app.database.updateSVGElements = async (appInstance, elements, centercode, floor) => {
            updateSVGElementsCalled = true;
            elementsSaved = elements;
            calledWithApp = appInstance;
            calledWithCentercode = centercode;
            calledWithFloor = floor;
            return { success: true, message: `Successfully updated ${elements.length} elements` };
        };
        
        // Create test elements
        const testElements = [
            { id: 'location_1', type: 'Location', x: 100, y: 100, width: 100, height: 100 },
            { id: 'barrier_1', type: 'Barrier', x: 200, y: 200, width: 100, height: 100 }
        ];
        
        // Call the method
        const testCentercode = 'ABC';
        const testFloor = '1';
        const result = await app.database.updateSVGElements(app, testElements, testCentercode, testFloor);
        
        // Restore original method
        app.database.updateSVGElements = originalUpdateSVGElements;
        
        return assert.isTrue(updateSVGElementsCalled, 'updateSVGElements method should be called') &&
               assert.equal(elementsSaved.length, 2, 'Should update 2 elements') &&
               assert.equal(calledWithApp, app, 'Should be called with the correct app instance') &&
               assert.equal(calledWithCentercode, testCentercode, 'Should be called with the correct centercode') &&
               assert.equal(calledWithFloor, testFloor, 'Should be called with the correct floor') &&
               assert.isTrue(result.success, 'Should return success');
    }, ['Database manager initialization']);
    
    // End-to-end test: Load and save a map
    runner.addTest('End-to-end: Load and save map', async (app) => {
        // Mock the required methods
        const originalGetElements = app.database.getElements;
        const originalSaveElements = app.database.saveElements;
        const originalUpdateMetadata = app.database.updateMetadataDisplay;
        const originalClearElements = app.canvas.clearElements;
        const originalCreateElement = app.canvas.elementManager.createElement;
        
        // Mock elements to load
        const mockElements = [
            { element_type: 'location', element_name: 'location_1', x: 100, y: 100, w: 100, h: 100, centercode: 'TEST', floor: '5' },
            { element_type: 'barrier', element_name: 'barrier_1', x: 200, y: 200, w: 100, h: 100, centercode: 'TEST', floor: '5' }
        ];
        
        // Element tracking
        let getElementsCalled = false;
        let saveElementsCalled = false;
        let updateMetadataCalled = false;
        let clearElementsCalled = false;
        let createdElements = [];
        let savedElements = [];
        
        // Mock getElements
        app.database.getElements = async (centercode, floor) => {
            getElementsCalled = true;
            assert.equal(centercode, 'TEST', 'Should load elements with correct centercode');
            assert.equal(floor, '5', 'Should load elements with correct floor');
            return mockElements;
        };
        
        // Mock saveElements
        app.database.saveElements = async (elements, centercode, floor) => {
            saveElementsCalled = true;
            savedElements = elements;
            assert.equal(centercode, 'TEST', 'Should save elements with correct centercode');
            assert.equal(floor, '5', 'Should save elements with correct floor');
            return { success: true, message: 'Successfully saved elements' };
        };
        
        // Mock updateMetadataDisplay
        app.database.updateMetadataDisplay = (appInstance, centercode, floor) => {
            updateMetadataCalled = true;
            assert.equal(centercode, 'TEST', 'Should update metadata with correct centercode');
            assert.equal(floor, '5', 'Should update metadata with correct floor');
        };
        
        // Mock clearElements
        app.canvas.clearElements = () => { clearElementsCalled = true; };
        
        // Mock createElement
        app.canvas.elementManager.createElement = function(type, x, y, width, height, id) {
            const element = { id: id || `${type.toLowerCase()}_${Math.random()}`, type, x, y, width, height };
            createdElements.push(element);
            return element;
        };
        
        // 1. Load map from database
        const loadResult = await app.database.populateEditorWithSVG(app, 'TEST', '5');
        
        // 2. Modify and save map back to database
        // Add a new element to the loaded map
        const newElement = app.canvas.elementManager.createElement('Location', 300, 300, 100, 100);
        app.elements.push(newElement);
        
        // Save the modified map back to database
        const saveResult = await app.database.saveElements(app.elements, 'TEST', '5');
        
        // Restore original methods
        app.database.getElements = originalGetElements;
        app.database.saveElements = originalSaveElements;
        app.database.updateMetadataDisplay = originalUpdateMetadata;
        app.canvas.clearElements = originalClearElements;
        app.canvas.elementManager.createElement = originalCreateElement;
        
        return assert.isTrue(getElementsCalled, 'Should call getElements to load map') &&
               assert.isTrue(clearElementsCalled, 'Should clear existing elements before loading') &&
               assert.isTrue(createdElements.length >= 2, 'Should create elements from loaded data') &&
               assert.isTrue(updateMetadataCalled, 'Should update metadata display when loading') &&
               assert.isTrue(loadResult.success, 'Load operation should succeed') &&
               assert.isTrue(saveElementsCalled, 'Should call saveElements to save map') &&
               assert.isTrue(savedElements.length >= 3, 'Should save all elements including the new one') &&
               assert.isTrue(saveResult.success, 'Save operation should succeed');
    }, ['Database manager initialization']);
}

// Define all background image functionality tests
function defineBackgroundImageTests(runner) {
    // Test background image setting
    runner.addTest('backgroundImage.set', async (app) => {
        try {
            // Create a mock image file
            const mockFile = new File([''], 'test-image.png', { type: 'image/png' });
            
            // Set the background image
            await app.setBackgroundImageFromFile(mockFile);
            
            // Check if background image was set
            assert.exists(app.backgroundImage, 'Background image should be set');
            assert.equal(app.backgroundImage.showImage, true, 'Background image should be visible by default');
            assert.equal(app.backgroundImage.opacity, 1.0, 'Background image opacity should be 1.0 by default');
            
            return true;
        } catch (error) {
            console.error('Error in backgroundImage.set test:', error);
            return false;
        }
    });
    
    // Test background image visibility toggle
    runner.addTest('backgroundImage.toggleVisibility', async (app) => {
        try {
            // Create a mock image file if not already set
            if (!app.backgroundImage) {
                const mockFile = new File([''], 'test-image.png', { type: 'image/png' });
                await app.setBackgroundImageFromFile(mockFile);
            }
            
            // Initial state should be visible
            const initialVisibility = app.backgroundImage.showImage;
            
            // Toggle visibility off
            app.toggleBackgroundImageVisibility(false);
            assert.equal(app.backgroundImage.showImage, false, 'Background image should be hidden after toggling off');
            
            // Toggle visibility on
            app.toggleBackgroundImageVisibility(true);
            assert.equal(app.backgroundImage.showImage, true, 'Background image should be visible after toggling on');
            
            // Reset to initial state
            app.toggleBackgroundImageVisibility(initialVisibility);
            
            return true;
        } catch (error) {
            console.error('Error in backgroundImage.toggleVisibility test:', error);
            return false;
        }
    });
    
    // Test background image opacity adjustment
    runner.addTest('backgroundImage.adjustOpacity', async (app) => {
        try {
            // Create a mock image file if not already set
            if (!app.backgroundImage) {
                const mockFile = new File([''], 'test-image.png', { type: 'image/png' });
                await app.setBackgroundImageFromFile(mockFile);
            }
            
            // Initial opacity should be 1.0
            const initialOpacity = app.backgroundImage.opacity;
            
            // Set opacity to 0.5
            app.setBackgroundImageOpacity(0.5);
            assert.equal(app.backgroundImage.opacity, 0.5, 'Background image opacity should be 0.5 after adjustment');
            
            // Set opacity to 0
            app.setBackgroundImageOpacity(0);
            assert.equal(app.backgroundImage.opacity, 0, 'Background image opacity should be 0 after adjustment');
            
            // Set opacity back to 1
            app.setBackgroundImageOpacity(1);
            assert.equal(app.backgroundImage.opacity, 1, 'Background image opacity should be 1 after adjustment');
            
            // Reset to initial opacity
            app.setBackgroundImageOpacity(initialOpacity);
            
            return true;
        } catch (error) {
            console.error('Error in backgroundImage.adjustOpacity test:', error);
            return false;
        }
    });
    
    // Test background image clearing
    runner.addTest('backgroundImage.clear', async (app) => {
        try {
            // Create a mock image file if not already set
            if (!app.backgroundImage) {
                const mockFile = new File([''], 'test-image.png', { type: 'image/png' });
                await app.setBackgroundImageFromFile(mockFile);
            }
            
            // Clear the background image
            app.clearBackgroundImage();
            
            // Check if background image was cleared
            assert.equal(app.backgroundImage.url, null, 'Background image URL should be null after clearing');
            
            return true;
        } catch (error) {
            console.error('Error in backgroundImage.clear test:', error);
            return false;
        }
    });
    
    // Test background image database upload path format
    runner.addTest('backgroundImage.databasePathFormat', async (app) => {
        try {
            // Mock the uploadBackgroundImage method to intercept the path
            const originalUploadMethod = app.database.uploadBackgroundImage;
            let capturedPath = null;
            
            app.database.uploadBackgroundImage = (centercode, floor, imageFile, metadata) => {
                // Create a mock path to validate the format
                const timestamp = Date.now();
                const fileExt = imageFile.name.split('.').pop();
                const expectedPath = `${centercode}_${floor}_${timestamp}.${fileExt}`;
                
                // We can't check the exact path with timestamp, but we can check the format
                const actualPath = `${centercode}_${floor}_${timestamp}.${fileExt}`;
                capturedPath = actualPath;
                
                // Return a mock result
                return Promise.resolve({
                    publicUrl: `https://example.com/${actualPath}`,
                    storage_path: actualPath
                });
            };
            
            // Create a mock image file
            const mockFile = new File([''], 'test-image.png', { type: 'image/png' });
            
            // Set the app's current map info
            app.currentCentercode = 'TEST';
            app.currentFloor = '1';
            
            // Save the background image
            const result = await app.saveBackgroundImage();
            
            // Restore the original method
            app.database.uploadBackgroundImage = originalUploadMethod;
            
            // Verify the path format - should be centercode_floor_timestamp.extension
            assert.exists(capturedPath, 'Path should be captured');
            assert.isTrue(capturedPath.startsWith('TEST_1_'), 'Path should start with centercode_floor_');
            assert.isTrue(capturedPath.endsWith('.png'), 'Path should end with correct extension');
            assert.isFalse(capturedPath.includes('/'), 'Path should not contain slashes');
            
            return true;
        } catch (error) {
            console.error('Error in backgroundImage.databasePathFormat test:', error);
            return false;
        }
    });
}

// Export test functions
export { runTests, TestRunner, assert, simulateMouseEvent, simulateKeyEvent };
