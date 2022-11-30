import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {createProgramFrom} from "../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../webGlUtils/attribute-location-utils.js";
import {randrange} from "../webGlUtils/random-utils.js";

function createTexture(gl, textureWidth, textureHeight) {
    // create to render to
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureWidth, textureHeight, border, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

async function main(canvasId) {
    let canvas = document.getElementById(canvasId);
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("Could not retrieve the WebGl context.");
        return;
    }

    resizeCanvas(canvas, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const displayProgram = await createProgramFrom(gl,
        "./shaders/square-display/square-display-vertex-shader.vert",
        "./shaders/square-display/square-display-fragment-shader.frag");

    const textureBlurHorizontalProgram = await createProgramFrom(gl,
        "./shaders/texture-draw/texture-draw-vertex-shader.vert",
        "./shaders/texture-blur/texture-blur-horizontal-fragment-shader.frag");

    const textureBlurVerticalProgram = await createProgramFrom(gl,
        "./shaders/texture-draw/texture-draw-vertex-shader.vert",
        "./shaders/texture-blur/texture-blur-vertical-fragment-shader.frag");

    const textureDrawProgram = await createProgramFrom(gl,
        "./shaders/texture-draw/texture-draw-vertex-shader.vert",
        "./shaders/texture-draw/texture-draw-fragment-shader.frag");

    gl.useProgram(displayProgram);

    let displayVAO = gl.createVertexArray();
    gl.bindVertexArray(displayVAO);

    const nbSquare = 10_000, maxPointSize = 50.0;
    const textureWidth = canvas.width, textureHeight = canvas.height;

    let targetTexture1 = createTexture(gl, textureWidth, textureHeight);
    let frameBuffer1 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer1);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture1, 0);
    gl.viewport(0, 0, textureWidth, textureHeight);

    let displayAttributes = getAttributeLocations(gl, displayProgram,
        ["a_position", "a_color", "a_pointSize"]);

    function randomUnitData() {
        return [randrange(-1, 1), randrange(-1, 1),
            Math.random(), Math.random(), Math.random(),
            randrange(1, maxPointSize)];
    }

    let attributeData = new Float32Array(new Array(nbSquare).fill().flatMap(randomUnitData));

    const displayAttributeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, displayAttributeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, attributeData, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(displayAttributes["a_position"]);
    gl.enableVertexAttribArray(displayAttributes["a_color"]);
    gl.enableVertexAttribArray(displayAttributes["a_pointSize"]);

    gl.vertexAttribPointer(displayAttributes["a_position"], 2, gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(displayAttributes["a_color"], 3, gl.FLOAT, false, 6 * 4, 2 * 4);
    gl.vertexAttribPointer(displayAttributes["a_pointSize"], 1, gl.FLOAT, false, 6 * 4, 5 * 4);

    gl.drawArrays(gl.POINTS, 0, nbSquare);


    const textureBlurVAO = gl.createVertexArray();
    gl.bindVertexArray(textureBlurVAO);

    const textureBlurHorizontalUniforms = getUniformLocations(gl, textureBlurHorizontalProgram,
        ["u_textureWidth", "u_textureHeight", "u_texture"]);

    gl.useProgram(textureBlurHorizontalProgram);
    gl.uniform1i(textureBlurHorizontalUniforms["u_texture"], 0);
    gl.uniform1f(textureBlurHorizontalUniforms["u_textureWidth"], textureWidth);
    gl.uniform1f(textureBlurHorizontalUniforms["u_textureHeight"], textureHeight);

    const textureBlurVerticalUniforms = getUniformLocations(gl, textureBlurVerticalProgram,
        ["u_textureWidth", "u_textureHeight", "u_texture"]);


    gl.useProgram(textureBlurVerticalProgram);
    gl.uniform1i(textureBlurVerticalUniforms["u_texture"], 0);
    gl.uniform1f(textureBlurVerticalUniforms["u_textureWidth"], textureWidth);
    gl.uniform1f(textureBlurVerticalUniforms["u_textureHeight"], textureHeight);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        1, 1,
        -1, -1,
        1, 1,
        -1, 1,
    ]), gl.STATIC_DRAW);

    const positionAttributeLocation = 0;
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    let targetTexture2 = createTexture(gl, textureWidth, textureHeight);
    let frameBuffer2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer2);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture2, 0);


    gl.useProgram(textureDrawProgram);
    const textureDrawTextureUniformLocation = gl.getUniformLocation(textureDrawProgram, "u_texture");
    gl.useProgram(textureDrawProgram);
    gl.uniform1i(textureDrawTextureUniformLocation, 0);

    function drawTexture(texture) {
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function gaussianBlurPass() {
        gl.viewport(0, 0, textureWidth, textureHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer2);
        gl.bindTexture(gl.TEXTURE_2D, targetTexture1);

        gl.useProgram(textureBlurHorizontalProgram);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer1);
        gl.bindTexture(gl.TEXTURE_2D, targetTexture2);

        gl.useProgram(textureBlurVerticalProgram);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        drawTexture(targetTexture1);
    }

    document.addEventListener("keydown", gaussianBlurPass);

    drawTexture(targetTexture1);
}

await main("canvas");