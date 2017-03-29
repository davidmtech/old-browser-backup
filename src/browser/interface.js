
Melown.MapBrowser = function(element_, config_) {
    var interface_ = new Melown.BrowserInterface(element_, config_);
    return interface_.core_ ? interface_ : null;
};

/**
 * @constructor
 */
Melown.BrowserInterface = function(element_, config_) {
    this.browser_ = new Melown.Browser(element_, config_);
    this.core_ = this.browser_.getCore();
    this.map_ = null;//this.core_.getMap();
    this.ui_ = this.browser_.ui_;
    this.autopilot_ = this.browser_.autopilot_;
    this.presenter_ = this.browser_.presenter_;
    this.killed_ = false;
    this.core_.on("map-loaded", (function(){ this.map_ = this.core_.getMap(); }).bind(this));
    this.core_.on("map-unloaded", (function(){ this.map_ = null; }).bind(this));    
};

Melown.BrowserInterface.prototype.getPresenter = function() {
    if (this.killed_) return;
    return this.presenter_;
};

Melown.BrowserInterface.prototype.getMap = function() {
    if (this.killed_) return;
    return this.core_.getMap();
};

Melown.BrowserInterface.prototype.getRenderer = function() {
    if (this.killed_) return;
    return this.core_.getRenderer();
};

Melown.BrowserInterface.prototype.getAutopilot = function() {
    if (this.killed_) return;
    return this.autopilot_;
};

Melown.BrowserInterface.prototype.getProj4 = function() {
    if (this.killed_) return;
    return this.core_.getProj4();
};

Melown.BrowserInterface.prototype.getUI = function() {
    if (this.killed_) return;
    return this.ui_;
};

Melown.BrowserInterface.prototype.destroy = function() {
    if (this.killed_) return;
    this.core_.destroy();
    this.map_ = null;
    this.browser_.killed_ = true;
    this.ui_.kill();
    this.ui_ = null;
    this.core_ = null;
    this.killed_ = true;
    return null;    
};

Melown.BrowserInterface.prototype.setControlMode = function(mode_) {
    if (this.killed_) return;
    this.browser_.controlMode_ = mode_;
    return this;    
};

Melown.BrowserInterface.prototype.getControlMode = function() {
    if (this.killed_) return;
    return this.browser_.controlMode_;
};

Melown.BrowserInterface.prototype.loadMap = function(path_) {
    if (this.killed_) return;
    this.core_.loadMap(path_);
    return this;    
};

Melown.BrowserInterface.prototype.destroyMap = function() {
    if (this.killed_) return;
    this.core_.destroyMap();
    this.map_ = null;
    return this;    
};

Melown.BrowserInterface.prototype.on = function(eventName_, call_) {
    this.core_.on(eventName_, call_);
    return this;    
};

Melown.BrowserInterface.prototype.setParams = function(params_) {
    this.setConfigParams(params_);
    return this;
};

Melown.BrowserInterface.prototype.setParam = function(key_, value_) {
    this.setConfigParam(key_, value_);
    return this;
};

Melown.BrowserInterface.prototype.getParam = function(key_) {
    return this.getConfigParam(key_, value_);
};

Melown.getBrowserVersion = function() {
    return "Browser: 1.17, Core: " + Melown.getCoreVersion();
};

//prevent minification
Melown["MapBrowser"] = Melown.MapBrowser;
Melown["mapBrowser"] = Melown.MapBrowser;
Melown.BrowserInterface.prototype["getMap"] = Melown.BrowserInterface.prototype.getMap; 
Melown.BrowserInterface.prototype["getRenderer"] = Melown.BrowserInterface.prototype.getRenderer; 
Melown.BrowserInterface.prototype["getPresenter"] = Melown.BrowserInterface.prototype.getPresenter; 
Melown.BrowserInterface.prototype["getAutopilot"] = Melown.BrowserInterface.prototype.getAutopilot; 
Melown.BrowserInterface.prototype["getProj4"] = Melown.BrowserInterface.prototype.getProj4; 
Melown.BrowserInterface.prototype["getUI"] = Melown.BrowserInterface.prototype.getUI; 
Melown.BrowserInterface.prototype["destroy"] = Melown.BrowserInterface.prototype.destroy; 
Melown.BrowserInterface.prototype["setControlMode"] = Melown.BrowserInterface.prototype.setControlMode;
Melown.BrowserInterface.prototype["getControlMode"] = Melown.BrowserInterface.prototype.getControlMode;
Melown.BrowserInterface.prototype["loadMap"] = Melown.BrowserInterface.prototype.loadMap;
Melown.BrowserInterface.prototype["destroyMap"] = Melown.BrowserInterface.prototype.destroyMap;
Melown.BrowserInterface.prototype["on"] = Melown.BrowserInterface.prototype.on; 
Melown.BrowserInterface.prototype["setParams"] = Melown.BrowserInterface.prototype.setParams; 
Melown.BrowserInterface.prototype["setParam"] = Melown.BrowserInterface.prototype.setParam; 
Melown.BrowserInterface.prototype["getParam"] = Melown.BrowserInterface.prototype.getParam; 
Melown["getBrowserVersion"] = Melown.getBrowserVersion; 

