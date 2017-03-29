
Melown.Map.prototype.convertCoords = function(coords_, source_, destination_) {
    return this.referenceFrame_.convertCoords(coords_, source_, destination_);
};

Melown.Map.prototype.movePositionCoordsTo = function(position_, azimuth_, distance_, azimuthCorrectionFactor_) {
    var coords_ = position_.getCoords();
    var navigationSrsInfo_ = this.getNavigationSrs().getSrsInfo();
    azimuthCorrectionFactor_ = (azimuthCorrectionFactor_ == null) ? 1 : azimuthCorrectionFactor_; 

    if (this.getNavigationSrs().isProjected()) {
        var yaw_ = Melown.radians(azimuth_);
        var forward_ = [-Math.sin(yaw_), Math.cos(yaw_)];

        position_.setCoords2([coords_[0] + (forward_[0]*distance_),
                              coords_[1] + (forward_[1]*distance_)]);
    } else {
        var navigationSrsInfo_ = this.getNavigationSrs().getSrsInfo();

        var geod = new GeographicLib["Geodesic"]["Geodesic"](navigationSrsInfo_["a"],
                                                       (navigationSrsInfo_["a"] / navigationSrsInfo_["b"]) - 1.0);

        var r = geod["Direct"](coords_[1], coords_[0], azimuth_, distance_);
        position_.setCoords2([r["lon2"], r["lat2"]]);

        var orientation_ = position_.getOrientation();

        //console.log("corerction_: " + (r.azi1 - r.azi2));

        orientation_[0] += (r["azi1"] - r["azi2"]) * azimuthCorrectionFactor_;
        //orientation_[0] -= (r.azi1 - r.azi2); 

        //if (!skipOrientation_) {
            position_.setOrientation(orientation_);
        //}
        
        //console.log("azimuthCorrection: " + azimuthCorrectionFactor_);
        //console.log("oldpos: " + JSON.stringify(this));
        //console.log("newpos: " + JSON.stringify(pos2_));
    }
    
    return position_;
};

Melown.Map.prototype.convertPositionViewMode = function(position_, mode_) {
    if (mode_ == position_.pos_[0]) {
        return position_;
    }

    if (mode_ == "obj") {
        if (position_.getHeightMode() == "float") {
            var covertToFloat_ = true;
            this.convertPositionHeightMode(position_, "fix", true);
        }
        
        var distance_ = position_.getViewDistance();
        var orientation_ = position_.getOrientation();
        
        //get height delta
        var pich_ = Melown.radians(-orientation_[1]);
        var heightDelta_ = distance_ * Math.sin(pich_);

        //reduce distance by pich
        distance_ *= Math.cos(pich_);

        if (this.getNavigationSrs().isProjected()) {
            //get forward vector
            var yaw_ = Melown.radians(orientation_[0]);
            var forward_ = [-Math.sin(yaw_), Math.cos(yaw_)];
    
            //get center coords 
            var coords_ = position_.getCoords();
            coords_[0] = coords_[0] + (forward_[0] * distance_);
            coords_[1] = coords_[1] + (forward_[1] * distance_);
        } else {
            this.movePositionCoordsTo(position_, -orientation_[0], distance_);
            var coords_ = position_.getCoords();
        }
        
        coords_[2] -= heightDelta_;
        position_.setCoords(coords_);

        if (covertToFloat_) {
            this.convertPositionHeightMode(position_, "float", true);
        }
        
    } else if (mode_ == "subj") {
        var coords_ = this.getPositionCameraCoords(position_, position_.getHeightMode());
        position_.setCoords(coords_);
                
        //TODO: take in accout planet ellipsoid
    }

    position_.pos_[0] = mode_;

    return position_;
};

