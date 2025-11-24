import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";

export const TextureDisplay = {
    async init(gl, backgroundColor) {
        this.gl = gl;
        this.textureUnit = 0;
        
        // Get canvas dimensions for viewport
        const canvas = gl.canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;

        let textureDisplayProgram = this.program = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-draw/texture-draw-fragment-shader.frag");

        gl.useProgram(textureDisplayProgram);

        let uniformLocations = getUniformLocations(gl, textureDisplayProgram, ["u_texture", "u_backgroundColor"]);
        gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);
        gl.uniform4f(uniformLocations["u_backgroundColor"], backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
        this.uniformLocations = uniformLocations;
        this.backgroundColor = backgroundColor;  // Store for clearing

        let attributeLocations = getAttributeLocations(gl, textureDisplayProgram, ["a_position"]);

        let vao = this.vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(attributeLocations["a_position"]);
        gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    },
    update(inputTexture) {
        const gl = this.gl;
        gl.useProgram(this.program);

        // Clear to background color before drawing (ensures background shows through)
        gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindVertexArray(this.vao);
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Disable blending for final display (we want to replace, not blend)
        gl.disable(gl.BLEND);
        
        gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    },
    
    setBackgroundColor(backgroundColor) {
        const gl = this.gl;
        this.backgroundColor = backgroundColor;
        gl.useProgram(this.program);
        gl.uniform4f(this.uniformLocations["u_backgroundColor"], backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
        gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
    },
};