
Melown.Map.prototype["quad"] = function(lod_, ix, iy) {
    var quadKey = "";
    //ty = Math.pow(2,zoom - 1) - ty;
    for (i = lod_; i > 0; i--) {
        var digit = 0;
        var mask = 1 << (i-1);
        if ((ix & mask) != 0) {
            digit += 1;
        }

        if ((iy & mask) != 0) {
            digit += 2;
        }

        quadKey += digit;
    }

    return quadKey;
};

Melown.Map.prototype["msDigit"] = function(iy, ix) {
    return (((iy & 3) << 1) + (ix & 1));
};

Melown.Map.prototype.hex = function(v, n) {
    var s = v.toString(16);
    while (s.length < 8) {
        s = "0" + s;
    }
    return s;
};

Melown.Map.prototype["ppx"] = function(lod_, ix) {
    return this.hex(ix << (28 - lod_), 7);

};

Melown.Map.prototype["ppy"] = function(lod_, iy) {
    return this.hex((1 << 28) - ((iy + 1) << (28 - lod_)), 7);
};


Melown.Map.prototype.processUrlFunction = function(id_, counter_, string_) {
    if (typeof string_ == "string") {
        if (string_.indexOf("quad") != -1) {
            var string2_ = "(function(lod,x,y,loclod,locx,locy){" + string_.replace("quad", "return this.quad") + "})";

            try {
                var fc_ = eval(string2_).bind(this);
                return fc_(id_.lod_, id_.ix_, id_.iy_, id_.loclod_, id_.locx_, id_.locy_);
            } catch(e) {
                return string_;
            }
        } else if (string_.indexOf("ms_digit") != -1) {
            var string2_ = "(function(x,y,loclod,locx,locy){" + string_.replace("ms_digit", "return this.msDigit") + "})";

            try {
                var fc_ = eval(string2_).bind(this);
                return fc_(id_.ix_, id_.iy_, id_.loclod_, id_.locx_, id_.locy_);
            } catch(e) {
                return string_;
            }

        } else if (string_.indexOf("alt") != -1) {

            var result_ = /\(([^)]*)\)/.exec(string_);

            if (result_ && result_[1]) {
                var strings_ = result_[1].match(/([^,]+)/g);

                if (strings_.length > 0) {
                    return strings_[(counter_ % strings_.length)];
                }
            }

            return string_;

        } else if (string_.indexOf("ppx") != -1) {

            var string2_ = "(function(lod,x,loclod,locx){" + string_.replace("ppx", "return this.ppx") + "})";

            try {
                var fc_ = eval(string2_).bind(this);
                return fc_(id_.lod_, id_.ix_, id_.loclod_, id_.locx_);
            } catch(e) {
                return string_;
            }

        } else if (string_.indexOf("ppy") != -1) {

            var string2_ = "(function(lod,y,loclod,locy){" + string_.replace("ppy", "return this.ppy") + "})";

            try {
                var fc_ = eval(string2_).bind(this);
                return fc_(id_.lod_, id_.iy_, id_.loclod_, id_.locy_);
            } catch(e) {
                return string_;
            }

        } else {
            return string_;
        }

    } else {
        return string_;
    }

};

Melown.Map.prototype.findLocalRoot = function(id_) {
    var nodes_ = this.referenceFrame_.getSpatialDivisionNodes();
    var validNodes_ = [];  

    for (var i = 0, li = nodes_.length; i < li; i++) {
        var node_ = nodes_[i];
        
        var delta_ = id_[0] - node_.id_[0];
        
        ix_ = id_[1] >> delta_;
        iy_ = id_[2] >> delta_;
        
        if (ix_ == node_.id_[1] && iy_ == node_.id_[2]) {
            validNodes_.push(node_);           
        }
    }

    var bestNode_ = null;
    var bestLod_ = -1;
    
    for (var i = 0, li = validNodes_.length; i < li; i++) {
        if (validNodes_[i].id_[0] > bestLod_) {
            bestNode_ = validNodes_[i]; 
        }
    }
    
    if (bestNode_) {
        return bestNode_.id_.slice();
    } else {
        return [0,0,0];
    }
};

Melown.Map.prototype.makeUrl = function(templ_, id_, subId_, skipBaseUrl_) {
    //if (templ_.indexOf("jpg") != -1) {
       //templ_ = "{lod}-{easting}-{northing}.jpg?v=4";
       //templ_ = "{lod}-{x}-{y}.jpg?v=4";
       //templ_ = "{quad(lod,x,y)}.jpg?v=4";
       //templ_ = "{quad(lod,x+1,y*2)}.jpg?v=4";
       //templ_ = "{lod}-{ms_digit(x,y)}.jpg?v=4";
    //}
    //templ_ = "maps{alt(1,2,3,4)}.irist-test.citationtech.net/map/{lod}-{x}-{y}.jpg?v=4";

    //var worldParams_ = id_.getWorldParams();
    //var url_ = Melown.simpleFmtObjOrCall(templ_, {"lod":id_.lod_, "easting":Melown.padNumber(worldParams_[0], 7), "northing":Melown.padNumber(worldParams_[1], 7),

    var locx_ = 0;
    var locy_ = 0;
    var loclod_ = 0;

    if (id_.lod_) {
        var localRoot_ = this.findLocalRoot([id_.lod_, id_.ix_, id_.iy_]);    
        loclod_ = id_.lod_ - localRoot_[0];
        var mask_ = (1 << loclod_) - 1;
        locx_ = id_.ix_ & mask_;
        locy_ = id_.iy_ & mask_;        
    }
    
    var id2_ = {
        lod_: id_.lod_,
        ix_ : id_.ix_,
        iy_ : id_.iy_,
        loclod_: loclod_,
        locx_ : locx_,
        locy_ : locy_
    };

    //remove white spaces from template
    templ_ = templ_.replace(/ /g, '');

    var url_ = Melown.simpleFmtObjOrCall(templ_, {"lod":id_.lod_,  "x":id_.ix_, "y":id_.iy_, "sub": subId_,
                                                  "locx":locx_, "locy":locy_, "loclod":loclod_, 
                                                  "here_app_id": "abcde", "here_app_code":"12345"},
                                         this.processUrlFunction.bind(this, id2_, this.urlCounter_));

    this.urlCounter_++;

    skipBaseUrl_ = (url_.indexOf("://") != -1);

    if (skipBaseUrl_) {
        return url_;
    } else {
        return this.baseURL_ + url_;
    }
};

