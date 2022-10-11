import {createProgramFrom, makeBuffer, vertexAttribPoint} from "../webGlUtils/program-utils.js";
import {resizeCanvas} from "../webGlUtils/canvas-utils.js";

function main(canvasID) {
    let domCanvas = document.getElementById(canvasID);
    let gl = domCanvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGL2 Context not found");
        return;
    }

    resizeCanvas(domCanvas, window.devicePixelRatio);
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, domCanvas.width, domCanvas.height);

    const program = createProgramFrom(gl,
        "shaders/basic-vertex-shader.vert",
        "shaders/basic-fragment-shader.frag");

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    let positions = [
        -1, -1,
        -1, 1,
        1, -1,
        -1, 1,
        1, 1,
        1, -1
    ];
    makeBuffer(gl, new Float32Array(positions));

    // Create a vertex array object (attribute state)
    let vao = gl.createVertexArray();
    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    vertexAttribPoint(gl, positionAttributeLocation);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

main("canvas");