#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform float u_decayFactor;

in vec2 v_uv;

out vec4 o_color;

void main() {
    // Fixed decay per frame (not time-based)
    vec4 color = texture(u_texture, v_uv) - u_decayFactor;
    // Clamp only negative values to 0 (prevent underflow)
    // For float textures, allow values > 1.0 for HDR accumulation
    // For RGB8 textures, values > 1.0 will be clamped by the framebuffer format
    o_color = max(color, 0.0);
}