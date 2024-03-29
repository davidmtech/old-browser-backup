
import Proj4 from 'proj4';
import {Core as Core_} from './core';
import {CoreInterface as CoreInterface_} from './interface';

//get rid of compiler mess
var CoreInterface = CoreInterface_;
var Core = Core_;
var proj4 = Proj4;


var CoreInterface = function(element, config) {
    this.core = new Core(element, config, this);

    Object.defineProperty(this, 'map', {
        get: function() {
            if (!this.core) { return null; }
            return this.core.getMapInterface();
        }
    });

    Object.defineProperty(this, 'renderer', {
        get: function() {
            if (!this.core) { return null; }
            return this.core.getRendererInterface();
        }
    });

    Object.defineProperty(this, 'proj4', {
        get: function() {
            if (!this.core) { return null; }
            return proj4;
        }
    });
};


CoreInterface.prototype.destroy = function() {
    this.core.destroy();
    this.core = null;
};


CoreInterface.prototype.loadMap = function(path) {
    if (!this.core) { return null; }
    return this.core.loadMap(path);
};


CoreInterface.prototype.destroyMap = function() {
    if (!this.core) { return null; }
    return this.core.destroyMap();
};


/*CoreInterface.prototype.getMap = function() {
    if (!this.core) { return null; }
    return this.core.getMapInterface();
};


CoreInterface.prototype.getRenderer = function() {
    if (!this.core) { return null; }
    return this.core.getRendererInterface();
};


CoreInterface.prototype.getProj4 = function() {
    if (!this.core) { return null; }
    return this.core.getProj4();
};*/


CoreInterface.prototype.on = function(eventName, call) {
    if (!this.core) { return null; }
    this.core.on(eventName, call);
};

CoreInterface.prototype.callListener = function(name, event) {
    if (!this.core) { return null; }
    this.core.callListener(name, event);
};


export {CoreInterface};

/*
Mel["MapCore"] = Mel.MapCore;
Mel["mapCore"] = Mel.MapCore;
CoreInterface.prototype["destroy"] = CoreInterface.prototype.destroy;
CoreInterface.prototype["loadMap"] = CoreInterface.prototype.loadMap;
CoreInterface.prototype["destroyMap"] = CoreInterface.prototype.destroyMap;
CoreInterface.prototype["getMap"] = CoreInterface.prototype.getMap;
CoreInterface.prototype["getRenderer"] = CoreInterface.prototype.getRenderer;
CoreInterface.prototype["on"] = CoreInterface.prototype.on;
CoreInterface.prototype["callListener"] = CoreInterface.prototype.callListener;
Mel["getCoreVersion"] = Mel.getCoreVersion;
Mel["checkSupport"] = Mel.checkSupport;
*/
