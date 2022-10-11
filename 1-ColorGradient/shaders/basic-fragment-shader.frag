#version 300 es

precision highp float;

in vec4 v_color;
out vec4 out_color;

void main() {
    out_color = vec4(v_color.xy, 0, 1);
}