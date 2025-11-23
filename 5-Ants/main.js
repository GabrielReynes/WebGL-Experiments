import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {AntHandling} from "./js/ant-handling.js";
import {AntDisplay} from "./js/ant-display.js";
import {TextureDisplay} from "./js/texture-display.js";
import {TextureBlur} from "./js/texture-blur.js";
import {TextureDecay} from "./js/texture-decay.js";
import {TextureThreshold} from "./js/texture-threshold.js";
import {TextureMerge} from "./js/texture-merge.js";
import {TextureNormalize} from "./js/texture-normalize.js";
import {Color} from "../webGlUtils/color-utils.js";


const ANT_PARAMS = {
    speed: 40.0, // pixel per sec
    rotationSpeed: 300, // degrees per sec
    senseSpread: 30, // degrees
    senseLength: 20, // pixels
    senseSize: 1, // pixels,
};
const DECAY_FACTOR = 0.4;
const SATURATION_THRESHOLD = 0.0;  // Lowered to allow more bloom (was 1.0)
const BLOOM_INTENSITY = 0.05;  // Multiplier for bloom effect (higher = more bloom)
const NUM_BLUR_SCALES = 8  // Number of blur/downscale passes (1x, 0.5x, 0.25x, 0.125x, etc.)
const DEVICE_PIXEL_RATIO = window.devicePixelRatio;
const INIT_RADIUS = 250;
const NB_AGENT = 4e5;
const BACKGROUND_COLOR = Color.create(25/255, 26/255, 27/255);

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
    let gl = canvas.getContext("webgl2", { alpha: false });

    if (!gl) {
        console.error("WebGl2 Context could not be retrieve from th page's Canvas");
        return;
    }

    // Check for required WebGL extensions
    const colorBufferHalfFloatExt = gl.getExtension('EXT_color_buffer_half_float');
    const colorBufferFloatExt = gl.getExtension('EXT_color_buffer_float');
    const floatBlendExt = gl.getExtension('EXT_float_blend');
    
    if (!colorBufferHalfFloatExt && !colorBufferFloatExt) {
        console.error('No floating-point color buffer extensions available. EXT_color_buffer_half_float or EXT_color_buffer_float is required.');
    }
    if (!floatBlendExt) {
        console.error('EXT_float_blend extension is required but not available. Blending with floating-point textures will not work.');
    }

    // Set the background color
    gl.clearColor(BACKGROUND_COLOR.r, BACKGROUND_COLOR.g, BACKGROUND_COLOR.b, BACKGROUND_COLOR.a);

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
    await TextureThreshold.init(gl, SATURATION_THRESHOLD, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureBlur.init(gl, NUM_BLUR_SCALES, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureMerge.init(gl, BLOOM_INTENSITY, NUM_BLUR_SCALES, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDecay.init(gl, DECAY_FACTOR, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureNormalize.init(gl, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDisplay.init(gl, BACKGROUND_COLOR);

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

        // Normalize the decayed texture to preserve color information in saturated areas
        TextureNormalize.update(TextureDecay.targetTexture);
        // Ants read from the normalized texture to sense trails (preserves color info even when saturated)
        AntHandling.update(time, deltaTime, TextureNormalize.targetTexture);
        AntDisplay.update();
        gl.disable(gl.BLEND);  // Disable blending after ant display
        TextureThreshold.update(AntDisplay.targetTexture);
        TextureBlur.update(TextureThreshold.targetTexture);
        TextureMerge.update(AntDisplay.targetTexture, TextureBlur.getScaleTextures());
        TextureDecay.update(TextureMerge.targetTexture, deltaTime);
        TextureDisplay.update(TextureDecay.targetTexture);
    }

    animate();
}

await main("canvas");