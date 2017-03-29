
var browser = null;
var map = null;
var renderer = null;
var pointTexture = null;
var clickCoords = null;

function startDemo() {
    browser = Melown.MapBrowser("map-div", {
        map : "https://demo.test.mlwn.se/public-maps/grand-ev/mapConfig.json",
        position : [ "obj", 1683559, 6604129, "float", 0, -13, -58, 0, 964, 90 ]
    });

    renderer = browser.getRenderer();

    //callback once is map config loaded
    browser.on("map-loaded", onMapLoaded);

    //add mouse down callback
    browser.getUI().getMapElement().on('mousedown', onMouseDown);

    loadTexture();
}

function loadTexture() {
    //load icon used for displaing hit point
    var pointImage = Melown.Http.imageFactory(
        "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",
        (function(){
            pointTexture = renderer.createTexture({ "source": pointImage });
        }).bind(this)
        );
}


function onMapLoaded() {
    map = browser.getMap();

    //add render slots
    //render slots are called during map render
    map.addRenderSlot("custom-points", onDrawPoints, true);
    map.moveRenderSlotAfter("after-map-render", "custom-points");
}

function onMouseDown(event) {
    if (!map) {
        return;
    }

    if (event.getMouseButton() == "left") {
        var coords = event.getMouseCoords();

        //get hit coords with fixed height
        clickCoords = map.getHitCoords(coords[0], coords[1], "fixed");
        
        //force map redraw to display hit point
        map.redraw();
    }
}

function onDrawPoints(renderChannel) {
    if (renderChannel == "hit") {
        return; //do render points in to the hit texture
    }

    if (clickCoords) { //draw hit point
       
        //conver hit coords to canvas coords
        coords = map.convertCoordsFromNavToCanvas(clickCoords, "fixed");

        renderer.drawImage({
            "rect" : [coords[0]-12, coords[1]-12, 24, 24],
            "texture" : pointTexture,
            "color" : [255,0,0,255],
            "depth" : coords[2],
            "depth-test" : false,
            "blend" : true
            });
    }
};



