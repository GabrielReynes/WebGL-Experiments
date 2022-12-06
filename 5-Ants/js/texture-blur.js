import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createTexture} from "./utils.js";

export const TextureBlur = {
    async init(gl, canvasWidth, canvasHeight) {
        this.gl = gl;
        this.textureUnit = 0;

        let textureBlurHorizontalProgram = this.programHorizontal = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-blur/texture-blur-horizontal-fragment-shader.frag");

        let textureBlurVerticalProgram = this.programVertical = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-blur/texture-blur-vertical-fragment-shader.frag");


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

        let programs = [textureBlurHorizontalProgram, textureBlurVerticalProgram];
        let vaos = [this.vao1, this.vao2] = [gl.createVertexArray(), gl.createVertexArray()];
        for (let i = 0; i < 2; i++) {
            let program = programs[i];
            let vao = vaos[i];
            gl.useProgram(program);
            gl.bindVertexArray(vao);

            let uniformLocations = getUniformLocations(gl, program, ["u_texture", "u_textureWidth", "u_textureHeight"]);
            gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);
            gl.uniform1f(uniformLocations["u_textureWidth"], canvasWidth);
            gl.uniform1f(uniformLocations["u_textureHeight"], canvasHeight);

            let attributeLocations = getAttributeLocations(gl, program, ["a_position"]);
            gl.enableVertexAttribArray(attributeLocations["a_position"]);
            gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);
        }

        this.intermediateTexture = createTexture(gl, canvasWidth, canvasHeight);
        this.targetTexture = createTexture(gl, canvasWidth, canvasHeight);

        function createFramebufferForTexture(texture) {
            let framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return framebuffer;
        }

        this.intermediateFramebuffer = createFramebufferForTexture(this.intermediateTexture);
        this.outputFramebuffer = createFramebufferForTexture(this.targetTexture);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    },

    update(texture, nbPass) {
        const gl = this.gl;

        let inputTexture = texture;
        for (let i = 0; i < nbPass; i++) {
            gl.useProgram(this.programHorizontal);
            gl.bindVertexArray(this.vao1);

            gl.activeTexture(gl.TEXTURE0 + this.textureUnit)
            gl.bindTexture(gl.TEXTURE_2D, inputTexture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.intermediateFramebuffer);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.useProgram(this.programVertical);
            gl.bindVertexArray(this.vao2);

            gl.bindTexture(gl.TEXTURE_2D, this.intermediateTexture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.outputFramebuffer);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            inputTexture = this.targetTexture
        }

        gl.bindVertexArray(null);
    },
};