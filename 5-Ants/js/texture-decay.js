import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createTexture} from "./utils.js";

export const TextureDecay = {
    async init(gl, decayFactor, canvasWidth, canvasHeight, targetTexture) {
        this.gl = gl;
        this.textureUnit = 0;

        let textureDecayProgram = this.program = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-decay/texture-decay-fragment-shader.frag");

        gl.useProgram(textureDecayProgram);

        let uniformLocations = this.uniformLoactions =
            getUniformLocations(gl, textureDecayProgram, ["u_texture", "u_decayFactor", "u_deltaTime"]);
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

        this.targetTexture = targetTexture;
        this.framebuffer = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.targetTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
    },
    update(inputTexture, deltaTime) {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.uniform1f(this.uniformLoactions["u_deltaTime"], deltaTime);

        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
};