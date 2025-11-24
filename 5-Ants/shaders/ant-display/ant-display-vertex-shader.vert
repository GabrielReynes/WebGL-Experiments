#version 300 es

uniform mat3 u_matrix;
uniform float u_scale;

in vec2 a_position;
in vec3 a_color;

out vec4 v_color;

void main() {
    // Scale the position for downscaled rendering
    vec2 scaledPosition = a_position * u_scale;
    vec3 clippedPosition = u_matrix * vec3(scaledPosition, 1);
    gl_Position = vec4(clippedPosition.xy, 0, 1);
    gl_PointSize = 1.0;  // Increased from 1.0 to make ants larger
    v_color = vec4(a_color, 1.0);
}