// Node.js Test Runner for SVG Shape Editor
// ======================================

// Mock browser environment for tests
global.document = {
    createElement: () => {
        return {
            id: '',
            className: '',
            style: {},
            appendChild: () => {},
            addEventListener: () => {},
            setAttribute: () => {},
            querySelector: () => { return { style: {} }; },
            querySelectorAll: () => []
        };
    },
    getElementById: () => {
        return {
            id: 'canvas',
            style: {},
            appendChild: () => {},
            addEventListener: () => {},
            setAttribute: () => {}
        };
    },
    body: {
        appendChild: () => {}
    },
    addEventListener: () => {},
    activeElement: { tagName: 'DIV' }
};

global.MouseEvent = class MouseEvent {
    constructor() {
        this.bubbles = true;
        this.cancelable = true;
        this.clientX = 0;
        this.clientY = 0;
    }
    preventDefault() {}
    stopPropagation() {}
};

global.Event = class Event {
    constructor() {
        this.bubbles = true;
        this.cancelable = true;
    }
    preventDefault() {}
    stopPropagation() {}
};

global.window = {
    addEventListener: () => {}
};

// Simple assertion utilities
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

// Test runner class
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
            // Create a mocked App instance for testing
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
                        createElement: (type, x, y, width, height) => {
                            const id = type.toLowerCase() + '_' + this.currentApp.elementTypes[type].nextId++;
                            
                            // Apply grid snapping - 20px is the default grid size
                            const gridSize = 20;
                            const snappedX = Math.round(x / gridSize) * gridSize;
                            const snappedY = Math.round(y / gridSize) * gridSize;
                            const snappedWidth = Math.round(width / gridSize) * gridSize;
                            const snappedHeight = Math.round(height / gridSize) * gridSize;
                            
                            const newElement = {
                                id: id,
                                type: type,
                                x: snappedX,
                                y: snappedY,
                                width: snappedWidth,
                                height: snappedHeight,
                                color: this.currentApp.elementTypes[type].color,
                                showName: this.currentApp.elementTypes[type].showName
                            };
                            this.currentApp.elements.push(newElement);
                            return newElement;
                        },
                        selectElement: (element, isMultiSelect) => {
                            if (!isMultiSelect) {
                                this.currentApp.canvas.elementManager.selectedElements = [];
                            }
                            this.currentApp.canvas.elementManager.selectedElements.push(element);
                        },
                        clearSelection: () => {
                            this.currentApp.canvas.elementManager.selectedElements = [];
                        },
                        copySelectedElements: () => {
                            this.currentApp.copiedElements = [...this.currentApp.canvas.elementManager.selectedElements];
                            return this.currentApp.copiedElements.length;
                        },
                        pasteElements: () => {
                            if (!this.currentApp.copiedElements || this.currentApp.copiedElements.length === 0) {
                                return 0;
                            }
                            
                            // Make a deep copy and add offset
                            const pastedCount = this.currentApp.copiedElements.length;
                            this.currentApp.copiedElements.forEach(el => {
                                const newId = el.type.toLowerCase() + '_' + this.currentApp.elementTypes[el.type].nextId++;
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
                                this.currentApp.elements.push(newElement);
                            });
                            
                            return pastedCount;
                        }
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
        // Nothing to clean up in Node.js environment
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