Melown.Map.prototype.convertPositionHeightMode = function(position_, mode_, noPrecisionCheck_) {
    if (position_.pos_[3] == mode_) {
        return position_;
    }

    var lod_ =  this.getOptimalHeightLod(position_.getCoords(), position_.getViewExtent(), this.config_.mapNavSamplesPerViewExtent_);
    var height_ = this.getSurfaceHeight(position_.getCoords(), lod_);

    if (height_[1] == false && !noPrecisionCheck_) {
        //return null;
    }

    //set new height
    if (mode_ == "float") {
        position_.pos_[3] = mode_;
        position_.pos_[4] = position_.pos_[4] - height_[0];
    } else if (mode_ == "fix") {
        position_.pos_[3] = mode_;
        position_.pos_[4] = position_.pos_[4] + height_[0];
    }

    return position_;
};

Melown.Map.prototype.getPositionCameraCoords = function(position_, heightMode_) {
    var orientation_ = position_.getOrientation();
    var rotMatrix_ = Melown.mat4.create();
    Melown.mat4.multiply(Melown.rotationMatrix(2, Melown.radians(orientation_[0])), Melown.rotationMatrix(0, Melown.radians(orientation_[1])), rotMatrix_);

    if (position_.getViewMode() == "obj") {
        var coords_ = position_.getCoords();
        var terrainHeight_ = 0;
        var lod_ = -1;

        //convert height to fix
        if (position_.getHeightMode() == "float") {
            lod_ = this.getOptimalHeightLod(coords_, position_.getViewExtent(), this.config_.mapNavSamplesPerViewExtent_);
            var surfaceHeight_ = this.getSurfaceHeight(coords_, lod_);
            terrainHeight_ = surfaceHeight_[0];
        }

        var camInfo_ = this.getPositionCameraInfo(position_, this.getNavigationSrs().isProjected());

        if (this.getNavigationSrs().isProjected()) {
            //var distance_ = (this.getViewExtent()) / Math.tan(Melown.radians(this.getFov()*0.5));
            //var orbitPos_ = [0, -distance_, 0];
            //Melown.mat4.multiplyVec3(rotMatrix_, orbitPos_);

            coords_[0] += camInfo_.orbitCoords_[0];
            coords_[1] += camInfo_.orbitCoords_[1];
            coords_[2] += camInfo_.orbitCoords_[2] + terrainHeight_;
        } else {
            var worldPos_ = this.convertCoords([coords_[0], coords_[1], coords_[2] + terrainHeight_], "navigation", "physical");
            worldPos_[0] += camInfo_.orbitCoords_[0];
            worldPos_[1] += camInfo_.orbitCoords_[1];
            worldPos_[2] += camInfo_.orbitCoords_[2];// + terrainHeight_;

            coords_ = this.convertCoords(worldPos_, "physical", "navigation");
        }

        if (heightMode_ == "fix") {
            return coords_;
        } else {
            //get float height for new coords
            if (lod_ == -1) {
                lod_ =  this.getOptimalHeightLod(coords_, position_.getViewExtent(), this.config_.mapNavSamplesPerViewExtent_);
            }
            
            var surfaceHeight_ = this.getSurfaceHeight(coords_, lod_);
            coords_[2] -= surfaceHeight_[0];

            return coords_;
        }

    } else {

        if (position_.getHeightMode() == heightMode_) {
            return position_.getCoords();
        } else {
            var lod_ =  this.getOptimalHeightLod(position_.getCoords(), position_.getViewExtent(), this.config_.mapNavSamplesPerViewExtent_);
            var surfaceHeight_ = this.getSurfaceHeight(position_.getCoords(), lod_);
            //height_ += surfaceHeight_[0];

            var coords_ = position_.getCoords();

            if (heightMode_ == "fix") {
                coords_[2] += surfaceHeight_[0];
            } else {
                coords_[2] -= surfaceHeight_[0];
            }

            return coords_;
        }
    }
};

Melown.Map.prototype.getPositionPhysCoords = function(position_, lod_) {
    var coords_ = position_.getCoords();

    if (position_.getHeightMode() == "float") {
        lod_ =  (lod_ != null) ? lod_ : this.getOptimalHeightLod(position_.getCoords(), position_.getViewExtent(), this.config_.mapNavSamplesPerViewExtent_);
        var surfaceHeight_ = this.getSurfaceHeight(position_.getCoords(), lod_);
        coords_[2] += surfaceHeight_[0]; 
    }

    return this.convertCoords(coords_, "navigation", "physical");
};

