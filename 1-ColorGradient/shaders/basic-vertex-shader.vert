#version 300 es

in vec4 a_position;

out vec4 v_color;

void main() {
    v_color = (a_position + 1.0) * 0.5 ;
    gl_Position = a_position;
}