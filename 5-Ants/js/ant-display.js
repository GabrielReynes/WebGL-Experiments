import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {m3} from "../../webGlUtils/math-utils.js";
import {createFloatTexture, createTexture} from "./utils.js";

export const AntDisplay = {
    async init(gl, nbAnt, inputBuffer1, inputBuffer2, canvasWidth, canvasHeight, rgb8ColorData, floatColorData, floatColorFactor, rgb8ColorFactor) {
        this.gl = gl;
        this.indicesCount = nbAnt;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.floatColorFactor = floatColorFactor;
        this.rgb8ColorFactor = rgb8ColorFactor;

        let antiDisplayProgram = this.program = await createProgramFrom(gl,
            "./shaders/ant-display/ant-display-vertex-shader.vert",
            "./shaders/ant-display/ant-display-fragment-shader.frag");

        gl.useProgram(antiDisplayProgram);

        // Use floating-point textures for HDR color accumulation (ping-pong for decay)
        let targetTexture1 = this.targetTexture1 = createFloatTexture(gl, canvasWidth, canvasHeight);
        let targetTexture2 = this.targetTexture2 = createFloatTexture(gl, canvasWidth, canvasHeight);
        
        // Initially: read from texture 1, write to texture 2
        // Note: On first frame, we'll write to texture2, so targetTexture should point to texture2 after first update
        this.targetTextureInput = targetTexture1; // Texture we read from for decay (initially empty/black)
        this.targetTextureOutput = targetTexture2; // Texture we write to after decay
        this.targetTexture = targetTexture2; // Initially point to output texture (what we'll write to on first frame)

        let framebuffer1 = this.framebuffer1 = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture1, 0);
        
        let framebuffer2 = this.framebuffer2 = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture2, 0);
        
        // Store reference to current framebuffer for compatibility
        this.framebuffer = framebuffer2; // Start by writing to framebuffer2

        // Check for EXT_float_blend extension (required for blending with floating-point textures)
        const floatBlendExt = gl.getExtension('EXT_float_blend');
        if (!floatBlendExt) {
            console.warn('EXT_float_blend extension not available. Blending with floating-point textures may not work.');
        }

        // Enable additive blending for color accumulation
        // Note: This requires EXT_float_blend extension for floating-point textures
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);

        // Clear both float textures to black (0,0,0,0) for initial state
        gl.clearColor(0, 0, 0, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Create RGB8 textures and framebuffers for ant handling input (half resolution)
        // Use ping-pong buffers for accumulation
        let rgb8Width = Math.floor(canvasWidth * 0.5);
        let rgb8Height = Math.floor(canvasHeight * 0.5);
        
        // Create two textures for ping-pong (read from one, write to the other)
        let targetTextureRGB8_1 = this.targetTextureRGB8_1 = createTexture(gl, rgb8Width, rgb8Height);
        let targetTextureRGB8_2 = this.targetTextureRGB8_2 = createTexture(gl, rgb8Width, rgb8Height);
        
        // Initially: read from texture 1, write to texture 2
        this.targetTextureRGB8 = targetTextureRGB8_1; // Texture ants read from (input)
        this.targetTextureRGB8Output = targetTextureRGB8_2; // Texture we write to (output)
        
        let framebufferRGB8_1 = this.framebufferRGB8_1 = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferRGB8_1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTextureRGB8_1, 0);
        
        let framebufferRGB8_2 = this.framebufferRGB8_2 = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferRGB8_2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTextureRGB8_2, 0);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let uniformLocations = getUniformLocations(gl, antiDisplayProgram, ["u_matrix", "u_scale", "u_colorFactor"]);
        this.uniformLocations = uniformLocations;
        
        // Create projection matrices for both resolutions
        this.matrixFull = m3.projection(canvasWidth, canvasHeight);
        this.matrixHalf = m3.projection(rgb8Width, rgb8Height);
        
        // Store dimensions for RGB8 pass
        this.rgb8Width = rgb8Width;
        this.rgb8Height = rgb8Height;

        let attributeLocations = getAttributeLocations(gl, antiDisplayProgram, ["a_position", "a_color"]);

        // Create VAO creation function that accepts a color buffer
        function createVAOForBuffer(buffer, colorData) {
            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            gl.enableVertexAttribArray(attributeLocations["a_position"]);
            // This buffer also contains values only used for the AntHandling module (a_angleInRad)
            // We should take this into account when defining the attribution stride.
            gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 3 * 4, 0);
            gl.vertexAttribDivisor(attributeLocations["a_position"], 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorData.buffer);

            gl.enableVertexAttribArray(attributeLocations["a_color"]);
            gl.vertexAttribPointer(attributeLocations["a_color"], 3, gl.FLOAT, false, 0, 0);
            gl.vertexAttribDivisor(attributeLocations["a_color"], Math.ceil(nbAnt / colorData.length));

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindVertexArray(null);

            return vao;
        }

        // Create separate VAOs for float texture rendering (using float colors)
        this.floatVao1 = createVAOForBuffer(inputBuffer1, floatColorData);
        this.floatVao2 = createVAOForBuffer(inputBuffer2, floatColorData);

        // Create separate VAOs for RGB8 texture rendering (using RGB8 colors)
        this.rgb8Vao1 = createVAOForBuffer(inputBuffer1, rgb8ColorData);
        this.rgb8Vao2 = createVAOForBuffer(inputBuffer2, rgb8ColorData);

        // Initialize current VAOs
        this.floatVao = this.floatVao1;
        this.rgb8Vao = this.rgb8Vao1;
    },

    update() {
        const gl = this.gl;
        gl.useProgram(this.program);

        // First pass: Render to float texture with additive blending (for bloom)
        // Note: The decayed texture should already be in the framebuffer from main.js
        // Use float VAO with float colors for visual display
        gl.bindVertexArray(this.floatVao);
        // Use the output framebuffer (where we write after decay)
        let floatOutputFb = (this.targetTextureOutput === this.targetTexture1) 
            ? this.framebuffer1 
            : this.framebuffer2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, floatOutputFb);
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

        // Set projection matrix and scale for full resolution
        gl.uniformMatrix3fv(this.uniformLocations["u_matrix"], false, this.matrixFull);
        gl.uniform1f(this.uniformLocations["u_scale"], 1.0);
        // Use configured color factor for float texture to prevent quick saturation
        gl.uniform1f(this.uniformLocations["u_colorFactor"], this.floatColorFactor);

        // Don't clear - we want to accumulate on top of the decayed texture
        // The decay will be applied before this pass in main.js

        // Enable additive blending for float texture pass
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);

        gl.drawArraysInstanced(gl.POINTS, 0, 1, this.indicesCount);

        // Second pass: Render to RGB8 texture with blending for accumulation (for ant handling)
        // Note: The decayed texture should already be in the framebuffer from main.js
        // Use RGB8 VAO with RGB8 colors for ant separation
        gl.bindVertexArray(this.rgb8Vao);
        // Use the output framebuffer (which texture we're writing to)
        let rgb8OutputFb = (this.targetTextureRGB8Output === this.targetTextureRGB8_1) 
            ? this.framebufferRGB8_1 
            : this.framebufferRGB8_2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, rgb8OutputFb);
        gl.viewport(0, 0, this.rgb8Width, this.rgb8Height);

        // Set projection matrix and scale for half resolution (scale positions by 0.5)
        gl.uniformMatrix3fv(this.uniformLocations["u_matrix"], false, this.matrixHalf);
        gl.uniform1f(this.uniformLocations["u_scale"], 0.5);
        // Use configured color factor for RGB8 texture
        gl.uniform1f(this.uniformLocations["u_colorFactor"], this.rgb8ColorFactor);

        // Don't clear - we want to accumulate on top of the decayed texture
        // The decay will be applied before this pass in main.js

        // Disable blending for RGB8 - we want ant colors to replace, not additively blend
        // Trails still accumulate over time because we render on top of the decayed texture
        gl.disable(gl.BLEND);

        gl.drawArraysInstanced(gl.POINTS, 0, 1, this.indicesCount);

        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Swap ping-pong buffers for next frame
        // RGB8 buffers
        let temp = this.targetTextureRGB8;
        this.targetTextureRGB8 = this.targetTextureRGB8Output;
        this.targetTextureRGB8Output = temp;
        
        // Float texture buffers
        // BEFORE swap: targetTextureInput = old input, targetTextureOutput = what we just wrote to
        // AFTER swap: targetTextureInput = what we just wrote to, targetTextureOutput = old input (where we'll write next)
        let tempFloat = this.targetTextureInput;
        this.targetTextureInput = this.targetTextureOutput;  // What we just wrote to becomes input for next frame
        this.targetTextureOutput = tempFloat;  // Old input becomes output for next frame
        
        // CRITICAL: Update the main targetTexture reference IMMEDIATELY after swap
        // After swap, targetTextureInput points to the texture we just wrote to (which is what the pipeline needs)
        this.targetTexture = this.targetTextureInput; // This is the texture we just rendered to
        // Update framebuffer reference
        this.framebuffer = (this.targetTextureOutput === this.targetTexture1) 
            ? this.framebuffer1 
            : this.framebuffer2;

        // Swap VAOs for next frame (both float and RGB8 VAOs need to track the buffer ping-pong)
        this.floatVao = this.floatVao === this.floatVao1 ? this.floatVao2 : this.floatVao1;
        this.rgb8Vao = this.rgb8Vao === this.rgb8Vao1 ? this.rgb8Vao2 : this.rgb8Vao1;
    },
    
    setColorFactors(floatColorFactor, rgb8ColorFactor) {
        this.floatColorFactor = floatColorFactor;
        this.rgb8ColorFactor = rgb8ColorFactor;
    },
};