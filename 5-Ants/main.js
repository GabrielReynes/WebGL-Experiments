import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {AntHandling} from "./js/ant-handling.js";
import {AntDisplay} from "./js/ant-display.js";
import {TextureDisplay} from "./js/texture-display.js";
import {Color} from "../webGlUtils/color-utils.js";
import {TextureBlur} from "./js/texture-blur.js";
import {TextureDecay} from "./js/texture-decay.js";

const ANT_SPEED = 100.0;
const DECAY_FACTOR = 0.9;
const BLUR_PASS = 1;

async function main(canvasId, nbAgents, targetTextureWidth, targetTextureHeight) {
    let canvas = document.getElementById(canvasId);
    let gl = canvas.getContext("webgl2");

    if (!gl) {
        console.error("WebGl2 Context could not be retrieve from th page's Canvas");
        return;
    }

    resizeCanvas(canvas, 2);

    await AntHandling.init(gl, nbAgents, ANT_SPEED, canvas.width, canvas.height);
    await AntDisplay.init(gl, nbAgents, AntHandling.buffer2, AntHandling.buffer1, canvas.width, canvas.height, Color.red);
    await TextureBlur.init(gl, canvas.width, canvas.height);
    await TextureDecay.init(gl, DECAY_FACTOR, canvas.width, canvas.height, AntDisplay.targetTexture);
    await TextureDisplay.init(gl);

    let previousTimestamp;
    function animate(timestamp) {
        requestAnimationFrame(animate);
        if (!previousTimestamp) {
            previousTimestamp = timestamp;
            return;
        }
        let deltaTime = (timestamp - previousTimestamp) * 1e-3;
        previousTimestamp = timestamp;

        const time = timestamp * 1e-3 | 0

        AntHandling.update(time, deltaTime, AntDisplay.targetTexture);
        AntDisplay.update();
        TextureBlur.update(AntDisplay.targetTexture, BLUR_PASS);
        TextureDecay.update(TextureBlur.targetTexture, deltaTime);
        TextureDisplay.update(TextureDecay.targetTexture);
    }

    animate()
}

await main("canvas", 1e5);