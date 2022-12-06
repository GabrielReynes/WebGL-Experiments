#version 300 es

precision highp float;

// see https://www.rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/
const float offsets[3] = float[3](0.0, 1.3846153846, 3.2307692308);
const float weights[3] = float[3](0.2270270270, 0.3162162162, 0.0702702703);

uniform float u_textureWidth, u_textureHeight;
uniform sampler2D u_texture;

in vec2 v_uv;

out vec4 o_color;

void main() {
    o_color = texture(u_texture, v_uv) * weights[0];

    for (int i = 1; i < 3; i++) {
        vec2 clippedOffset = vec2(0, offsets[i] / u_textureHeight);
        o_color += texture(u_texture, v_uv + clippedOffset) * weights[i];
        o_color += texture(u_texture, v_uv - clippedOffset) * weights[i];
    }
}