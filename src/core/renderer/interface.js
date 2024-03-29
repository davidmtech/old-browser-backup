
import GpuTexture_ from './gpu/texture';
import GpuMesh_ from './gpu/mesh';
import GpuProgram_ from './gpu/program';

//get rid of compiler mess
var GpuTexture = GpuTexture_;
var GpuMesh = GpuMesh_;
var GpuProgram = GpuProgram_;


var RendererInterface = function(renderer) {
    this.renderer = renderer;
    this.gpu = renderer.gpu;
};


RendererInterface.prototype.clear = function(options) {
    if (options != null) {
        this.gpu.clear((options["clearDepth"] || true),
                        (options["clearColor"] || false),
                        (options["color"] || [255,255,255,255]),
                        ((options["depth"] != null) ? options["depth"] : 1.0) );
    }
    return this;    
};


RendererInterface.prototype.createState = function(options) {
    if (options == null || typeof options !== "object") {
        return this;    
    }
    
    var stateOptions = {
        blend : (options["blend"] != null) ? options["blend"] : false,
        stencil : (options["stencil"] != null) ? options["stencil"] : false,
        zoffset : (options["zoffset"] != null) ? options["zoffset"] : 0,
        zwrite : (options["zwrite"] != null) ? options["zwrite"] : true,
        ztest : (options["ztest"] != null) ? options["ztest"] : true,
        zequal : (options["zequal"] != null) ? options["zequal"] : true,
        culling : (options["culling"] != null) ? options["culling"] : true
    };

    return this.gpu.createState(stateOptions);
};


RendererInterface.prototype.setState = function(state) {
    if (state != null) {
        this.gpu.setState(state);
    }
    return this;    
};


RendererInterface.prototype.createTexture = function(options) {
    if (options == null || typeof options !== "object") {
        return null;
    }

    var source = options["source"];
    if (source == null) {
        return null;
    }

    var filter = options["filter"] || "linear";
    var repeat = options["repeat"] || false;

    if (source instanceof Uint8Array) {
        var width = options["width"];
        var height = options["height"];

        if (width && height) {
            var texture = new GpuTexture(this.gpu);
            texture.createFromData(width, height, source, filter, repeat);
            return texture;
        }
    }

    if (source instanceof Image) {
        var texture = new GpuTexture(this.gpu);
        texture.createFromImage(source, filter, repeat);
        return texture;
    }

    return null;
};


RendererInterface.prototype.removeTexture = function(texture) {
    if (texture) {
        texture.kill();
    }
    return this;    
};


RendererInterface.prototype.createMesh = function(options) {
    if (options == null || typeof options !== "object") {
        return null;
    }

    var data = {
        vertices : options["vertices"],
        uvs : options["uvs"],
        uvs2 : options["normals"],
        vertexSize : options["vertex-size"],
        uvSize : options["uv-size"],
        uv2Size : options["normal-size"] || 3,
        vertexAttr : options["vertex-attr"],
        uvAttr : options["uv-attr"],
        uv2Attr : options["normal-attr"],
        bbox : options["bbox"]
    };

    return new GpuMesh(this.gpu, data, 0, this.renderer.core);
};


RendererInterface.prototype.removeMesh = function(mesh) {
    if (mesh) {
        mesh.kill();
    }
    return this;    
};


RendererInterface.prototype.createShader = function(options) {
    if (options == null || typeof options !== "object") {
        return null;
    }

    var vertexShader = options["vertex-shader"];
    var fragmentShader = options["fragment-shader"];

    if (vertexShader != null && fragmentShader) {
        return new GpuProgram(this.gpu, vertexShader, fragmentShader);
    }
};


RendererInterface.prototype.removeResource = function(resource) {
    if (resource != null && resource.kill != null) {
        resource.kill();
    }
    return this;    
};


RendererInterface.prototype.addJob = function(options) {
    return this;    
};


RendererInterface.prototype.clearJobs = function(options) {
    return this;    
};