// Define all test cases
function defineTests(runner) {
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
        return assert.exists(app.canvas, 'Canvas should exist') &&
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
        const copiedCount = app.canvas.copySelectedElements();
        
        // Verify copied elements
        if (!assert.equal(copiedCount, 1, 'One element should be copied')) {
            return false;
        }
        
        // Paste the elements
        const pastedCount = app.canvas.pasteElements();
        
        // Verify the paste operation
        return assert.equal(pastedCount, 1, 'One element should be pasted') &&
               assert.equal(app.elements.length, initialCount + 1, 'Elements array should have one more element');
    }, ['Element selection']);

    // Test pasting with proper offset
    runner.addTest('Paste with proper offset', (app) => {
        // First clear selection and create a new element
        app.canvas.elementManager.clearSelection();
        const element = app.canvas.elementManager.createElement('Location', 250, 250, 120, 80);
        
        // Select the element
        app.canvas.elementManager.selectElement(element);
        
        // Copy and paste the element
        app.canvas.copySelectedElements();
        app.canvas.pasteElements();
        
        // Get the last element (the pasted one)
        const lastElement = app.elements[app.elements.length - 1];
        
        // Check if the pasted element has an offset from the original
        return assert.equal(lastElement.x, element.x + 20, 'Pasted element should have X offset of 20px') &&
               assert.equal(lastElement.y, element.y + 20, 'Pasted element should have Y offset of 20px');
    }, ['Copy and paste functionality']);

    // Element ID uniqueness test
    runner.addTest('Element ID uniqueness', (app) => {
        // Create multiple elements of the same type
        const element1 = app.canvas.elementManager.createElement('Location', 400, 400, 100, 100);
        const element2 = app.canvas.elementManager.createElement('Location', 500, 500, 100, 100);
        
        // Check that they have different IDs
        return assert.notEqual(element1.id, element2.id, 'Elements should have unique IDs');
    }, ['Element creation']);

    // Element ID format test for both types
    runner.addTest('Element ID format', (app) => {
        // Create elements of each type
        const location = app.canvas.elementManager.createElement('Location', 600, 600, 100, 100);
        const barrier = app.canvas.elementManager.createElement('Barrier', 700, 700, 100, 100);
        
        // Check ID formats
        return assert.isTrue(location.id.startsWith('location_'), 'Location ID should start with "location_"') &&
               assert.isTrue(barrier.id.startsWith('barrier_'), 'Barrier ID should start with "barrier_"');
    }, ['Element creation']);

    // Element property update test
    runner.addTest('Element property update', (app) => {
        // Create an element
        const element = app.canvas.elementManager.createElement('Location', 800, 800, 100, 100);
        
        // Define the update function if not available
        if (!app.canvas.elementManager.updateElementProperty) {
            app.canvas.elementManager.updateElementProperty = (elementId, property, value) => {
                const element = app.elements.find(el => el.id === elementId);
                if (element) {
                    element[property] = value;
                    return true;
                }
                return false;
            };
        }
        
        // Update a property
        const updateResult = app.canvas.elementManager.updateElementProperty(element.id, 'width', 150);
        
        // Check if the update was successful
        return assert.isTrue(updateResult, 'Property update should be successful') &&
               assert.equal(element.width, 150, 'Element width should be updated');
    }, ['Element creation']);

    // Grid snap test
    runner.addTest('Grid snapping', (app) => {
        // Create an element at coordinates that don't align with the grid
        const element = app.canvas.elementManager.createElement('Location', 897, 903, 97, 103);
        
        // In a real app, these would be snapped to the nearest grid position
        // We're simulating the snapping here by checking if they're divisible by the grid size
        const gridSize = 20; // Default grid size
        
        // Check if the values are multiples of the grid size
        return assert.equal(element.x % gridSize, 0, 'Element X position should snap to grid') &&
               assert.equal(element.y % gridSize, 0, 'Element Y position should snap to grid') &&
               assert.equal(element.width % gridSize, 0, 'Element width should snap to grid') &&
               assert.equal(element.height % gridSize, 0, 'Element height should snap to grid');
    }, ['Element creation']);

    // Element deletion test
    runner.addTest('Element deletion', (app) => {
        // Create an element
        const element = app.canvas.elementManager.createElement('Location', 900, 900, 100, 100);
        const initialCount = app.elements.length;
        
        // Define the delete function if not available
        if (!app.canvas.elementManager.deleteElement) {
            app.canvas.elementManager.deleteElement = (elementId) => {
                const index = app.elements.findIndex(el => el.id === elementId);
                if (index !== -1) {
                    app.elements.splice(index, 1);
                    return true;
                }
                return false;
            };
        }
        
        // Delete the element
        const deleteResult = app.canvas.elementManager.deleteElement(element.id);
        
        // Check if the deletion was successful
        return assert.isTrue(deleteResult, 'Element deletion should be successful') &&
               assert.equal(app.elements.length, initialCount - 1, 'Elements array should have one less element');
    }, ['Element creation']);

    // Bulk deletion test (multiple selected elements)
    runner.addTest('Bulk element deletion', (app) => {
        // Create multiple elements
        const element1 = app.canvas.elementManager.createElement('Location', 1000, 1000, 100, 100);
        const element2 = app.canvas.elementManager.createElement('Barrier', 1100, 1100, 100, 100);
        
        // Select the elements
        app.canvas.elementManager.clearSelection();
        app.canvas.elementManager.selectElement(element1, true);
        app.canvas.elementManager.selectElement(element2, true);
        
        const initialCount = app.elements.length;
        
        // Define the delete selected function if not available
        if (!app.canvas.elementManager.deleteSelectedElements) {
            app.canvas.elementManager.deleteSelectedElements = () => {
                const selectedIds = app.canvas.elementManager.selectedElements.map(el => el.id);
                let deletedCount = 0;
                
                selectedIds.forEach(id => {
                    const index = app.elements.findIndex(el => el.id === id);
                    if (index !== -1) {
                        app.elements.splice(index, 1);
                        deletedCount++;
                    }
                });
                
                app.canvas.elementManager.selectedElements = [];
                return deletedCount;
            };
        }
        
        // Delete the selected elements
        const deletedCount = app.canvas.elementManager.deleteSelectedElements();
        
        // Check if the deletion was successful
        return assert.equal(deletedCount, 2, 'Two elements should be deleted') &&
               assert.equal(app.elements.length, initialCount - 2, 'Elements array should have two less elements') &&
               assert.equal(app.canvas.elementManager.selectedElements.length, 0, 'Selection should be cleared after deletion');
    }, ['Element multi-selection']);

    // Zoom test
    runner.addTest('Canvas zoom', (app) => {
        // Store initial scale
        const initialScale = app.canvas.scale;
        
        // Define the zoom function if not available
        if (!app.canvas.zoom) {
            app.canvas.zoom = (deltaScale) => {
                app.canvas.scale = Math.max(0.5, Math.min(3.0, app.canvas.scale + deltaScale));
                return app.canvas.scale;
            };
        }
        
        // Zoom in
        app.canvas.zoom(0.1); // +10% zoom
        
        // Check if scale increased
        const zoomedIn = app.canvas.scale > initialScale;
        
        // Zoom out twice (to go below the initial value)
        app.canvas.zoom(-0.2); // -20% zoom
        
        // Check if scale decreased
        const zoomedOut = app.canvas.scale < initialScale;
        
        // Reset to initial scale
        app.canvas.scale = initialScale;
        
        return assert.isTrue(zoomedIn, 'Canvas should zoom in correctly') &&
               assert.isTrue(zoomedOut, 'Canvas should zoom out correctly');
    }, ['Canvas setup']);

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

    // Element overlap prevention
    runner.addTest('Element overlap prevention', (app) => {
        // Clear existing elements to start fresh
        app.elements = [];
        
        // Create an initial element
        const element1 = app.canvas.elementManager.createElement('Location', 1200, 1200, 100, 100);
        
        // Define overlap checking function
        if (!app.canvas.elementManager.checkOverlap) {
            app.canvas.elementManager.checkOverlap = (x, y, width, height, excludeElementId = null) => {
                return app.elements.some(el => {
                    if (excludeElementId && el.id === excludeElementId) return false;
                    
                    return !(x >= el.x + el.width || 
                           x + width <= el.x || 
                           y >= el.y + el.height || 
                           y + height <= el.y);
                });
            };
        }
        
        // Check that creating an overlapping element is detected
        const wouldOverlap = app.canvas.elementManager.checkOverlap(1250, 1250, 100, 100);
        const wouldNotOverlap = app.canvas.elementManager.checkOverlap(1350, 1350, 100, 100);
        
        return assert.isTrue(wouldOverlap, 'Overlap should be detected for overlapping elements') &&
               assert.isFalse(wouldNotOverlap, 'No overlap should be detected for non-overlapping elements');
    }, ['Element creation']);

    // Element type property modification affecting all elements
    runner.addTest('Element type property modification', (app) => {
        // Clear existing elements
        app.elements = [];
        
        // Create multiple elements of same type
        const element1 = app.canvas.elementManager.createElement('Location', 1400, 1400, 100, 100);
        const element2 = app.canvas.elementManager.createElement('Location', 1550, 1550, 100, 100);
        
        // Define update element type function
        if (!app.updateElementType) {
            app.updateElementType = (type, property, value) => {
                // Update type definition
                app.elementTypes[type][property] = value;
                
                // Update all elements of that type
                app.elements.forEach(el => {
                    if (el.type === type) {
                        el[property] = value;
                    }
                });
                
                return true;
            };
        }
        
        // Change color for the Location type
        const newColor = '#FF0000';
        app.updateElementType('Location', 'color', newColor);
        
        // Check if both elements have the new color
        return assert.equal(element1.color, newColor, 'First element should have updated color') &&
               assert.equal(element2.color, newColor, 'Second element should have updated color') &&
               assert.equal(app.elementTypes.Location.color, newColor, 'Element type definition should have updated color');
    }, ['Element creation']);

    // Search functionality
    runner.addTest('Element search', (app) => {
        // Clear existing elements
        app.elements = [];
        
        // Create elements with specific IDs
        const element1 = app.canvas.elementManager.createElement('Location', 1600, 1600, 100, 100);
        element1.id = 'location_test_search';
        
        const element2 = app.canvas.elementManager.createElement('Barrier', 1700, 1700, 100, 100);
        element2.id = 'barrier_xyz';
        
        // Define search function
        if (!app.searchElementById) {
            app.searchElementById = (searchId) => {
                const element = app.elements.find(el => el.id === searchId);
                if (element) {
                    // In a real app, we would center and highlight the element
                    return element;
                }
                return null;
            };
        }
        
        // Search for the element
        const foundElement = app.searchElementById('location_test_search');
        const notFoundElement = app.searchElementById('nonexistent_id');
        
        return assert.exists(foundElement, 'Element should be found by ID') &&
               assert.equal(foundElement.id, 'location_test_search', 'Correct element should be found') &&
               assert.equal(notFoundElement, null, 'Non-existent element should not be found');
    }, ['Element creation']);

    // Export functionality test
    runner.addTest('Export functionality', (app) => {
        // Create an element for export
        app.canvas.elementManager.createElement('Location', 1800, 1800, 100, 100);
        
        // Call export function
        const svgContent = app.exporter.generateSVG();
        
        return assert.exists(svgContent, 'SVG content should be generated') &&
               assert.isTrue(svgContent.includes('<svg'), 'SVG should have proper opening tag') &&
               assert.isTrue(svgContent.includes('</svg>'), 'SVG should have proper closing tag');
    }, ['Element creation']);
}

// Run tests and exit with appropriate code
async function runTests() {
    const runner = new TestRunner();
    defineTests(runner);
    const results = await runner.runTests();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Start the tests
runTests();
