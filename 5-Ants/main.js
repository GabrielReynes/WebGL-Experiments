import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {AntHandling} from "./js/ant-handling.js";
import {AntDisplay} from "./js/ant-display.js";
import {TextureDisplay} from "./js/texture-display.js";
import {TextureBlur} from "./js/texture-blur.js";
import {TextureDecay} from "./js/texture-decay.js";
import {TextureBlend} from "./js/texture-blend.js";
import {Color} from "../webGlUtils/color-utils.js";

const ANT_SPEED = 100.0;

const ANT_PARAMS = {
    speed: 75.0 * 3, // pixel per sec
    rotationSpeed: 360*2, // degrees per sec
    senseSpread: 25, // degrees
    senseLength: 100, // pixels
    senseSize: 2, // pixels,
};
const DECAY_FACTOR = 0.5;
const BLUR_PASS = 1;
const BLUR_FACTOR = 0.1;
const DEVICE_PIXEL_RATIO = window.devicePixelRatio;
const INIT_RADIUS = 250;

const COLORS = [
    Color.red,
    Color.cyan,
]

async function main(canvasId, nbAgents, targetTextureWidth, targetTextureHeight) {
    let canvas = document.getElementById(canvasId);
    let gl = canvas.getContext("webgl2");

    if (!gl) {
        console.error("WebGl2 Context could not be retrieve from th page's Canvas");
        return;
    }

    resizeCanvas(canvas, DEVICE_PIXEL_RATIO);
    let TEXTURE_WIDTH = canvas.width;
    let TEXTURE_HEIGHT = canvas.height;

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(COLORS.flatMap(c => [c.r, c.g, c.b])), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    let colorData = {
        buffer: colorBuffer,
        length: COLORS.length
    }


    await AntHandling.init(gl, nbAgents, ANT_PARAMS, TEXTURE_WIDTH, TEXTURE_HEIGHT, colorData, INIT_RADIUS);
    await AntDisplay.init(gl, nbAgents, AntHandling.buffer2, AntHandling.buffer1, TEXTURE_WIDTH, TEXTURE_HEIGHT, colorData);
    await TextureBlur.init(gl, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDecay.init(gl, DECAY_FACTOR, TEXTURE_WIDTH, TEXTURE_HEIGHT, AntDisplay.targetTexture);
    await TextureDisplay.init(gl);
    await TextureBlend.init(gl, BLUR_FACTOR, TEXTURE_WIDTH, TEXTURE_HEIGHT);

    let previousTimestamp;

    function animate(timestamp) {
        requestAnimationFrame(animate);
        if (!previousTimestamp) {
            previousTimestamp = timestamp;
            return;
        }
        let deltaTime = (timestamp - previousTimestamp) * 1e-3;
        previousTimestamp = timestamp;

        const time = timestamp * 1e-3 | 0;

        gl.clear(gl.COLOR_BUFFER_BIT);

        AntHandling.update(time, deltaTime, AntDisplay.targetTexture);
        AntDisplay.update();
        TextureBlur.update(AntDisplay.targetTexture, BLUR_PASS);
        TextureBlend.update(AntDisplay.targetTexture, TextureBlur.targetTexture);
        TextureDecay.update(TextureBlend.targetTexture, deltaTime);
        TextureDisplay.update(TextureDecay.targetTexture);
    }

    animate();
}

await main("canvas", 1e5);