// Keyboard Shortcuts Test Suite for SVG Shape Editor
import { TestRunner, assert, simulateKeyEvent } from './test-suite.js';

// Define tests for keyboard shortcuts functionality
export function defineKeyboardShortcutsTests(runner) {
    // Test 'h' shortcut for Hand tool
    runner.addTest('Keyboard Shortcut - H key activates Hand tool', async (app) => {
        // Create a mock app if we don't have a full one
        if (!app.setActiveToolButton) {
            app.setActiveToolButton = function(toolId) {
                this.activeToolId = toolId;
            };
            app.activeToolId = null;
        }
        
        // Create mock canvas if needed
        if (!app.canvas) {
            app.canvas = {
                setMode: function(mode) {
                    this.currentMode = mode;
                },
                currentMode: null
            };
        }
        
        // Simulate pressing 'h' key
        const event = simulateKeyEvent(document, 'keydown', 'h');
        
        // Check if the correct tool was activated and canvas mode set
        return app.activeToolId === 'pan-tool' && app.canvas.currentMode === 'pan';
    });
    
    // Test 'v' shortcut for Select tool
    runner.addTest('Keyboard Shortcut - V key activates Select tool', async (app) => {
        // Create a mock app if we don't have a full one
        if (!app.setActiveToolButton) {
            app.setActiveToolButton = function(toolId) {
                this.activeToolId = toolId;
            };
            app.activeToolId = null;
        }
        
        // Create mock canvas if needed
        if (!app.canvas) {
            app.canvas = {
                setMode: function(mode) {
                    this.currentMode = mode;
                },
                currentMode: null
            };
        }
        
        // Simulate pressing 'v' key
        const event = simulateKeyEvent(document, 'keydown', 'v');
        
        // Check if the correct tool was activated and canvas mode set
        return app.activeToolId === 'select-tool' && app.canvas.currentMode === 'select';
    });
    
    // Test 'b' shortcut for Barrier tool
    runner.addTest('Keyboard Shortcut - B key activates Barrier tool', async (app) => {
        // Create mocks if needed
        if (!app.setActiveElementType) {
            app.setActiveElementType = function(type) {
                this.activeElementType = type;
                // Also need to trigger draw tool in our mock
                if (this.setActiveToolButton) {
                    this.setActiveToolButton('draw-tool');
                }
                // Set canvas mode if available
                if (this.canvas && this.canvas.setMode) {
                    this.canvas.setMode('draw');
                }
            };
            app.activeElementType = null;
        }
        
        // Create mock canvas if needed
        if (!app.canvas) {
            app.canvas = {
                setMode: function(mode) {
                    this.currentMode = mode;
                },
                currentMode: null
            };
        }
        
        // Simulate pressing 'b' key
        const event = simulateKeyEvent(document, 'keydown', 'b');
        
        // Check if the correct element type was activated and draw mode set
        return app.activeElementType === 'Barrier' && app.canvas.currentMode === 'draw';
    });
    
    // Test 'l' shortcut for Location tool
    runner.addTest('Keyboard Shortcut - L key activates Location tool', async (app) => {
        // Create mocks if needed
        if (!app.setActiveElementType) {
            app.setActiveElementType = function(type) {
                this.activeElementType = type;
                // Also need to trigger draw tool in our mock
                if (this.setActiveToolButton) {
                    this.setActiveToolButton('draw-tool');
                }
                // Set canvas mode if available
                if (this.canvas && this.canvas.setMode) {
                    this.canvas.setMode('draw');
                }
            };
            app.activeElementType = null;
        }
        
        // Create mock canvas if needed
        if (!app.canvas) {
            app.canvas = {
                setMode: function(mode) {
                    this.currentMode = mode;
                },
                currentMode: null
            };
        }
        
        // Simulate pressing 'l' key
        const event = simulateKeyEvent(document, 'keydown', 'l');
        
        // Check if the correct element type was activated and draw mode set
        return app.activeElementType === 'Location' && app.canvas.currentMode === 'draw';
    });
    
    // Test keyboard shortcuts don't activate when in input field
    runner.addTest('Keyboard shortcuts are ignored when in input fields', async (app) => {
        // Save current state
        const previousTool = app.activeToolId;
        const previousType = app.activeElementType;
        
        // Create a mock input field
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        
        // Try to use shortcuts while in an input field
        simulateKeyEvent(input, 'keydown', 'h');
        simulateKeyEvent(input, 'keydown', 'b');
        simulateKeyEvent(input, 'keydown', 'l');
        
        // Clean up
        document.body.removeChild(input);
        
        // Check that nothing changed while inputting
        return app.activeToolId === previousTool && app.activeElementType === previousType;
    });
}

// If this file is imported directly, update the main test-suite
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Add our tests to the existing test runner if available
        if (window.testRunner instanceof TestRunner) {
            defineKeyboardShortcutsTests(window.testRunner);
        }
    });
}
