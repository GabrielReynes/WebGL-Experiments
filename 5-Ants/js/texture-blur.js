import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createFloatTexture} from "./utils.js";

export const TextureBlur = {
    async init(gl, numScales, canvasWidth, canvasHeight) {
        this.gl = gl;
        this.textureUnit = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.numScales = numScales;

        // Dynamically generate scales: 1x, 0.5x, 0.25x, 0.125x, etc.
        this.scales = [];
        for (let i = 0; i < numScales; i++) {
            const scaleFactor = Math.pow(0.5, i);  // 1.0, 0.5, 0.25, 0.125, ...
            this.scales.push({
                width: Math.floor(canvasWidth * scaleFactor),
                height: Math.floor(canvasHeight * scaleFactor),
                scale: scaleFactor
            });
        }

        // Simple downscale/copy program (just samples the texture)
        let textureDownscaleProgram = this.programDownscale = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-downscale/texture-downscale-fragment-shader.frag");

        let textureBlurHorizontalProgram = this.programHorizontal = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-blur/texture-blur-horizontal-fragment-shader.frag");

        let textureBlurVerticalProgram = this.programVertical = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-blur/texture-blur-vertical-fragment-shader.frag");

        let attributeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1,
        ]), gl.STATIC_DRAW);

        let programs = [textureBlurHorizontalProgram, textureBlurVerticalProgram];
        let vaos = [this.vao1, this.vao2] = [gl.createVertexArray(), gl.createVertexArray()];
        for (let i = 0; i < 2; i++) {
            let program = programs[i];
            let vao = vaos[i];
            gl.useProgram(program);
            gl.bindVertexArray(vao);

            let uniformLocations = getUniformLocations(gl, program, ["u_texture", "u_textureWidth", "u_textureHeight"]);
            gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);

            let attributeLocations = getAttributeLocations(gl, program, ["a_position"]);
            gl.enableVertexAttribArray(attributeLocations["a_position"]);
            gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);
        }
        this.uniformLocationsHorizontal = getUniformLocations(gl, textureBlurHorizontalProgram, ["u_texture", "u_textureWidth", "u_textureHeight"]);
        this.uniformLocationsVertical = getUniformLocations(gl, textureBlurVerticalProgram, ["u_texture", "u_textureWidth", "u_textureHeight"]);

        // Create textures and framebuffers for each scale
        this.scaleTextures = [];
        this.scaleFramebuffers = [];
        this.scaleDownscaledTextures = [];
        this.scaleDownscaledFramebuffers = [];
        this.scaleIntermediateTextures = [];
        this.scaleIntermediateFramebuffers = [];

        // Setup downscale program
        gl.useProgram(textureDownscaleProgram);
        let downscaleUniformLocations = getUniformLocations(gl, textureDownscaleProgram, ["u_texture"]);
        gl.uniform1i(downscaleUniformLocations["u_texture"], this.textureUnit);
        this.uniformLocationsDownscale = downscaleUniformLocations;
        
        let downscaleVao = this.vaoDownscale = gl.createVertexArray();
        gl.bindVertexArray(downscaleVao);
        let downscaleAttributeLocations = getAttributeLocations(gl, textureDownscaleProgram, ["a_position"]);
        gl.enableVertexAttribArray(downscaleAttributeLocations["a_position"]);
        gl.vertexAttribPointer(downscaleAttributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        function createFramebufferForTexture(texture) {
            let framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return framebuffer;
        }

        for (let scale of this.scales) {
            // Downscaled texture (input to blur)
            let downscaledTexture = createFloatTexture(gl, scale.width, scale.height);
            let downscaledFramebuffer = createFramebufferForTexture(downscaledTexture);
            this.scaleDownscaledTextures.push(downscaledTexture);
            this.scaleDownscaledFramebuffers.push(downscaledFramebuffer);

            // Output texture for this scale (final blurred result)
            let scaleTexture = createFloatTexture(gl, scale.width, scale.height);
            let scaleFramebuffer = createFramebufferForTexture(scaleTexture);
            this.scaleTextures.push(scaleTexture);
            this.scaleFramebuffers.push(scaleFramebuffer);

            // Intermediate texture for horizontal blur pass
            let intermediateTexture = createFloatTexture(gl, scale.width, scale.height);
            let intermediateFramebuffer = createFramebufferForTexture(intermediateTexture);
            this.scaleIntermediateTextures.push(intermediateTexture);
            this.scaleIntermediateFramebuffers.push(intermediateFramebuffer);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    },

    update(inputTexture) {
        const gl = this.gl;

        // Process each scale
        for (let scaleIndex = 0; scaleIndex < this.scales.length; scaleIndex++) {
            let scale = this.scales[scaleIndex];
            let downscaledTexture = this.scaleDownscaledTextures[scaleIndex];
            let downscaledFramebuffer = this.scaleDownscaledFramebuffers[scaleIndex];
            let intermediateTexture = this.scaleIntermediateTextures[scaleIndex];
            let outputTexture = this.scaleTextures[scaleIndex];
            let intermediateFramebuffer = this.scaleIntermediateFramebuffers[scaleIndex];
            let outputFramebuffer = this.scaleFramebuffers[scaleIndex];

            // First, downscale the input texture to this scale's resolution
            gl.useProgram(this.programDownscale);
            gl.bindVertexArray(this.vaoDownscale);
            gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, inputTexture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, downscaledFramebuffer);
            gl.viewport(0, 0, scale.width, scale.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            // Horizontal blur pass on downscaled texture
            gl.useProgram(this.programHorizontal);
            gl.bindVertexArray(this.vao1);
            gl.uniform1f(this.uniformLocationsHorizontal["u_textureWidth"], scale.width);
            gl.uniform1f(this.uniformLocationsHorizontal["u_textureHeight"], scale.height);

            gl.bindTexture(gl.TEXTURE_2D, downscaledTexture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, intermediateFramebuffer);
            gl.viewport(0, 0, scale.width, scale.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            // Vertical blur pass
            gl.useProgram(this.programVertical);
            gl.bindVertexArray(this.vao2);
            gl.uniform1f(this.uniformLocationsVertical["u_textureWidth"], scale.width);
            gl.uniform1f(this.uniformLocationsVertical["u_textureHeight"], scale.height);

            gl.bindTexture(gl.TEXTURE_2D, intermediateTexture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
            gl.viewport(0, 0, scale.width, scale.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.bindVertexArray(null);
    },

    // Get blurred textures for all scales
    getScaleTextures() {
        return this.scaleTextures;
    },
};