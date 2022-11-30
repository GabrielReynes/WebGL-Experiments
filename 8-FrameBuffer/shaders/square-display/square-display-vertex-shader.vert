#version 300 es

in float a_pointSize;
in vec2 a_position;
in vec3 a_color;

out vec4 v_color;

void main() {
    v_color = vec4(a_color, 1);
    gl_PointSize = a_pointSize;
    gl_Position = vec4(a_position, 0, 1);
}