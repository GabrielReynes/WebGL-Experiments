#version 300 es

precision highp float;

in vec3 v_color;

out vec4 o_color;

void main() {
    o_color = vec4(v_color, 1);
}