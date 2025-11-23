#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform float u_threshold;

in vec2 v_uv;

out vec4 o_color;

void main() {
    vec4 texColor = texture(u_texture, v_uv);
    
    // Calculate intensity (luminance)
    float intensity = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // Binary threshold: discard pixels below threshold
    if (intensity < u_threshold) {
        o_color = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
        o_color = texColor;
    }
}

