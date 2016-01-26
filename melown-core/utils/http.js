Melown.Http = {};

Melown.Http.loadImageFormUrl = function(image_, url_) {
    if (!image_ instanceof Image || typeof url_ !== 'string') {
        return;
    }

    var parser_ = Melown.Url.parse(url_);
    if (parser_ === null) {
        return;
    }

    if (parser_['hostname'] !== '') {
        image_.crossOrigin = Melown.Url.isSameOrigin(url_) ? 
                            "use-credentials" : "anonymous";
    }
    image_.src = url_;
};

Melown.Http.imageFactory = function(url_, onload_, onerror_) {
    var image_ = new Image();
    image_.onerror = onerror_;
    image_.onload = onload_;

    image_.abort = function() {
        delete this.onerror;
        delete this.onload;
    }.bind(image_);

    Melown.Http.loadImageFormUrl(image_, url_);
    return image_;
};

Melown.Http.loadJson = function(url_, onload_, onerror_) {
    var onload_ = onload_ || function(){}
    var onerror_ = onerror_ || function(){}

    var xhr_ = new XMLHttpRequest();

    xhr_.onreadystatechange = function() {
        switch (xhr_.readyState) {
            case 0 : // unset
            case 1 : // opened
            case 2 : // headers received
            case 3 : // loading
            break;
            case 4 : // done
                // check status code
                if (xhr_.status === 404) {
                    var err_ = new Error('JSON file not found at ' + url_);
                    err_.code = 404
                    onerror_(err_);
                    break;
                }

                try {
                    var parsed_ = JSON.parse(xhr_.response);
                } catch(e) {
                    var err_ = new Error('Can\'t parse JSON file not found at ' 
                                         + url_ + '. Error: ' + e);
                    onerror_(err_);
                    break;
                }

                onload_(parsed_);
        }
    }   

    xhr_.open('GET', url_, true);
    xhr_.send('');

    return xhr_;
}
