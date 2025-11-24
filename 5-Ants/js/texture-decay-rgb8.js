import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createTexture} from "./utils.js";

export const TextureDecayRGB8 = {
    async init(gl, decayFactor, canvasWidth, canvasHeight) {
        this.gl = gl;
        this.textureUnit = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        let textureDecayProgram = this.program = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-decay/texture-decay-fragment-shader.frag");

        gl.useProgram(textureDecayProgram);

        let uniformLocations = this.uniformLocations =
            getUniformLocations(gl, textureDecayProgram, ["u_texture", "u_decayFactor"]);
        gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);
        gl.uniform1f(uniformLocations["u_decayFactor"], decayFactor);

        let attributeLocations = getAttributeLocations(gl, textureDecayProgram, ["a_position"]);

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

        // Create RGB8 texture (half resolution)
        let rgb8Width = Math.floor(canvasWidth * 0.5);
        let rgb8Height = Math.floor(canvasHeight * 0.5);
        this.targetTexture = createTexture(gl, rgb8Width, rgb8Height);
        this.framebuffer = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.targetTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
    },
    update(inputTexture, outputFramebuffer) {
        const gl = this.gl;
        
        // CRITICAL: Bind the input texture FIRST, before binding the framebuffer
        // This prevents feedback loop errors when the texture might be attached to a framebuffer
        gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        
        gl.useProgram(this.program);

        gl.bindVertexArray(this.vao);
        // Use provided framebuffer if available, otherwise use our own
        let fb = outputFramebuffer || this.framebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, Math.floor(this.canvasWidth * 0.5), Math.floor(this.canvasHeight * 0.5));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    
    setDecayFactor(decayFactor) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1f(this.uniformLocations["u_decayFactor"], decayFactor);
    },
};

