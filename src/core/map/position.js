
/**
 * @constructor
 */
Melown.MapPosition = function(pos_) {
    if (pos_ instanceof Melown.MapPosition) {
        this.pos_ = pos_.pos_.slice();
    } else {
        if (!(pos_ != null && (pos_ instanceof Array))) {
            this.pos_ = [];
        } else {
            this.pos_ = pos_.slice();
        }

        this.validate();
    }
};

Melown.MapPosition.prototype.clone = function() {
    return new Melown.MapPosition(this.pos_);
};

Melown.MapPosition.prototype.getCoords = function() {
    return [this.pos_[1], this.pos_[2], this.pos_[4]];
};

Melown.MapPosition.prototype.getCoords2 = function() {
    return [this.pos_[1], this.pos_[2]];
};

Melown.MapPosition.prototype.setCoords = function(coords_) {
    this.pos_[1] = coords_[0];
    this.pos_[2] = coords_[1];
    this.pos_[4] = coords_[2];
    return this;
};

Melown.MapPosition.prototype.setCoords2 = function(coords_) {
    this.pos_[1] = coords_[0];
    this.pos_[2] = coords_[1];
    return this;
};

Melown.MapPosition.prototype.getHeight = function() {
    return this.pos_[4];
};

Melown.MapPosition.prototype.setHeight = function(height_) {
    this.pos_[4] = height_;
    return this;
};

Melown.MapPosition.prototype.getOrientation = function() {
    return [this.pos_[5], this.pos_[6], this.pos_[7]];
};

Melown.MapPosition.prototype.setOrientation = function(orientation_) {
    this.pos_[5] = orientation_[0];
    this.pos_[6] = orientation_[1];
    this.pos_[7] = orientation_[2];
    return this;
};

Melown.MapPosition.prototype.getFov = function() {
    return this.pos_[9];
};

Melown.MapPosition.prototype.setFov = function(fov_) {
    this.pos_[9] = fov_;
    return this;
};

Melown.MapPosition.prototype.getViewExtent = function() {
    return this.pos_[8];
};

Melown.MapPosition.prototype.setViewExtent = function(extent_) {
    this.pos_[8] = extent_;
    return this;
};

Melown.MapPosition.prototype.getViewDistance = function() {
    return (this.getViewExtent()*0.5) / Math.tan(Melown.radians(this.getFov()*0.5));
};

Melown.MapPosition.prototype.getViewMode = function() {
    return this.pos_[0];
};

Melown.MapPosition.prototype.getHeightMode = function() {
    return this.pos_[3];
};

Melown.MapPosition.prototype.check = function(mode_) {
    //check pich
    if (this.getViewMode() == "obj") {
        this.pos_[6] = Melown.clamp(this.pos_[6], -90.0, 90.0);
    } else {
        this.pos_[6] = Melown.clamp(this.pos_[6], -90.0, 90.0);
    }

    this.pos_[5] = this.pos_[5] % 360;
    this.pos_[7] = this.pos_[7] % 360;
};

Melown.MapPosition.prototype.isSame = function(pos_) {
    var pos_ = pos_.pos_;
    return (this.pos_[0] == pos_[0] &&
            Melown.isEqual(this.pos_[1], pos_[1], 0.0000001) &&
            Melown.isEqual(this.pos_[2], pos_[2], 0.0000001) &&
            this.pos_[3] == pos_[3] &&
            Melown.isEqual(this.pos_[4], pos_[4], 0.001) &&
            Melown.isEqual(this.pos_[5], pos_[5], 0.001) &&
            Melown.isEqual(this.pos_[6], pos_[6], 0.001) &&
            Melown.isEqual(this.pos_[7], pos_[7], 0.001) &&
            Melown.isEqual(this.pos_[8], pos_[8], 0.001) &&
            Melown.isEqual(this.pos_[9], pos_[9], 0.001));
};

Melown.MapPosition.prototype.validate = function() {
    var pos_ = this.pos_;
    if (pos_[0] == "fixed") { //old format
        pos_[0] = "obj";
        pos_[9] = pos_[8];
        pos_[8] = pos_[7];
        pos_[7] = pos_[6];
        pos_[6] = pos_[5];
        pos_[5] = pos_[4];
        pos_[4] = pos_[3];
        pos_[3] = "fix";
    }

    pos_[0] = (pos_[0] == "obj" || pos_[0] == "subj") ? pos_[0] : "obj";
    pos_[1] = (pos_[1] != null) ? pos_[1] : 0;
    pos_[2] = (pos_[2] != null) ? pos_[2] : 0;
    pos_[3] = (pos_[3] == "fix" || pos_[3] == "fixed" || pos_[3] == "float") ? pos_[3] : "float";
    pos_[4] = (pos_[4] != null) ? pos_[4] : 0;
    pos_[5] = (pos_[5] != null) ? pos_[5] : 0;
    pos_[6] = (pos_[6] != null) ? pos_[6] : -90;
    pos_[7] = (pos_[7] != null) ? pos_[7] : 0;
    pos_[8] = (pos_[8] != null) ? pos_[8] : 900;
    pos_[9] = (pos_[9] != null) ? pos_[9] : 55;

    pos_[3] = (pos_[3] == "fixed") ? "fix" : pos_[3];
};

Melown.MapPosition.prototype.toString = function() {
    var p = this.pos_;
    return p[0] + ", " + p[1].toFixed(0) + ", " + p[2].toFixed(0) + ", " + p[3] + ", " + p[4].toFixed(0)
           + ", " + p[5].toFixed(0) + ", " + p[6].toFixed(0) + ", " + p[7].toFixed(0) + ", " 
           + ", " + p[8].toFixed(0) + ", " + p[9].toFixed(0); 
};

Melown.MapPosition.prototype.toArray = function() {
    return this.pos_.slice();
};

Melown.MapPosition.prototype["clone"] = Melown.MapPosition.prototype.clone; 
Melown.MapPosition.prototype["isSame"] = Melown.MapPosition.prototype.isSame; 
Melown.MapPosition.prototype["setCoords"] = Melown.MapPosition.prototype.setCoords; 
Melown.MapPosition.prototype["getCoords"] = Melown.MapPosition.prototype.getCoords; 
Melown.MapPosition.prototype["setHeight"] = Melown.MapPosition.prototype.setHeight; 
Melown.MapPosition.prototype["getHeight"] = Melown.MapPosition.prototype.getHeight; 
Melown.MapPosition.prototype["setOrientation"] = Melown.MapPosition.prototype.setOrientation; 
Melown.MapPosition.prototype["getOrientation"] = Melown.MapPosition.prototype.getOrientation; 
Melown.MapPosition.prototype["setViewExtent"] = Melown.MapPosition.prototype.setViewExtent;
Melown.MapPosition.prototype["getViewExtent"] = Melown.MapPosition.prototype.getViewExtent; 
Melown.MapPosition.prototype["setFov"] = Melown.MapPosition.prototype.setFov;
Melown.MapPosition.prototype["getFov"] = Melown.MapPosition.prototype.getFov; 
Melown.MapPosition.prototype["getViewMode"] = Melown.MapPosition.prototype.getViewMode; 
Melown.MapPosition.prototype["getHeightMode"] = Melown.MapPosition.prototype.getHeightMode; 
Melown.MapPosition.prototype["toArray"] = Melown.MapPosition.prototype.toArray; 


