import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {m3, vector2} from "../webGlUtils/math-utils.js";
import {createProgramFrom} from "../webGlUtils/program-utils.js";
import {SquareVertexArray} from "./js/square-vertex-array.js";
import {getAttributeLocations, getUniformLocations} from "../webGlUtils/attribute-location-utils.js";

async function main() {
    const domCanvas = document.getElementById("canvas");
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
    let vao = gl.createVertexArray();
    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

    const program = await createProgramFrom(gl,
        'shaders/square-display/square-display-vertex-shader.vert',
        'shaders/square-display/square-display-fragment-shader.frag');

    const uniformLocations = getUniformLocations(gl, program, ['u_matrix', 'u_color']);
    const attributeLocations = getAttributeLocations(gl, program, ['i_position']);


    const squareVertexArray = SquareVertexArray.create(gl,
        vector2.zero(), vector2.one(), 0,
        uniformLocations['u_matrix'], uniformLocations['u_color'],
        attributeLocations['i_position']);

    SquareVertexArray.draw(squareVertexArray, gl);
}

await main();

