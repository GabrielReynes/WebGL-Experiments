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
import {ConfigPanel} from "./js/config-panel.js";


// Mutable state objects for configuration
let state = {
    antParams: {
        speed: 40.0, // pixel per sec
        rotationSpeed: 335, // degrees per sec
        senseSpread: 30, // degrees
        senseLength: 20, // pixels
        senseSize: 1, // pixels,
    },
    decayFactor: 0.03,
    saturationThreshold: 0.2,  // Lowered to allow more bloom (was 1.0)
    bloomIntensity: 1.0,  // Multiplier for bloom effect (higher = more bloom)
    numBlurScales: 7,  // Number of blur/downscale passes (1x, 0.5x, 0.25x, 0.125x, etc.)
    floatTextureColorFactor: 0.1,  // Color factor for float texture (prevents quick saturation)
    rgb8TextureColorFactor: 1.0,   // Color factor for RGB8 texture (full intensity for ant sensing)
    nbAgent: 3e5,
    initRadius: 2000,
    backgroundColor: Color.create(0,0,0),
    isPaused: false,
};

const DEVICE_PIXEL_RATIO = window.devicePixelRatio;

// RGB8 colors: Distinct colors for ant separation (prevents mixing)
// 10 maximally different colors to prevent ant mixing
const RGB8_COLORS = [
    Color.red,        // 0: Red
    Color.blue,       // 1: Blue
    Color.green,      // 2: Green
    Color.yellow,     // 3: Yellow
    Color.cyan,       // 4: Cyan
    Color.purple,     // 5: Purple/Magenta
    Color.orange,     // 6: Orange
    Color.pink,       // 7: Pink
    Color.lime,       // 8: Lime
    Color.create(1.0, 0.0, 0.5),  // 9: Magenta (distinct from purple)
]

// Float colors: Shades/variations for visual display (nice color palette)
// 10 shades from pure blue to pure red using OKLab color space with equal increments
// OKLab: L=lightness, a=green-red (negative=green, positive=red), b=blue-yellow (negative=blue, positive=yellow)
const FLOAT_COLORS = [
    Color.fromOKLab(0.65, 0.0, -0.25),    // 0: Pure blue
    Color.fromOKLab(0.65, 0.0278, -0.2056),  // 1
    Color.fromOKLab(0.65, 0.0556, -0.1611),  // 2
    Color.fromOKLab(0.65, 0.0833, -0.1167),  // 3
    Color.fromOKLab(0.65, 0.1111, -0.0722),  // 4
    Color.fromOKLab(0.65, 0.1389, -0.0278),  // 5
    Color.fromOKLab(0.65, 0.1667, 0.0167),   // 6
    Color.fromOKLab(0.65, 0.1944, 0.0611),   // 7
    Color.fromOKLab(0.65, 0.2222, 0.1056),   // 8
    Color.fromOKLab(0.65, 0.25, 0.15),       // 9: Pure red
]

let gl, canvas, TEXTURE_WIDTH, TEXTURE_HEIGHT;
let rgb8ColorData, floatColorData;
let previousTimestamp;
let animationFrameId;

async function initializeSimulation() {
    // Set the background color
    gl.clearColor(state.backgroundColor.r, state.backgroundColor.g, state.backgroundColor.b, state.backgroundColor.a);

    resizeCanvas(canvas, DEVICE_PIXEL_RATIO);
    TEXTURE_WIDTH = canvas.width;
    TEXTURE_HEIGHT = canvas.height;

    // Create RGB8 color buffer (for ant sensing/separation)
    let rgb8ColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rgb8ColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(RGB8_COLORS.flatMap(c => [c.r, c.g, c.b])), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    rgb8ColorData = {
        buffer: rgb8ColorBuffer,
        length: RGB8_COLORS.length
    }

    // Create float color buffer (for visual display)
    let floatColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floatColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(FLOAT_COLORS.flatMap(c => [c.r, c.g, c.b])), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    floatColorData = {
        buffer: floatColorBuffer,
        length: FLOAT_COLORS.length
    }

    // AntHandling uses RGB8 colors for sensing
    await AntHandling.init(gl, state.nbAgent, state.antParams, TEXTURE_WIDTH, TEXTURE_HEIGHT, rgb8ColorData, state.initRadius);
    await AntDisplay.init(gl, state.nbAgent, AntHandling.buffer2, AntHandling.buffer1, TEXTURE_WIDTH, TEXTURE_HEIGHT, rgb8ColorData, floatColorData, state.floatTextureColorFactor, state.rgb8TextureColorFactor);
    await TextureThreshold.init(gl, state.saturationThreshold, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureBlur.init(gl, state.numBlurScales, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureMerge.init(gl, state.bloomIntensity, state.numBlurScales, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDecay.init(gl, state.decayFactor, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDecayRGB8.init(gl, state.decayFactor, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureNormalize.init(gl, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    await TextureDisplay.init(gl, state.backgroundColor);
}

function handleParameterChange(paramId, value) {
    switch(paramId) {
        case 'speed':
        case 'rotationSpeed':
        case 'senseSpread':
        case 'senseLength':
        case 'senseSize':
            state.antParams[paramId] = value;
            AntHandling.setAntParams(state.antParams);
            break;
        case 'decayFactor':
            state.decayFactor = value;
            TextureDecay.setDecayFactor(value);
            TextureDecayRGB8.setDecayFactor(value);
            break;
        case 'saturationThreshold':
            state.saturationThreshold = value;
            TextureThreshold.setThreshold(value);
            break;
        case 'bloomIntensity':
            state.bloomIntensity = value;
            TextureMerge.setBloomIntensity(value);
            break;
        case 'numBlurScales':
            // This requires reinitialization, so we'll just update the state
            // User will need to reset to apply
            state.numBlurScales = value;
            break;
        case 'floatTextureColorFactor':
            state.floatTextureColorFactor = value;
            AntDisplay.setColorFactors(state.floatTextureColorFactor, state.rgb8TextureColorFactor);
            break;
        case 'rgb8TextureColorFactor':
            state.rgb8TextureColorFactor = value;
            AntDisplay.setColorFactors(state.floatTextureColorFactor, state.rgb8TextureColorFactor);
            break;
        case 'backgroundColor':
            state.backgroundColor = value;
            TextureDisplay.setBackgroundColor(value);
            gl.clearColor(value.r, value.g, value.b, value.a);
            break;
        case 'nbAgent':
        case 'initRadius':
            // These require reset, just update state
            state[paramId] = value;
            break;
    }
}

async function resetSimulation() {
    // Cancel current animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Reinitialize everything
    await initializeSimulation();
    
    // Reset timestamp
    previousTimestamp = undefined;
    
    // Restart animation
    animate();
}

function togglePause() {
    state.isPaused = !state.isPaused;
    if (!state.isPaused && !animationFrameId) {
        animate();
    }
    return state.isPaused;
}

async function main(canvasId) {
    canvas = document.getElementById(canvasId);
    gl = canvas.getContext("webgl2", { alpha: false });

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

    // Initialize simulation
    await initializeSimulation();

    // Initialize config panel
    ConfigPanel.init(state, {
        onParameterChange: handleParameterChange,
        onPause: togglePause,
        onReset: resetSimulation,
    });

    function animate(timestamp) {
        animationFrameId = requestAnimationFrame(animate);
        
        if (state.isPaused) {
            return;
        }
        
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