RendererInterface.prototype.drawMesh = function(options) {
    if (options == null || typeof options !== "object") {
        return this;    
    }

    if (!options["mesh"] == null || !options["shader-variables"]) {
        return this;    
    }

    var shaderAttributes = options["shader-attributes"];
    var vertexAttr = options["vertex"] || "aPosition";
    var uvAttr = options["uv"] || "aTexCoord";
    var uv2Attr = options["normal"] || "aNormal";

    var shaderVariables = options["shader-variables"];
    var shader = options["shader"] || "textured";

   
    var renderer = this.renderer; 
    var mesh = options["mesh"];
    var texture = options["texture"];
    var mv = renderer.camera.getModelviewMatrix();
    var proj = renderer.camera.getProjectionMatrix();
    var fogDensity = renderer.fogDensity;
    
    if (typeof shader === "string") {
        switch(shader) {
            case "hit":

                if (!shaderVariables["uMV"]) {
                    shaderVariables["uMV"] = ["mat4", mv];
                } 

                if (!shaderVariables["uProj"]) {
                    shaderVariables["uProj"] = ["mat4", proj];
                } 

                uvAttr = null;
                uv2Attr = null;
                texture = null;
                shader = renderer.progDepthTile;;
                break;

            case "shaded":
                uvAttr = null;

            case "textured":
            case "textured-and-shaded":

                if (!shaderVariables["uMV"]) {
                    shaderVariables["uMV"] = ["mat4", mv];
                } 

                if (!shaderVariables["uProj"]) {
                    shaderVariables["uProj"] = ["mat4", proj];
                } 

                if (!shaderVariables["uFogDensity"]) {
                    shaderVariables["uFogDensity"] = ["float", fogDensity];
                } 
            
                uv2Attr = (shader == "textured") ? null : "aNormal";
                shader = (shader == "textured") ? renderer.progTile : ((shader == "shaded") ? renderer.progShadedTile : renderer.progTShadedTile);
                break;
        }
    }

    var attributes = [vertexAttr];
    if (uvAttr){
        attributes.push(uvAttr);        
    } 
    if (uv2Attr){
        attributes.push(uv2Attr);        
    } 

    renderer.gpu.useProgram(shader, attributes);

    for (var key in shaderVariables) {
        var item = shaderVariables[key];
        
        if (item.length == 2) {
            switch(item[0]){
                case "floatArray":
                    shader.setFloatArray(key, item[1]);
                    break;
                case "float":
                    shader.setFloat(key, item[1]);
                    break;
                case "mat3":
                    shader.setMat3(key, item[1]);
                    break;
                case "mat4":
                    shader.setMat4(key, item[1]);
                    break;
                case "vec2":
                    shader.setVec2(key, item[1]);
                    break;
                case "vec3":
                    shader.setVec3(key, item[1]);
                    break;
                case "vec4":
                    shader.setVec4(key, item[1]);
                    break;
                case "sampler":
                    shader.setSampler(key, item[1]);
                    break;
            } 
        }
    }

    if (texture) {
        renderer.gpu.bindTexture(texture);
    }
    
    //mesh.draw(shader, vertexAttr, texture ? uvAttr : null, uv2Attr, null);
    mesh.draw(shader, vertexAttr, uvAttr, uv2Attr, null);
    return this;    
};


RendererInterface.prototype.drawImage = function(options) {
    if (options == null || typeof options !== "object") {
        return this;    
    }

    if (options["texture"] == null || options["rect"] == null) {
        return this;    
    }

    var rect = options["rect"];
    var color = options["color"] || [255,255,255,255];
    var depth = (options["depth"] != null) ? options["depth"] : 0;
    var depthTest = (options["depth-test"] != null) ? options["depth-test"] : false;
    var blend = (options["blend"] != null) ? options["blend"] : false;
    var writeDepth = (options["write-depth"] != null) ? options["write-depth"] : false;
    var useState = (options["use-state"] != null) ? options["use-state"] : false;
    color[0] *= 1.0/255;
    color[1] *= 1.0/255;
    color[2] *= 1.0/255;
    color[3] *= 1.0/255;

    this.renderer.draw.drawImage(rect[0], rect[1], rect[2], rect[3], options["texture"], color, depth, depthTest, blend, writeDepth, useState);
    return this;    
};


RendererInterface.prototype.drawBillboard = function(options) {
    if (options == null || typeof options !== "object") {
        return this;    
    }

    if (options["texture"] == null || options["mvp"] == null) {
        return this;    
    }

    var mvp = options["mvp"];
    var color = options["color"] || [255,255,255,255];
    var depthTest = (options["depth-test"] != null) ? options["depth-test"] : false;
    var blend = (options["blend"] != null) ? options["blend"] : false;
    var writeDepth = (options["write-depth"] != null) ? options["write-depth"] : false;
    var useState = (options["use-state"] != null) ? options["use-state"] : false;
    color[0] *= 1.0/255;
    color[1] *= 1.0/255;
    color[2] *= 1.0/255;
    color[3] *= 1.0/255;

    this.renderer.draw.drawBillboard(mvp, options["texture"], color, depthTest, blend, writeDepth, useState);
    return this;    
};


