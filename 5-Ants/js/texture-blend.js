import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createTexture} from "./utils.js";

export const TextureBlend = {
    async init(gl, blendFactor, canvasWidth, canvasHeight) {
        this.gl = gl;
        this.sourceTextureUnit = 0;
        this.blendTextureUnit = 1;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        let textureBlendProgram = this.program = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-blend/texture-blend-fragment-shader.frag");

        gl.useProgram(textureBlendProgram);

        let targetTexture = this.targetTexture = createTexture(gl, canvasWidth, canvasHeight);
        let framebuffer = this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let uniformLocations =getUniformLocations(gl, textureBlendProgram,
            ["u_sourceTexture", "u_blendTexture", "u_blendFactor"]);

        gl.uniform1f(uniformLocations["u_blendFactor"], blendFactor);
        gl.uniform1i(uniformLocations["u_sourceTexture"], this.sourceTextureUnit);
        gl.uniform1i(uniformLocations["u_blendTexture"], this.blendTextureUnit);

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

        let attributeLocations = getAttributeLocations(gl, textureBlendProgram, ["a_position"]);

        gl.enableVertexAttribArray(attributeLocations["a_position"]);
        gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    },

    update(sourceTexture, blendTexture) {
        let gl = this.gl;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

        gl.activeTexture(gl.TEXTURE0 + this.sourceTextureUnit);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.activeTexture(gl.TEXTURE0 + this.blendTextureUnit);
        gl.bindTexture(gl.TEXTURE_2D, blendTexture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}