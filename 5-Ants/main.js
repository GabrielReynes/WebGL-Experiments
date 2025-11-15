import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {AntHandling} from "./js/ant-handling.js";
import {AntDisplay} from "./js/ant-display.js";
import {TextureDisplay} from "./js/texture-display.js";
import {TextureBlur} from "./js/texture-blur.js";
import {TextureDecay} from "./js/texture-decay.js";
import {TextureBlend} from "./js/texture-blend.js";
import {Color} from "../webGlUtils/color-utils.js";


const ANT_PARAMS = {
    speed: 20.0, // pixel per sec
    rotationSpeed: 300, // degrees per sec
    senseSpread: 35, // degrees
    senseLength: 20, // pixels
    senseSize: 2, // pixels,
};
const DECAY_FACTOR = 0.3;
const BLUR_PASS = 3;
const BLUR_FACTOR = 0.1;
const DEVICE_PIXEL_RATIO = window.devicePixelRatio;
const INIT_RADIUS = 250;
const NB_AGENT = 2e5;

const COLORS = [
    Color.red,
    Color.cyan,
    Color.green,
    Color.yellow,
    Color.purple,
    Color.orange,
    Color.brown,
    Color.pink,
    Color.lime,
    Color.teal,
]

async function main(canvasId) {
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


    await AntHandling.init(gl, NB_AGENT, ANT_PARAMS, TEXTURE_WIDTH, TEXTURE_HEIGHT, colorData, INIT_RADIUS);
    await AntDisplay.init(gl, NB_AGENT, AntHandling.buffer2, AntHandling.buffer1, TEXTURE_WIDTH, TEXTURE_HEIGHT, colorData);
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
        deltaTime = Math.min(deltaTime, 0.033);
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

await main("canvas");