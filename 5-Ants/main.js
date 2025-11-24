import {resizeCanvas} from "../webGlUtils/canvas-utils.js";
import {AntHandling} from "./js/ant-handling.js";
import {AntDisplay} from "./js/ant-display.js";
import {TextureDisplay} from "./js/texture-display.js";
import {TextureBlur} from "./js/texture-blur.js";
import {TextureDecay} from "./js/texture-decay.js";
import {TextureDecayRGB8} from "./js/texture-decay-rgb8.js";
import {TextureThreshold} from "./js/texture-threshold.js";
import {TextureMerge} from "./js/texture-merge.js";
import {TextureNormalize} from "./js/texture-normalize.js";
import {Color} from "../webGlUtils/color-utils.js";


const ANT_PARAMS = {
    speed: 120.0, // pixel per sec
    rotationSpeed: 335, // degrees per sec
    senseSpread: 30, // degrees
    senseLength: 50, // pixels
    senseSize: 1, // pixels,
};
const DECAY_FACTOR = 0.01;
const SATURATION_THRESHOLD = 0.0;  // Lowered to allow more bloom (was 1.0)
const BLOOM_INTENSITY = 1.0;  // Multiplier for bloom effect (higher = more bloom)
const NUM_BLUR_SCALES = 5  // Number of blur/downscale passes (1x, 0.5x, 0.25x, 0.125x, etc.)
const FLOAT_TEXTURE_COLOR_FACTOR = 0.1;  // Color factor for float texture (prevents quick saturation)
const RGB8_TEXTURE_COLOR_FACTOR = 1.0;   // Color factor for RGB8 texture (full intensity for ant sensing)
const DEVICE_PIXEL_RATIO = window.devicePixelRatio;
const INIT_RADIUS = 700;
const NB_AGENT = 3e5;
const BACKGROUND_COLOR = Color.create(0,0,0);

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
    await AntDisplay.init(gl, NB_AGENT, AntHandling.buffer2, AntHandling.buffer1, TEXTURE_WIDTH, TEXTURE_HEIGHT, colorData, FLOAT_TEXTURE_COLOR_FACTOR, RGB8_TEXTURE_COLOR_FACTOR);
    await TextureThreshold.init(gl, SATURATION_THRESHOLD, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureBlur.init(gl, NUM_BLUR_SCALES, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureMerge.init(gl, BLOOM_INTENSITY, NUM_BLUR_SCALES, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDecay.init(gl, DECAY_FACTOR, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDecayRGB8.init(gl, DECAY_FACTOR, TEXTURE_WIDTH, TEXTURE_HEIGHT);
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

        // Decay the RGB8 texture (reads from input, writes to output framebuffer)
        // Get the current input texture (what ants read from) and output framebuffer
        let rgb8InputTexture = AntDisplay.targetTextureRGB8;
        let outputTexture = AntDisplay.targetTextureRGB8Output;
        let outputFramebuffer = (outputTexture === AntDisplay.targetTextureRGB8_1) 
            ? AntDisplay.framebufferRGB8_1 
            : AntDisplay.framebufferRGB8_2;
        
        // Ensure input and output are different (ping-pong requirement)
        if (rgb8InputTexture === outputTexture) {
            console.error("RGB8 ping-pong error: input and output textures are the same!");
            return; // Skip this frame to avoid feedback loop
        }
        
        // CRITICAL: Unbind any framebuffer before binding the input texture for reading
        // This prevents feedback loop errors
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        // Decay the input texture and write directly to the output framebuffer
        TextureDecayRGB8.update(rgb8InputTexture, outputFramebuffer);
        
        // Ants read from the RGB8 texture from previous frame to sense trails
        AntHandling.update(time, deltaTime, rgb8InputTexture);
        
        // Decay the float texture before rendering new ants (for accumulation)
        // Get the input texture (what we read from) and output framebuffer (where we write to)
        let floatInputTexture = AntDisplay.targetTextureInput;
        let floatOutputTexture = AntDisplay.targetTextureOutput;
        
        // Ensure input and output are different (ping-pong requirement)
        if (floatInputTexture === floatOutputTexture) {
            console.error("Float texture ping-pong error: input and output textures are the same!");
            return; // Skip this frame to avoid feedback loop
        }
        
        // Get the correct framebuffer for the output texture
        let floatOutputFramebuffer = (floatOutputTexture === AntDisplay.targetTexture1) 
            ? AntDisplay.framebuffer1 
            : AntDisplay.framebuffer2;
        
        // Verify the input texture is NOT attached to the output framebuffer
        // (This should never happen with proper ping-pong, but let's be safe)
        gl.bindFramebuffer(gl.FRAMEBUFFER, floatOutputFramebuffer);
        let attachedTexture = gl.getFramebufferAttachmentParameter(
            gl.FRAMEBUFFER, 
            gl.COLOR_ATTACHMENT0, 
            gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME
        );
        if (attachedTexture === floatInputTexture) {
            console.error("ERROR: Input texture is attached to output framebuffer! This will cause flickering.");
        }
        
        // CRITICAL: Unbind any framebuffer before binding the input texture for reading
        // This prevents feedback loop errors when reading from a texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        // Decay the input texture and write to the output framebuffer
        // The input texture should NOT be attached to the output framebuffer (ping-pong ensures this)
        // Note: We read from targetTextureInput (previous frame's output) and write to targetTextureOutput
        TextureDecay.update(floatInputTexture, floatOutputFramebuffer);
        
        // Render ants on top of the decayed texture (which is now in the float texture framebuffer)
        // This will swap the textures at the end, so next frame will read from what we just wrote to
        AntDisplay.update();
        gl.disable(gl.BLEND);  // Disable blending after ant display
        
        // CRITICAL: Capture the texture reference AFTER update() completes (after swap)
        // This ensures we use the texture we just rendered to
        let currentFloatTexture = AntDisplay.targetTexture;
        
        TextureThreshold.update(currentFloatTexture);
        TextureBlur.update(TextureThreshold.targetTexture);
        TextureMerge.update(currentFloatTexture, TextureBlur.getScaleTextures());
        // Removed second decay pass - it was causing flickering by decaying the final output
        // The accumulation decay (before ant rendering) is sufficient
        TextureDisplay.update(TextureMerge.targetTexture);
        // Debug: Display RGB8 texture instead of decayed texture
        // TextureDisplay.update(AntDisplay.targetTextureRGB8);
    }

    animate();
}

await main("canvas");