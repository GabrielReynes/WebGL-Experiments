#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform vec4 u_backgroundColor;

in vec2 v_uv;

out vec4 o_color;

void main() {
    vec4 texColor = texture(u_texture, v_uv);
    
    // Calculate raw intensity (before tone mapping) to determine if there's any content
    float rawIntensity = max(texColor.r, max(texColor.g, texColor.b));
    
    // If there's no content, just show background
    if (rawIntensity < 0.001) {
        o_color = u_backgroundColor;
        return;
    }
    
    // Tone mapping: convert HDR values to [0,1] range using Reinhard tone mapping
    vec3 toneMapped = texColor.rgb / (1.0 + texColor.rgb);
    
    // Calculate intensity for blending with background
    float intensity = max(toneMapped.r, max(toneMapped.g, toneMapped.b));
    
    // Blend tone-mapped texture with background
    o_color = mix(u_backgroundColor, vec4(toneMapped, 1.0), intensity);
}