RendererInterface.prototype.drawLineString = function(options) {
    if (options == null || typeof options !== "object") {
        return this;    
    }

    if (options["points"] == null) {
        return this;    
    }

    var points = options["points"];
    var color = options["color"] || [255,255,255,255];
    var size = options["size"] || 2;
    var depthTest = (options["depth-test"] != null) ? options["depth-test"] : false;
    var blend = (options["blend"] != null) ? options["blend"] : false;
    var writeDepth = (options["write-depth"] != null) ? options["write-depth"] : false;
    var useState = (options["use-state"] != null) ? options["use-state"] : false;
    color[0] *= 1.0/255;
    color[1] *= 1.0/255;
    color[2] *= 1.0/255;
    color[3] *= 1.0/255;

    this.renderer.draw.drawLineString(points, size, color, depthTest, blend, writeDepth, useState);
    return this;    
};


RendererInterface.prototype.drawJobs = function(options) {
    return this;    
};


RendererInterface.prototype.drawBBox = function(options) {
    return this;    
};


RendererInterface.prototype.drawDebugText = function(options) {
    if (options == null || typeof options !== "object") {
        return this;    
    }

    var text = options["text"];
    var coords = options["coords"];

    if (!text || !coords) {
        return this;    
    }
    
    var color = options["color"] || [255,255,255,255];
    var size = options["size"] || 16;
    var depth = options["depth"];
    var useState = options["use-state"] || false;
    color[0] *= 1.0/255;
    color[1] *= 1.0/255;
    color[2] *= 1.0/255;
    color[3] *= 1.0/255;

    var lx = this.renderer.draw.getTextSize(size, text);

    this.renderer.draw.drawText(coords[0] - (lx * 0.5), coords[1], size, text, color, depth, useState);

    /*
    var depthTest = options["depth-test"] || false;
    var blend = options["blend"] || false;
    var writeDepth = options["write-depth"] || false;
    */

    return this;    
};


RendererInterface.prototype.saveScreenshot = function(output, filename, filetype) {
    return this.renderer.saveScreenshot(output, filename, filetype);
};


RendererInterface.prototype.getCanvasCoords = function(point, mvp) {
    return this.renderer.project2(point, mvp);
};


RendererInterface.prototype.getCanvasSize = function(point, mvp) {
    return this.renderer.curSize.slice();
};


RendererInterface.prototype.setConfigParams = function(params) {
    this.renderer.setConfigParams(params);
    return this;
};


RendererInterface.prototype.setConfigParam = function(key, value) {
    this.renderer.setConfigParam(key, value);
    return this;
};


RendererInterface.prototype.getConfigParam = function(key) {
    return this.renderer.getConfigParam(key, value);
};


export default RendererInterface;

/*
RendererInterface.prototype["clear"] = RendererInterface.prototype.clear;
RendererInterface.prototype["createState"] = RendererInterface.prototype.createState; 
RendererInterface.prototype["setState"] = RendererInterface.prototype.setState;
RendererInterface.prototype["createTexture"] = RendererInterface.prototype.createTexture; 
RendererInterface.prototype["removeTexture"] = RendererInterface.prototype.removeTexture; 
RendererInterface.prototype["createMesh"] = RendererInterface.prototype.createMesh;
RendererInterface.prototype["removeMesh"] = RendererInterface.prototype.removeMesh; 
RendererInterface.prototype["createshader"] = RendererInterface.prototype.createshader; 
RendererInterface.prototype["removeResource"] = RendererInterface.prototype.removeResource; 
RendererInterface.prototype["addJob"] = RendererInterface.prototype.addJob;
RendererInterface.prototype["clearJobs"] = RendererInterface.prototype.clearJobs; 
RendererInterface.prototype["drawMesh"] = RendererInterface.prototype.drawMesh;
RendererInterface.prototype["drawImage"] = RendererInterface.prototype.drawImage; 
RendererInterface.prototype["drawBillboard"] = RendererInterface.prototype.drawBillboard; 
RendererInterface.prototype["drawLineString"] = RendererInterface.prototype.drawLineString; 
RendererInterface.prototype["drawJobs"] = RendererInterface.prototype.drawJobs;
RendererInterface.prototype["drawBBox"] = RendererInterface.prototype.drawBBox; 
RendererInterface.prototype["drawDebugText"] = RendererInterface.prototype.drawDebugText; 
RendererInterface.prototype["getCanvasCoords"] = RendererInterface.prototype.getCanvasCoords; 
RendererInterface.prototype["getCanvasSize"] = RendererInterface.prototype.getCanvasSize;
RendererInterface.prototype["setConfigParams"] = RendererInterface.prototype.setConfigParams; 
RendererInterface.prototype["setConfigParam"] = RendererInterface.prototype.setConfigParam;
RendererInterface.prototype["getConfigParam"] = RendererInterface.prototype.getConfigParam; 
RendererInterface.prototype["saveScreenshot"] = RendererInterface.prototype.saveScreenshot;
*/