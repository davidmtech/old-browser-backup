
import ControlModeDisabled_ from './disabled';
import {ControlModeMapObserver as ControlModeMapObserver_} from './map-observer';
import ControlModePano_ from './pano';

//get rid of compiler mess
var ControlModeDisabled = ControlModeDisabled_;
var ControlModeMapObserver = ControlModeMapObserver_;
var ControlModePano = ControlModePano_;


var ControlMode = function(browser) {
    this.browser = browser;
    this.ui = browser.ui;
    this.mapControl = this.ui.getMapControl();
    this.mapElement = this.mapControl.getMapElement();
    this.altKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;

    this.mapElement.on('drag', this.onDrag.bind(this));
    //this.mapElement.on('dragstart', this.onDragStart.bind(this));
    //this.mapElement.on('dragend', this.onDragEnd.bind(this));
    this.mapElement.on('mousedown', this.onDown.bind(this));
    this.mapElement.on('mouseup', this.onUp.bind(this));
    this.mapElement.on('mousewheel', this.onWheel.bind(this));
    this.mapElement.on('keyup', this.onKeyUp.bind(this), window);
    this.mapElement.on('keydown', this.onKeyDown.bind(this), window);
    this.mapElement.on('keypress', this.onKeyPress.bind(this), window);
    this.mapElement.on('dblclick', this.onDoubleClick.bind(this), window);
    this.browser.on('tick', this.onTick.bind(this));

    this.controlModes = {};
    this.currentCotnrolModeId = 'map-observer';
    this.currentControleMode = this.controlModes['map-observer'];

    // default control modes
    this.addControlMode('map-observer', new ControlModeMapObserver(browser));
    this.addControlMode('disabled', new ControlModeDisabled());
    this.addControlMode('pano', new ControlModePano(browser));

    // use map observer mode as default
    this.setDefaultControlMode();
};


ControlMode.prototype.addControlMode = function(id, controller) {
    this.controlModes[id] = controller;
};


ControlMode.prototype.removeControlMode = function(id) {
    if (id === this.currentCotnrolModeId) {
        return;
    }

    delete this.controlModes[id];
};


ControlMode.prototype.setCurrentControlMode = function(id, options) {
    var newMode = this.controlModes[id];
    if (!newMode) {
        return;
    }

    // set new mode
    this.currentControlModeId = id;
    this.currentControleMode = newMode;

    // call reset
    if (newMode["reset"]) {
        newMode["reset"](options);
    }
};


ControlMode.prototype.setDefaultControlMode = function() {
    this.setCurrentControlMode('map-observer');
};


ControlMode.prototype.getCurrentControlMode = function() {
    return this.currentControlModeId;
};


// Event callbacks

ControlMode.prototype.onDrag = function(event) {
    this.checkAutopilot();
    if (this.currentControleMode['drag']) {
        this.currentControleMode['drag'](event);
    }
};


ControlMode.prototype.onDown = function(event) {
    this.checkAutopilot();
    this.updateModifierKeys(event);
    if (this.currentControleMode['down']) {
        this.currentControleMode['down'](event);
    }
};


ControlMode.prototype.onUp = function(event) {
    this.updateModifierKeys(event);
    if (this.currentControleMode['up']) {
        this.currentControleMode['up'](event);
    }
};


ControlMode.prototype.onWheel = function(event) {
    this.checkAutopilot();
    if (this.currentControleMode['wheel']) {
        this.currentControleMode['wheel'](event);
    }
};


ControlMode.prototype.onKeyUp = function(event) {
    this.updateModifierKeys(event);
    if (this.currentControleMode['keyup']) {
        this.currentControleMode['keyup'](event);
    }
};


ControlMode.prototype.onKeyDown = function(event) {
    this.updateModifierKeys(event);
    if (this.currentControleMode['keydown']) {
        this.currentControleMode['keydown'](event);
    }
};


ControlMode.prototype.onKeyPress = function(event) {
    this.updateModifierKeys(event);
    if (this.currentControleMode['keypress']) {
        this.currentControleMode['keypress'](event);
    }
};


ControlMode.prototype.onDoubleClick = function(event) {
    this.updateModifierKeys(event);
    if (this.currentControleMode['doubleclick']) {
        this.currentControleMode['doubleclick'](event);
    }
};


ControlMode.prototype.onTick = function(event) {
    if (this.currentControleMode['tick']) {
        event.draggingState = this.mapElement.getDraggingState();    
        this.currentControleMode['tick'](event);
    }
};


// Private metod
ControlMode.prototype.updateModifierKeys = function(event) {
    this.altKey = event.getModifierKey("alt");
    this.shiftKey = event.getModifierKey("shift");
    this.ctrlKey = event.getModifierKey("ctrl");
    //console.log("alt:" + this.altKey + "  ctrl:" + this.ctrlKey + "  shift:" + this.shiftKey);
};


ControlMode.prototype.checkAutopilot = function() {
    if (this.browser.autopilot) {
        this.browser.autopilot.setAutorotate(0);
        this.browser.autopilot.setAutopan(0,0);
    }
};


export default ControlMode;