Melown.Map.prototype.getPositionCameraSpaceCoords = function(position_, lod_) {
    var coords_ = position_.getCoords();

    if (position_.getHeightMode() == "float") {
        lod_ =  (lod_ != null) ? lod_ : this.getOptimalHeightLod(position_.getCoords(), position_.getViewExtent(), this.config_.mapNavSamplesPerViewExtent_);
        var surfaceHeight_ = this.getSurfaceHeight(position_.getCoords(), lod_);
        coords_[2] += surfaceHeight_[0]; 
    }

    var worldPos_ = this.convertCoords(coords_, "navigation", "physical");
    var camPos_ = this.cameraPosition_;
    worldPos_[0] -= camPos_[0];
    worldPos_[1] -= camPos_[1];
    worldPos_[2] -= camPos_[2];
  
    return worldPos_;
};

Melown.Map.prototype.getPositionCanvasCoords = function(position_, lod_, physical_) {
    if (physical_) {
        var camPos_ = this.cameraPosition_;
        var coords_ = position_.getCoords();
        var worldPos_ = [coords_[0] - camPos_[0],
                         coords_[1] - camPos_[1],
                         coords_[2] - camPos_[2]];
    } else {
        var worldPos_ = this.getPositionCameraSpaceCoords(position_, lod_);
    }
    
    return this.renderer_.project2(worldPos_, this.camera_.getMvpMatrix());
};


Melown.Map.prototype.getPositionNED = function(position_) {
    var pos_ = position_.clone();
    var coords_ = pos_.getCoords();
    coords_[2] = 0;
    var centerCoords_ = this.convertCoords(coords_, "navigation", "physical");

    if (this.getNavigationSrs().isProjected()) {
        var upCoords_ = this.convertCoords([coords_[0], coords_[1] + 100, coords_[2]], "navigation", "physical");
        var rightCoords_ = this.convertCoords([coords_[0] + 100, coords_[1], coords_[2]], "navigation", "physical");
    } else {
        var cy = (coords_[1] + 90) - 0.0001;
        var cx = (coords_[0] + 180) + 0.0001;

        if (cy < 0 || cx > 180) { //if we are out of bounds things start to be complicated
            var geodesic_ = this.getGeodesic();
        
            var r = geodesic_["Direct"](coords_[1], coords_[0], 0, -100);
            var upPos_ = position_.clone();
            upPos_.setCoords2([r["lon2"], r["lat2"]]);        
            var upCoords_ = this.convertCoords(upPos_.getCoords(), "navigation", "physical");
    
            r = geodesic_["Direct"](coords_[1], coords_[0], 90, 100);
            var rightPos_ = position_.clone();
            rightPos_.setCoords2([r["lon2"], r["lat2"]]);        
            var rightCoords_ = this.convertCoords(rightPos_.getCoords(), "navigation", "physical");
        } else {
            // substraction instead of addition is probably case of complicated view matrix calculation
            var upCoords_ = this.convertCoords([coords_[0], coords_[1] - 0.0001, coords_[2]], "navigation", "physical");
            var rightCoords_ = this.convertCoords([coords_[0] + 0.0001, coords_[1], coords_[2]], "navigation", "physical");
        }
    }

    var up_ = [upCoords_[0] - centerCoords_[0],
               upCoords_[1] - centerCoords_[1],
               upCoords_[2] - centerCoords_[2]]; 

    var right_ = [rightCoords_[0] - centerCoords_[0],
                  rightCoords_[1] - centerCoords_[1],
                  rightCoords_[2] - centerCoords_[2]]; 

    var dir_ = [0,0,0];
    Melown.vec3.normalize(up_);
    Melown.vec3.normalize(right_);
    Melown.vec3.cross(up_, right_, dir_);
    Melown.vec3.normalize(dir_);
    
    return {
        east_  : right_, 
        direction_ : up_,
        north_ : dir_        
    };
};

