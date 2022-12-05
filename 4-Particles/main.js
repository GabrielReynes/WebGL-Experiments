import {
    createComputeProgramFrom,
    createProgramFrom,
} from "../webGlUtils/program-utils.js";
import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {m3} from "../webGlUtils/math-utils.js";
import {randrange} from "../webGlUtils/random-utils.js";
import {Color} from "../webGlUtils/color-utils.js";


async function main(canvasId, nbAgents) {
    const domCanvas = document.getElementById(canvasId);
    const gl = domCanvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGl2 context not found");
        return;
    }

    resizeCanvas(domCanvas, 1);
    gl.viewport(0, 0, domCanvas.width, domCanvas.height);
    let canvasToClipSpaceMatrix = m3.projection(domCanvas.width, domCanvas.height);

    let now = Date.now();

    let particleHandlerProgram = await createComputeProgramFrom(gl,
        "./shaders/particle-handlers/particle-handler-vertex-shader.vert",
        "./shaders/particle-handlers/particle-handler-fragment-shader.frag",
        ["newPosition"]);

    let particleDisplayProgram = await createProgramFrom(gl,
        "./shaders/particle-display/particle-display-vertex-shader.vert",
        "./shaders/particle-display/particle-display-fragment-shader.frag");

    gl.useProgram(particleHandlerProgram);

    const particleHandlerDeltaTimeUniformLocation = gl.getUniformLocation(particleHandlerProgram, "deltaTime");
    const particleHandlerDimensionsUniformLocation = gl.getUniformLocation(particleHandlerProgram, "canvasDimensions");
    gl.uniform2f(particleHandlerDimensionsUniformLocation, domCanvas.width, domCanvas.height);

    const particleHandlerPositionAttributeLocation = gl.getAttribLocation(particleHandlerProgram, "position");
    const particleHandlerVelocityAttributeLocation = gl.getAttribLocation(particleHandlerProgram, "velocity");

    function randomPosition() {
        return [randrange(0, domCanvas.width), randrange(0, domCanvas.height)];
    }

    function randomVelocity() {
        return [randrange(-100, 100), randrange(-100, 100)];
    }

    const inputPosition = new Float32Array(new Array(nbAgents).fill().flatMap(randomPosition));
    const inputVelocity = new Float32Array(new Array(nbAgents).fill().flatMap(randomVelocity));

    const velocityBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, inputVelocity, gl.STATIC_DRAW);

    function createVAOForBuffer(buffer) {
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, nbAgents * 2 * 4, gl.DYNAMIC_COPY);
        gl.vertexAttribPointer(particleHandlerPositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
        gl.vertexAttribPointer(particleHandlerVelocityAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(particleHandlerPositionAttributeLocation);
        gl.enableVertexAttribArray(particleHandlerVelocityAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vao;
    }

    let buffer1 = gl.createBuffer();
    let buffer2 = gl.createBuffer();

    let vao1 = createVAOForBuffer(buffer1);
    let vao2 = createVAOForBuffer(buffer2);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, inputPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.useProgram(particleDisplayProgram);

    const displayVAO = gl.createVertexArray();
    gl.bindVertexArray(displayVAO);

    const particleDisplayMatrixUniformLocation = gl.getUniformLocation(particleDisplayProgram, "u_matrix");
    const particleDisplayColorUniformLocation = gl.getUniformLocation(particleDisplayProgram, "u_color");
    gl.uniformMatrix3fv(particleDisplayMatrixUniformLocation, false, canvasToClipSpaceMatrix);
    gl.uniform4f(particleDisplayColorUniformLocation, ...Object.values(Color.green));

    const particleDisplayPositionAttributeLocation = gl.getUniformLocation(particleDisplayProgram, "a_position");

    let vao = vao1;
    let outputBuffer = buffer2;

    function animate() {
        requestAnimationFrame(animate)

        let resized = resizeCanvas(domCanvas, 1);
        if (resized) gl.viewport(0, 0, domCanvas.width, domCanvas.height);

        gl.useProgram(particleHandlerProgram);
        gl.bindVertexArray(vao);

        let next = Date.now();
        let deltaTime = (next - now) * 1e-3;
        now = next;
        gl.uniform1f(particleHandlerDeltaTimeUniformLocation, deltaTime);

        if (resized) gl.uniform2f(particleHandlerDimensionsUniformLocation, domCanvas.width, domCanvas.height);

        // bind the buffers to the transform feedback
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outputBuffer);
        // no need to call the fragment shader
        // gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, nbAgents);
        gl.endTransformFeedback();
        // turn on using fragment shaders again
        // gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);


        gl.useProgram(particleDisplayProgram);
        gl.bindVertexArray(displayVAO);

        if (resized) {
            canvasToClipSpaceMatrix = m3.projection(domCanvas.width, domCanvas.height);
            gl.uniformMatrix3fv(particleDisplayMatrixUniformLocation, false, canvasToClipSpaceMatrix);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, outputBuffer);
        gl.enableVertexAttribArray(particleDisplayPositionAttributeLocation);
        gl.vertexAttribPointer(particleDisplayPositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.drawArrays(gl.POINTS, 0, nbAgents);

        if (vao === vao1) {
            vao = vao2;
            outputBuffer = buffer1;
        } else {
            vao = vao1;
            outputBuffer = buffer2;
        }
    }

    animate();
}

await main("canvas", 1e5);