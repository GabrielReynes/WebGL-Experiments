#version 300 es

precision highp float;

uniform float u_colorFactor;

in vec4 v_color;

out vec4 o_color;

void main() {
    o_color = v_color * u_colorFactor;
}