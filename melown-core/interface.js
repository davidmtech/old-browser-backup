
Melown.MapCore = function(element_, config_) {
    element_ = (typeof element_ !== "string") ? element_ : document.getElementById(element_);

    if (Melown.checkSupport()) {
        return new Melown.CoreInterface(element_, config_);
    } else {
        return null;
    }
};

/**
 * @constructor
 */
Melown.CoreInterface = function(element_, config_) {
    this.core_ = new Melown.Core(element_, config_);
    this.map_ = this.core_.getMap();
};

Melown.CoreInterface.prototype.getMap = function() {
    return this.core_.getMapInterface();
};

Melown.CoreInterface.prototype.getRenderer = function() {
    return this.core_.getRendererInterface();
};

Melown.CoreInterface.prototype.on = function(eventName_, call_) {
    this.core_.on(eventName_, call_);
};

Melown.CoreInterface.prototype.disableMap = function() {
    this.core_.disableMap_ = true;
}

Melown.CoreInterface.prototype.enableMap = function() {
    this.core_.disableMap_ = false;
}

Melown.CoreInterface.prototype.mapDisabled = function() {
    return this.core_.disableMap_;
}


//prevent minification
Melown["MapCore"] = Melown.MapCore;
Melown.CoreInterface.prototype["getMap"] = Melown.CoreInterface.prototype.getMap;
Melown.CoreInterface.prototype["getRenderer"] = Melown.CoreInterface.prototype.getRenderer;
Melown.CoreInterface.prototype["on"] = Melown.CoreInterface.prototype.on;
Melown["getVersion"] = Melown.getVersion;
Melown["checkSupport"] = Melown.checkSupport;






