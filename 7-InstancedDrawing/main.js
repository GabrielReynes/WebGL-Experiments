import {createShader} from "../webGlUtils/shader-utils.js";
import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {createProgramFrom} from "../webGlUtils/program-utils.js";
import {getAttributeLocations} from "../webGlUtils/attribute-location-utils.js";
import {m3} from "../webGlUtils/math-utils.js";

async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");

    resizeCanvas(gl.canvas, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const program = await createProgramFrom(gl,
        './shaders/simple-vertex-shader.vert',
        './shaders/simple-fragment-shader.frag');

    gl.useProgram(program);

    let projectionMatrixUniformLocation = gl.getUniformLocation(program, 'u_projectionMatrix');

    let attributesLocations = getAttributeLocations(gl, program, ['a_position', 'a_color', 'a_transformMatrix']);

    const WIDTH = 100, HEIGHT = 100;
    gl.uniformMatrix3fv(projectionMatrixUniformLocation, false, m3.projection(WIDTH, HEIGHT));

    let positions = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1,
    ]);

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributesLocations['a_position'], 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributesLocations['a_position']);

    let colors = new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ]);
    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributesLocations['a_color'], 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributesLocations['a_color']);
    gl.vertexAttribDivisor(attributesLocations['a_color'], 34);

    function randomTransformMatrix() {
        const maxScale = 10;
        let matrix = m3.translation(Math.random() * WIDTH, Math.random() * HEIGHT); // Translated
        matrix = m3.scale(matrix, Math.random() * maxScale, Math.random() * maxScale); // Scaled
        matrix = m3.translate(matrix, -0.5, -0.5); // Centered
        return matrix;
    }

    let transformMatrices = new Float32Array(new Array(100).fill().flatMap(randomTransformMatrix));
    let transformMatrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, transformMatrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, transformMatrices, gl.STATIC_DRAW);

    let transformMatrixLocation = attributesLocations['a_transformMatrix'];
    gl.vertexAttribPointer(transformMatrixLocation, 3, gl.FLOAT, false, 9 * 4, 0);
    gl.vertexAttribPointer(transformMatrixLocation + 1, 3, gl.FLOAT, false, 9 * 4, 3 * 4);
    gl.vertexAttribPointer(transformMatrixLocation + 2, 3, gl.FLOAT, false, 9 * 4, 6 * 4);

    gl.enableVertexAttribArray(transformMatrixLocation);
    gl.enableVertexAttribArray(transformMatrixLocation + 1);
    gl.enableVertexAttribArray(transformMatrixLocation + 2);

    gl.vertexAttribDivisor(transformMatrixLocation, 1);
    gl.vertexAttribDivisor(transformMatrixLocation + 1, 1);
    gl.vertexAttribDivisor(transformMatrixLocation + 2, 1);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 100);
}


main();