#version 300 es

uniform mat3 u_projectionMatrix;

in vec2 a_position;
in vec3 a_color;
in mat3 a_transformMatrix;
in float a_depth;

out vec3 v_color;

void main() {
    v_color = a_color;

    vec3 clippedPosition = (u_projectionMatrix * a_transformMatrix) * vec3(a_position, 1);
    gl_Position = vec4(clippedPosition.xy, a_depth , 1);
}