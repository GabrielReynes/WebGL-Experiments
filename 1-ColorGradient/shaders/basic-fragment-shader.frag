#version 300 es

precision highp float;

in vec4 v_color;
out vec4 out_color;

void main() {
    out_color = vec4(0,  v_color.y, 0, 1);
}