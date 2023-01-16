#version 300 es

in vec3 a_color;
in vec2 a_position;
in float a_posFactor;

out vec4 v_color;
void main() {
    v_color = vec4(a_color, 1);
    gl_Position = vec4(a_position * a_posFactor, 0, 1);
    gl_PointSize = 10.0;
}