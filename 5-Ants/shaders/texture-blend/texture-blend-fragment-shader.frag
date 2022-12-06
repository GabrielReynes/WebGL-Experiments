#version 300 es

precision highp float;

uniform sampler2D u_sourceTexture;
uniform sampler2D u_blendTexture;
uniform float u_blendFactor;

in vec2 v_uv;

out vec4 o_color;

void main() {
    o_color = (1.0 - u_blendFactor) * texture(u_sourceTexture, v_uv)
        + u_blendFactor * texture(u_blendTexture, v_uv);
}