Melown.Map.prototype.getPositionCameraInfo = function(position_, projected_, clampTilt_) {
    //var position_ = [0,0,0];
    var orientation_ = position_.getOrientation();
    var distance_ = position_.getViewDistance();
    
    if (clampTilt_) { //used for street labels
        orientation_[1] = Melown.clamp(orientation_[1], -89.0, 90.0);
    }
    
    var tmpMatrix_ = Melown.mat4.create();
    Melown.mat4.multiply(Melown.rotationMatrix(2, Melown.radians(orientation_[0])), Melown.rotationMatrix(0, Melown.radians(orientation_[1])), tmpMatrix_);

    if (position_.getViewMode() == "obj") {
        var orbitPos_ = [0, -distance_, 0];
        Melown.mat4.multiplyVec3(tmpMatrix_, orbitPos_);
    } else {
        var orbitPos_ = [0, 0, 0];
    }

    //this.cameraVector_ = [0, 0, 1];
    //Melown.mat4.multiplyVec3(this.updateCameraMatrix_, this.cameraVector_);

    var ret_ = {
        orbitCoords_ : null,
        distance_ : distance_,
        rotMatrix_ : null,
        vector_ : null,
        orbitHeight_ : orbitPos_[2]  
    };

    if (projected_) {
        
        tmpMatrix_ = Melown.mat4.create();
        Melown.mat4.multiply(Melown.rotationMatrix(0, Melown.radians(-orientation_[1] - 90.0)), Melown.rotationMatrix(2, Melown.radians(-orientation_[0])), tmpMatrix_);

        /*
        //get NED for latlon coordinates
        //http://www.mathworks.com/help/aeroblks/directioncosinematrixeceftoned.html
        var coords_ = this.position_.getCoords();
        var lon_ = Melown.radians(0);
        var lat_ = Melown.radians(89);

        //NED vectors for sphere
        var east_ = [-Math.sin(lat_)*Math.cos(lon_), -Math.sin(lat_)*Math.sin(lon_), Math.cos(lat_)];
        var direction_ = [-Math.sin(lon_), Math.cos(lon_), 0];
        var north_ = [-Math.cos(lat_)*Math.cos(lon_), -Math.cos(lat_)*Math.sin(lon_), -Math.sin(lat_)];
        //direction_ = [-direction_[0], -direction_[1], -direction_[2]];

        north_ = Melown.vec3.negate(north_);
        east_  = Melown.vec3.negate(east_);
        //direction_ = Melown.vec3.negate(direction_);
        */

        var ned_ = this.getPositionNED(position_);
        north_ = ned_.north_;
        east_  = ned_.east_;
        direction_ = ned_.direction_;

        var spaceMatrix_ = [
            east_[0], east_[1], east_[2], 0,
            direction_[0], direction_[1], direction_[2], 0,
            north_[0], north_[1], north_[2], 0,
            0, 0, 0, 1
        ];
        
        var east2_  = [1,0,0];
        var direction2_ = [0,1,0];
        var north2_ = [0,0,1];

        var dir_ = [1,0,0];
        var up_ = [0,0,-1];
        var right_ = [0,0,0];
        Melown.vec3.cross(dir_, up_, right_);

        //rotate vectors according to eulers
        Melown.mat4.multiplyVec3(tmpMatrix_, north2_);
        Melown.mat4.multiplyVec3(tmpMatrix_, east2_);
        Melown.mat4.multiplyVec3(tmpMatrix_, direction2_);

        Melown.mat4.multiplyVec3(tmpMatrix_, dir_);
        Melown.mat4.multiplyVec3(tmpMatrix_, up_);
        Melown.mat4.multiplyVec3(tmpMatrix_, right_);

        var t = 0;
        t = dir_[0]; dir_[0] = dir_[1]; dir_[1] = t;
        t = up_[0]; up_[0] = up_[1]; up_[1] = t;
        t = right_[0]; right_[0] = right_[1]; right_[1] = t;
        
        dir_[2] = -dir_[2];
        up_[2] = -up_[2];
        right_[2] = -right_[2];

        /*
        Melown.mat4.multiplyVec3(spaceMatrix_, north2_);
        Melown.mat4.multiplyVec3(spaceMatrix_, east2_);
        Melown.mat4.multiplyVec3(spaceMatrix_, direction2_);
        */

        //get rotation matrix
        var rotationMatrix_ = [
            east2_[0], east2_[1], east2_[2], 0,
            direction2_[0], direction2_[1], direction2_[2], 0,
            north2_[0], north2_[1], north2_[2], 0,
            0, 0, 0, 1
        ];

       // Melown.mat4.multiplyVec3(spaceMatrix_, orbitPos_);
/*
        //get rotation matrix
        var rotationMatrix_ = [
            east_[0], east_[1], east_[2], 0,
            direction_[0], direction_[1], direction_[2], 0,
            north_[0], north_[1], north_[2], 0,
            0, 0, 0, 1
        ];
*/
        ret_.vector_ = Melown.vec3.normalize([-orbitPos_[0], -orbitPos_[1], -orbitPos_[2]]); 
        ret_.vector2_ = ret_.vector_; //vector2 is probably hack for tree.js bboxVisible 
        
        ret_.orbitCoords_ = orbitPos_;
        ret_.rotMatrix_ = rotationMatrix_; 

    } else { //geographics

        //get NED for latlon coordinates
        //http://www.mathworks.com/help/aeroblks/directioncosinematrixeceftoned.html
/*        
        var coords_ = this.position_.getCoords();
        var lon_ = Melown.radians(coords_[0]);
        var lat_ = Melown.radians(coords_[1]);

        //NED vectors for sphere
        var east_ = [-Math.sin(lat_)*Math.cos(lon_), -Math.sin(lat_)*Math.sin(lon_), Math.cos(lat_)];
        var direction_ = [-Math.sin(lon_), Math.cos(lon_), 0];
        var north_ = [-Math.cos(lat_)*Math.cos(lon_), -Math.cos(lat_)*Math.sin(lon_), -Math.sin(lat_)];

        north_ = Melown.vec3.negate(north_);
        east_  = Melown.vec3.negate(east_);
        
        //get elipsoid factor
        var navigationSrsInfo_ = this.getNavigationSrs().getSrsInfo();
        var factor_ = navigationSrsInfo_["b"] / navigationSrsInfo_["a"];

        //flaten vectors
        north_[2] *= factor_;
        east_[2] *= factor_;
        direction_[2] *= factor_;

        //normalize vectors
        north_ = Melown.vec3.normalize(north_);
        east_  = Melown.vec3.normalize(east_);
        direction_ = Melown.vec3.normalize(direction_);
*/
        
        var ned_ = this.getPositionNED(position_);
        north_ = ned_.north_;
        east_  = ned_.east_;
        direction_ = ned_.direction_;
        

        var spaceMatrix_ = [
            east_[0], east_[1], east_[2], 0,
            direction_[0], direction_[1], direction_[2], 0,
            north_[0], north_[1], north_[2], 0,
            0, 0, 0, 1
        ];
        
        //spaceMatrix_ = Melown.mat4.inverse(spaceMatrix_);
        
        var localRotMatrix_ = Melown.mat4.create();
        Melown.mat4.multiply(Melown.rotationMatrix(0, Melown.radians(-orientation_[1] - 90.0)), Melown.rotationMatrix(2, Melown.radians(-orientation_[0])), localRotMatrix_);

        var east2_  = [1,0,0];
        var direction2_ = [0,1,0];
        var north2_ = [0,0,1];

        var coords_ = position_.getCoords();
        var latlonMatrix_ = Melown.mat4.create();
        Melown.mat4.multiply(Melown.rotationMatrix(0, Melown.radians((coords_[1] - 90.0))), Melown.rotationMatrix(2, Melown.radians((-coords_[0]-90))), latlonMatrix_);
//      Melown.mat4.multiply(Melown.rotationMatrix(2, Melown.radians((coords_[0]-90))), Melown.rotationMatrix(0, Melown.radians((coords_[1] - 90.0))), latlonMatrix_);


        //Melown.mat4.multiply(Melown.rotationMatrix(0, Melown.radians(0)), Melown.rotationMatrix(2, Melown.radians(-(coords_[0]+90))), latlonMatrix_);
        //Melown.mat4.multiply(Melown.rotationMatrix(0, Melown.radians(0)), Melown.rotationMatrix(2, Melown.radians(0)), latlonMatrix_);

        //rotate vectors according to latlon
        Melown.mat4.multiplyVec3(latlonMatrix_, north2_);
        Melown.mat4.multiplyVec3(latlonMatrix_, east2_);
        Melown.mat4.multiplyVec3(latlonMatrix_, direction2_);


        var spaceMatrix_ = [
            east2_[0], east2_[1], east2_[2], 0,
            direction2_[0], direction2_[1], direction2_[2], 0,
            north2_[0], north2_[1], north2_[2], 0,
            0, 0, 0, 1
        ];

        var right_ = [1,0,0];
        var dir_ = [0,1,0];
        var up_ = [0,0,1];
        //Melown.vec3.cross(dir_, up_, right_);

        //rotate vectors according to eulers
        //Melown.mat4.multiplyVec3(this.updateCameraMatrix_, north2_);
        //Melown.mat4.multiplyVec3(this.updateCameraMatrix_, east2_);
        //Melown.mat4.multiplyVec3(this.updateCameraMatrix_, direction2_);

        Melown.mat4.multiplyVec3(spaceMatrix_, dir_);
        Melown.mat4.multiplyVec3(spaceMatrix_, up_);
        Melown.mat4.multiplyVec3(spaceMatrix_, right_);

        Melown.mat4.multiplyVec3(localRotMatrix_, right_);
        Melown.mat4.multiplyVec3(localRotMatrix_, dir_);
        Melown.mat4.multiplyVec3(localRotMatrix_, up_);
        
        //Melown.mat4.multiplyVec3(spaceMatrix_, north2_);
        //Melown.mat4.multiplyVec3(spaceMatrix_, east2_);
        //Melown.mat4.multiplyVec3(spaceMatrix_, direction2_);


        //get rotation matrix
/*        
        var rotationMatrix_ = [
            east2_[0], east2_[1], east2_[2], 0,
            direction2_[0], direction2_[1], direction2_[2], 0,
            north2_[0], north2_[1], north2_[2], 0,
            0, 0, 0, 1
        ];
*/        

        var rotationMatrix_ = [
            right_[0], right_[1], right_[2], 0,
            dir_[0], dir_[1], dir_[2], 0,
            up_[0], up_[1], up_[2], 0,
            0, 0, 0, 1
        ];

        //get orbit pos
        spaceMatrix_ = Melown.mat4.inverse(spaceMatrix_);
        Melown.mat4.multiplyVec3(spaceMatrix_, orbitPos_);

        ret_.vector2_ = [-spaceMatrix_[8], -spaceMatrix_[9], -spaceMatrix_[10]]; //vector2 is probably hack for tree.js bboxVisible 

        //var ray_ = this.map_.renderer_.getScreenRay(800,400);

        //get camera direction
        Melown.mat4.inverse(rotationMatrix_, spaceMatrix_);
        ret_.vector_ = [-spaceMatrix_[8], -spaceMatrix_[9], -spaceMatrix_[10]]; 
        
        //console.log("cam vec: " + JSON.stringify(this.cameraVector_));
         
        //this.position_.setHeight(0); !!!!!!!!!!!!!!!
    }

    ret_.orbitCoords_ = orbitPos_;
    ret_.rotMatrix_ = rotationMatrix_;
    return ret_; 
};

