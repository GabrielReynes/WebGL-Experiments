import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createFloatTexture} from "./utils.js";

export const TextureThreshold = {
    async init(gl, threshold, canvasWidth, canvasHeight) {
        this.gl = gl;
        this.textureUnit = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        let textureThresholdProgram = this.program = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-threshold/texture-threshold-fragment-shader.frag");

        gl.useProgram(textureThresholdProgram);

        let targetTexture = this.targetTexture = createFloatTexture(gl, canvasWidth, canvasHeight);
        let framebuffer = this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let uniformLocations = getUniformLocations(gl, textureThresholdProgram,
            ["u_texture", "u_threshold"]);

        gl.uniform1f(uniformLocations["u_threshold"], threshold);
        gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);
        this.uniformLocations = uniformLocations;

        let vao = this.vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        let attributeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1,
        ]), gl.STATIC_DRAW);

        let attributeLocations = getAttributeLocations(gl, textureThresholdProgram, ["a_position"]);

        gl.enableVertexAttribArray(attributeLocations["a_position"]);
        gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },

    update(inputTexture) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

        gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
};


