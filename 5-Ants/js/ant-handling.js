import {createComputeProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {randrange} from "../../webGlUtils/random-utils.js";
import {degToRad} from "../../webGlUtils/math-utils.js";

function createAttributeBuffer(nbAgent, canvasWidth, canvasHeight) {
    function randomUnitData() {
        return [
            randrange(0, canvasWidth), randrange(0, canvasHeight), // Position
            randrange(0, 2 * Math.PI), // Angle In Radians
        ];
    }

    return new Float32Array(new Array(nbAgent).fill().flatMap(randomUnitData));
}

export const AntHandling = {
    async init(gl, nbAnt, antSpeed, canvasWidth, canvasHeight, colorBuffer) {
        this.gl = gl;
        this.indicesCount = nbAnt;
        this.textureUnit = 0;

        let antHandlerProgram = this.program = await createComputeProgramFrom(gl,
            "./shaders/ant-handlers/ant-handler-vertex-shader.vert",
            "./shaders/ant-handlers/ant-handler-fragment-shader.frag",
            ["o_position", "o_angleInRad"], gl.INTERLEAVED_ATTRIBS);

        gl.useProgram(antHandlerProgram);
        let uniformLocations = this.uniformLocations = getUniformLocations(gl, antHandlerProgram,
            ["u_time", "u_deltaTime", "u_texture", "u_canvasDimensions",
                "u_antSpeed", "u_rotationSpeed", "u_senseLength", "u_senseSpread"]);

        gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);
        gl.uniform2f(uniformLocations["u_canvasDimensions"], canvasWidth, canvasHeight);
        gl.uniform1f(uniformLocations["u_antSpeed"], 100);
        gl.uniform1f(uniformLocations["u_senseSpread"], 35 * degToRad);
        gl.uniform1f(uniformLocations["u_senseLength"], 200);
        gl.uniform1f(uniformLocations["u_rotationSpeed"], 180 * degToRad);


        // We need two buffers to alternate between input buffer and output buffer;
        let buffer1 = this.buffer1 = gl.createBuffer();
        let buffer2 = this.buffer2 = gl.createBuffer();

        let attributeLocations = getAttributeLocations(gl, antHandlerProgram, ["a_position", "a_angleInRad", "a_color"]);

        function createVAOForBuffer(buffer) {
            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, createAttributeBuffer(nbAnt, canvasWidth, canvasHeight), gl.DYNAMIC_COPY);

            gl.enableVertexAttribArray(attributeLocations["a_position"]);
            gl.enableVertexAttribArray(attributeLocations["a_angleInRad"]);

            gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 3 * 4, 0);
            gl.vertexAttribDivisor(attributeLocations["a_position"], 1)
            gl.vertexAttribPointer(attributeLocations["a_angleInRad"], 1, gl.FLOAT, false, 3 * 4, 2 * 4);
            gl.vertexAttribDivisor(attributeLocations["a_angleInRad"], 1)

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

            gl.enableVertexAttribArray(attributeLocations["a_color"]);
            gl.vertexAttribPointer(attributeLocations["a_color"], 3, gl.FLOAT, false, 0, 0);
            gl.vertexAttribDivisor(attributeLocations["a_color"], Math.ceil(nbAnt / 6))

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            return vao;
        }

        this.vao1 = createVAOForBuffer(buffer1);
        this.vao2 = createVAOForBuffer(buffer2);

        this.vao = this.vao1;
        this.outputBuffer = buffer2;

        gl.bindVertexArray(null);
    },

    update(time, deltaTime, inputTexture) {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.bindVertexArray(this.vao);

        gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);

        gl.uniform1ui(this.uniformLocations["u_time"], time);
        gl.uniform1f(this.uniformLocations["u_deltaTime"], deltaTime);

        // bind the buffers to the transform feedback
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.outputBuffer);
        // no need to call the fragment shader
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArraysInstanced(gl.POINTS, 0, 1, this.indicesCount);
        gl.endTransformFeedback();
        // turn on using fragment shaders again
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

        gl.bindVertexArray(null);

        if (this.vao === this.vao1) {
            this.vao = this.vao2;
            this.outputBuffer = this.buffer1;
        } else {
            this.vao = this.vao1;
            this.outputBuffer = this.buffer2;
        }
    },
};