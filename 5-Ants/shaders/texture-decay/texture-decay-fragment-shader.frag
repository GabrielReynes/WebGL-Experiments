#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform float u_deltaTime;
uniform float u_decayFactor;

in vec2 v_uv;

out vec4 o_color;

void main() {
    o_color = texture(u_texture, v_uv) - u_decayFactor * u_deltaTime;
}