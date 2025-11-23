#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;

out vec4 o_color;

void main() {
    // Simple pass-through: just sample and output the texture
    // The viewport size will handle the downscaling
    o_color = texture(u_texture, v_uv);
}

