#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform float u_deltaTime;
uniform float u_decayFactor;

in vec2 v_uv;

out vec4 o_color;

void main() {
    vec4 color = texture(u_texture, v_uv) - u_decayFactor * u_deltaTime;
    // Clamp to [0,1] range (important for RGB8 textures, safe for float textures)
    o_color = clamp(color, 0.0, 1.0);
}