import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {
    createComputeProgramFrom,
    makeBuffer, makeReadableVertexBuffer,
} from "../webGlUtils/program-utils.js";

async function main(canvasID) {
    let domCanvas = document.getElementById(canvasID);
    let gl = domCanvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGL2 Context not found");
        return;
    }

    resizeCanvas(domCanvas, window.devicePixelRatio);
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, domCanvas.width, domCanvas.height);
    
    const program = await createComputeProgramFrom(gl,
        "shaders/math-operations-vertex-shader.vert",
        "shaders/math-operation-fragment-shader.frag",
        ["sum", "difference", "product"]);

    gl.useProgram(program);

    const aLoc = gl.getAttribLocation(program, 'a');
    const bLoc = gl.getAttribLocation(program, 'b');

    // Create a vertex array object (attribute state)
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    const a = [1, 2, 3, 4, 5, 7];
    const b = [3, 6, 9, 12, 15, 18];

    // put data in buffers
    const aBuffer = makeReadableVertexBuffer(gl, new Float32Array(a), aLoc,1);
    const bBuffer = makeReadableVertexBuffer(gl, new Float32Array(b), bLoc, 1);

    // Create and fill out a transform feedback
    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    // make buffers for output (size is a.length * 4 because the values are encoded in 32 bits = 4 bytes)
    const sumBuffer = makeBuffer(gl, a.length * 4);
    const differenceBuffer = makeBuffer(gl, a.length * 4);
    const productBuffer = makeBuffer(gl, a.length * 4);

    // bind the buffers to the transform feedback
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);

    // buffer's we are writing to can not be bound else where
    gl.bindBuffer(gl.ARRAY_BUFFER, null);  // productBuffer was still bound to ARRAY_BUFFER so unbind it

    // no need to call the fragment shader
    gl.enable(gl.RASTERIZER_DISCARD);

    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, a.length);
    gl.endTransformFeedback();
    
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    // turn on using fragment shaders again
    gl.disable(gl.RASTERIZER_DISCARD);

    log(`a: ${a}`);
    log(`b: ${b}`);

    printResults(gl, sumBuffer, 'sums');
    printResults(gl, differenceBuffer, 'differences');
    printResults(gl, productBuffer, 'products');

    function printResults(gl, buffer, label) {
        const results = new Float32Array(a.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(
            gl.ARRAY_BUFFER,
            0,    // byte offset into GPU buffer,
            results,
        );
        // print the results
        log(`${label}: ${results}`);
    }
}

function log(...args) {
    const elem = document.createElement('pre');
    elem.textContent = args.join(' ');
    document.body.appendChild(elem);
}

await main("small-canvas");