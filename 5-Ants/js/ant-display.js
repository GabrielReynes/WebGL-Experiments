import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {m3} from "../../webGlUtils/math-utils.js";
import {createFloatTexture} from "./utils.js";

export const AntDisplay = {
    async init(gl, nbAnt, inputBuffer1, inputBuffer2, canvasWidth, canvasHeight, colorData) {
        this.gl = gl;
        this.indicesCount = nbAnt;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        let antiDisplayProgram = this.program = await createProgramFrom(gl,
            "./shaders/ant-display/ant-display-vertex-shader.vert",
            "./shaders/ant-display/ant-display-fragment-shader.frag");

        gl.useProgram(antiDisplayProgram);

        // Use floating-point texture for HDR color accumulation
        let targetTexture = this.targetTexture = createFloatTexture(gl, canvasWidth, canvasHeight);

        let framebuffer = this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

        // Check for EXT_float_blend extension (required for blending with floating-point textures)
        const floatBlendExt = gl.getExtension('EXT_float_blend');
        if (!floatBlendExt) {
            console.warn('EXT_float_blend extension not available. Blending with floating-point textures may not work.');
        }

        // Enable additive blending for color accumulation
        // Note: This requires EXT_float_blend extension for floating-point textures
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);

        // Clear to black (0,0,0,0) for additive blending
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let uniformLocations = getUniformLocations(gl, antiDisplayProgram, ["u_matrix"]);
        gl.uniformMatrix3fv(uniformLocations["u_matrix"], false, m3.projection(canvasWidth, canvasHeight));

        let attributeLocations = getAttributeLocations(gl, antiDisplayProgram, ["a_position", "a_color"]);

        function createVAOForBuffer(buffer) {
            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            gl.enableVertexAttribArray(attributeLocations["a_position"]);
            // This buffer also contains values only used for the AntHandling module (a_angleInRad)
            // We should take this into account when defining the attribution stride.
            gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 3 * 4, 0);
            gl.vertexAttribDivisor(attributeLocations["a_position"], 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorData.buffer);

            gl.enableVertexAttribArray(attributeLocations["a_color"]);
            gl.vertexAttribPointer(attributeLocations["a_color"], 3, gl.FLOAT, false, 0, 0);
            gl.vertexAttribDivisor(attributeLocations["a_color"], Math.ceil(nbAnt / colorData.length));

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindVertexArray(null);

            return vao;
        }

        this.vao1 = createVAOForBuffer(inputBuffer1);
        this.vao2 = createVAOForBuffer(inputBuffer2);

        this.vao = this.vao1;
    },

    update() {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

        // Clear to black for additive blending
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Ensure additive blending is enabled
        // Note: EXT_float_blend extension should be checked in init()
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);

        gl.drawArraysInstanced(gl.POINTS, 0, 1, this.indicesCount);

        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.vao = this.vao === this.vao1 ? this.vao2 : this.vao1;
    },
};