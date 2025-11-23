#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;

out vec4 o_color;

void main() {
    vec4 texColor = texture(u_texture, v_uv);
    
    // Calculate the maximum component to normalize by
    float maxComponent = max(texColor.r, max(texColor.g, texColor.b));
    
    // Normalize: preserve color ratios while clamping intensity
    // If maxComponent > 0, divide all components by it
    // This ensures the color information is preserved even when values exceed 1.0
    if (maxComponent > 0.0) {
        o_color = vec4(texColor.rgb / maxComponent, texColor.a);
    } else {
        o_color = vec4(0.0, 0.0, 0.0, 0.0);
    }
}

