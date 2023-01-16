import {createProgramFrom} from "../webGlUtils/program-utils.js";
import {resizeCanvas} from "../webGlUtils/canvas-utils.js";

async function main() {
    let canvas = document.getElementById("canvas");
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGl context not found");
        return;
    }

    resizeCanvas(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    let program = await createProgramFrom(gl,
        "./shaders/vertex.vert",
        "./shaders/fragment.frag");

    gl.useProgram(program);

    let positionLocation = gl.getAttribLocation(program, "a_position");
    let colorLocation = gl.getAttribLocation(program, "a_color");
    let posFactorLocation = gl.getAttribLocation(program, "a_posFactor");

    let posFactorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posFactorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.1, 0.5, 1.0,
    ].reverse()), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(posFactorLocation);
    gl.vertexAttribPointer(posFactorLocation, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(posFactorLocation, 4);

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        1,0,0,
        0,1,0,
        0,0,1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(colorLocation, 4);


    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        1, 0,
        1, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 12);
}

await main()