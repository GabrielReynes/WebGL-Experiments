#version 300 es

precision highp float;

uniform sampler2D u_originalTexture;
uniform sampler2D u_scale1Texture;
uniform sampler2D u_scale2Texture;
uniform sampler2D u_scale3Texture;
uniform float u_bloomIntensity;

in vec2 v_uv;

out vec4 o_color;

void main() {
    // Sample original texture
    vec4 original = texture(u_originalTexture, v_uv);
    
    // Sample all blurred scales (they are already at different resolutions, 
    // but WebGL will handle the upscaling via linear filtering)
    vec4 scale1 = texture(u_scale1Texture, v_uv);
    vec4 scale2 = texture(u_scale2Texture, v_uv);
    vec4 scale3 = texture(u_scale3Texture, v_uv);
    
    // Apply bloom intensity multiplier to blurred scales for stronger bloom effect
    // Additively blend original with intensified blurred scales
    o_color = original + (scale1 + scale2 + scale3) * u_bloomIntensity;
}

