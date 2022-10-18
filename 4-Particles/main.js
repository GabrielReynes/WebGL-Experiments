import {
    createComputeProgramFrom,
    createProgramFrom, dumpBoundBuffer,
    makeBuffer,
} from "../webGlUtils/program-utils.js";
import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {m3} from "../webGlUtils/math-utils.js";
import {getBufferSubDataAsync} from "../webGlUtils/fence-sync-utils.js";
import {setAsyncInterval} from "../webGlUtils/async-interval.js";

function randrange(start, end) {
    const uniform = Math.random();
    return start + (end - start) * uniform;
}

function main(canvasId, nbAgents) {
    const domCanvas = document.getElementById(canvasId);
    const gl = domCanvas.getContext("webgl2", {preserveDrawingBuffer: true});
    if (!gl) {
        console.error("WebGl2 context not found");
        return;
    }

    resizeCanvas(domCanvas, 1);
    gl.viewport(0, 0, domCanvas.width, domCanvas.height);
    let canvasToClipSpaceMatrix = m3.projection(domCanvas.width, domCanvas.height);

    let now = Date.now();

    // Create a vertex array object (attribute state)
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create and fill out a transform feedback
    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    let particleHandlerProgram = createComputeProgramFrom(gl,
        "./shaders/particle-handlers/particle-handler-vertex-shader.vert",
        "./shaders/particle-handlers/particle-handler-fragment-shader.frag",
        ["newPosition"]);

    gl.useProgram(particleHandlerProgram);

    const particleHandlerDeltaTimeUniformLocation = gl.getUniformLocation(particleHandlerProgram, "deltaTime");
    const particleHandlerDimensionsUniformLocation = gl.getUniformLocation(particleHandlerProgram, "canvasDimensions");

    gl.uniform2f(particleHandlerDimensionsUniformLocation, domCanvas.width, domCanvas.height);

    const particleHandlerPositionAttributeLocation = gl.getAttribLocation(particleHandlerProgram, "position");
    const particleHandlerVelocityAttributeLocation = gl.getAttribLocation(particleHandlerProgram, "velocity");

    let positions = new Float32Array(new Array(nbAgents).fill().flatMap(() => [randrange(0, domCanvas.width), randrange(0, domCanvas.height)]));
    let velocities = new Array(nbAgents).fill().flatMap(() => [randrange(-100, 100), randrange(-100, 100)]);

    let positionsBuffer = gl.createBuffer();
    let velocitiesBuffer = gl.createBuffer();

    let updatedPositionsBuffer = makeBuffer(gl, positions.length * 4, gl.DYNAMIC_READ);

    // buffer's we are writing to can not be bound else where
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  // updatedPositionsBuffer was still bound to ARRAY_BUFFER so unbind it

    let particleDisplayProgram = createProgramFrom(gl,
        "./shaders/particle-display/particle-display-vertex-shader.vert",
        "./shaders/particle-display/particle-display-fragment-shader.frag");

    gl.useProgram(particleDisplayProgram);

    const particleDisplayMatrixUniformLocation = gl.getUniformLocation(particleDisplayProgram, "u_matrix");
    const particleDisplayColorUniformLocation = gl.getUniformLocation(particleDisplayProgram, "u_color");

    gl.uniformMatrix3fv(particleDisplayMatrixUniformLocation, false, canvasToClipSpaceMatrix);
    gl.uniform4f(particleDisplayColorUniformLocation, 1, 0, 0, 1);

    const particleDisplayPositionAttributeLocation = gl.getUniformLocation(particleDisplayProgram, "a_position");
    setAsyncInterval(async function () {
        gl.useProgram(particleHandlerProgram);

        if (resizeCanvas(domCanvas, 1)) {
            gl.viewport(0, 0, domCanvas.width, domCanvas.height);
            canvasToClipSpaceMatrix = m3.projection(domCanvas.width, domCanvas.height);
            gl.uniformMatrix3fv(particleDisplayMatrixUniformLocation, false, canvasToClipSpaceMatrix);
        }

        let next = Date.now();
        let deltaTime = (next - now) * 1e-3;
        now = next;
        gl.uniform1f(particleHandlerDeltaTimeUniformLocation, deltaTime);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        dumpBoundBuffer(gl, particleHandlerPositionAttributeLocation, 2);

        gl.bindBuffer(gl.ARRAY_BUFFER, velocitiesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(velocities), gl.DYNAMIC_DRAW);
        dumpBoundBuffer(gl, particleHandlerVelocityAttributeLocation, 2);

        // bind the buffers to the transform feedback
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, updatedPositionsBuffer);

        // no need to call the fragment shader
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, positions.length >> 1);
        gl.endTransformFeedback();
        // turn on using fragment shaders again
        gl.disable(gl.RASTERIZER_DISCARD);

        // bind the buffers to the transform feedback
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

        await getBufferSubDataAsync(gl, gl.ARRAY_BUFFER, updatedPositionsBuffer, 0, positions);

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(particleDisplayProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, updatedPositionsBuffer);
        dumpBoundBuffer(gl, particleDisplayPositionAttributeLocation);

        gl.drawArrays(gl.POINTS, 0, positions.length >> 1);

    }, 1000 / 60);
}

// TODO Add wait on the fence before back reading READ-usage buffer (updatedPositionsBuffer)
main("canvas", 1_000);