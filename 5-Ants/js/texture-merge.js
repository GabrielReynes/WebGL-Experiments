import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {readShaderFile} from "../../webGlUtils/shader-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";
import {createFloatTexture} from "./utils.js";

export const TextureMerge = {
    async init(gl, bloomIntensity, numScales, canvasWidth, canvasHeight) {
        this.gl = gl;
        this.numScales = numScales;
        this.originalTextureUnit = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Generate shader code dynamically based on number of scales
        const scaleTextureUniforms = [];
        const scaleTextureSamples = [];
        for (let i = 0; i < numScales; i++) {
            scaleTextureUniforms.push(`uniform sampler2D u_scale${i}Texture;`);
            scaleTextureSamples.push(`    vec4 scale${i} = texture(u_scale${i}Texture, v_uv);`);
        }

        const shaderCode = `#version 300 es

precision highp float;

uniform sampler2D u_originalTexture;
${scaleTextureUniforms.join('\n')}
uniform float u_bloomIntensity;
uniform int u_numScales;

in vec2 v_uv;

out vec4 o_color;

void main() {
    // Sample original texture
    vec4 original = texture(u_originalTexture, v_uv);
    
    // Sample all blurred scales
${scaleTextureSamples.join('\n')}
    
    // Sum all blurred scales
    vec4 blurredSum = vec4(0.0);
    ${Array.from({length: numScales}, (_, i) => `blurredSum += scale${i};`).join('\n    ')}
    
    // Apply bloom intensity multiplier to blurred scales
    o_color = original + blurredSum * u_bloomIntensity;
}`;

        // Create shader from code
        const vertexShader = await readShaderFile(gl, gl.VERTEX_SHADER, "./shaders/texture-draw/texture-draw-vertex-shader.vert");
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, shaderCode);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Fragment shader compilation error:", gl.getShaderInfoLog(fragmentShader));
        }

        const program = this.program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program linking error:", gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        let targetTexture = this.targetTexture = createFloatTexture(gl, canvasWidth, canvasHeight);
        let framebuffer = this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Get uniform locations dynamically
        const uniformNames = ["u_originalTexture", "u_bloomIntensity", "u_numScales"];
        for (let i = 0; i < numScales; i++) {
            uniformNames.push(`u_scale${i}Texture`);
        }
        let uniformLocations = getUniformLocations(gl, program, uniformNames);

        gl.uniform1i(uniformLocations["u_originalTexture"], this.originalTextureUnit);
        gl.uniform1f(uniformLocations["u_bloomIntensity"], bloomIntensity);
        gl.uniform1i(uniformLocations["u_numScales"], numScales);
        
        // Set texture unit locations for each scale
        this.scaleTextureUnits = [];
        for (let i = 0; i < numScales; i++) {
            const textureUnit = i + 1;  // Start from 1 (0 is for original)
            this.scaleTextureUnits.push(textureUnit);
            gl.uniform1i(uniformLocations[`u_scale${i}Texture`], textureUnit);
        }
        
        this.uniformLocations = uniformLocations;

        let vao = this.vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

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

        let attributeLocations = getAttributeLocations(gl, program, ["a_position"]);

        gl.enableVertexAttribArray(attributeLocations["a_position"]);
        gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },

    update(originalTexture, scaleTextures) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

        // Bind original texture
        gl.activeTexture(gl.TEXTURE0 + this.originalTextureUnit);
        gl.bindTexture(gl.TEXTURE_2D, originalTexture);
        
        // Bind all scale textures dynamically
        for (let i = 0; i < this.numScales && i < scaleTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + this.scaleTextureUnits[i]);
            gl.bindTexture(gl.TEXTURE_2D, scaleTextures[i]);
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
};

