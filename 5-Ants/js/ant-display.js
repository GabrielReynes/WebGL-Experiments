import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {Color} from "../../webGlUtils/color-utils.js";
import {m3} from "../../webGlUtils/math-utils.js";
import {createTexture} from "./utils.js";

export const AntDisplay = {
    async init(gl, nbAnt, inputBuffer1, inputBuffer2, canvasWidth, canvasHeight, antColor = Color.white) {
        this.gl = gl;
        this.indicesCount = nbAnt;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        let antiDisplayProgram = this.program = await createProgramFrom(gl,
            "./shaders/ant-display/ant-display-vertex-shader.vert",
            "./shaders/ant-display/ant-display-fragment-shader.frag");

        gl.useProgram(antiDisplayProgram);

        let targetTexture = this.targetTexture = createTexture(gl, canvasWidth, canvasHeight);

        let framebuffer = this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let uniformLocations = getUniformLocations(gl, antiDisplayProgram, ["u_matrix", "u_color"]);
        gl.uniform4f(uniformLocations["u_color"], ...Object.values(antColor));
        gl.uniformMatrix3fv(uniformLocations["u_matrix"], false, m3.projection(canvasWidth, canvasHeight));

        let attributeLocations = getAttributeLocations(gl, antiDisplayProgram, ["a_position"]);

        function createVAOForBuffer(buffer) {
            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            gl.enableVertexAttribArray(attributeLocations["a_position"]);
            // This buffer also contains values only used for the AntHandling module (a_angleInRad)
            // We should take this into account when defining the attribution stride.
            gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 3 * 4, 0);

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

        gl.drawArrays(gl.POINTS, 0, this.indicesCount);

        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.vao = this.vao === this.vao1 ? this.vao2 : this.vao1;
    },
};