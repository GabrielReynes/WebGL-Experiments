#version 300 es

uniform mat3 u_matrix;

in vec2 a_position;

void main() {
    vec3 clippedPosition = u_matrix * vec3(a_position, 1);
    gl_Position = vec4(clippedPosition.xy, 0, 1);
    gl_PointSize = 2.0;
}