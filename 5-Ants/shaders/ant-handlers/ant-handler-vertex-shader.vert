#version 300 es

uniform sampler2D u_texture;
uniform uint u_time;
uniform float u_deltaTime;
uniform vec2 u_canvasDimensions;
uniform float u_antSpeed;
uniform float u_rotationSpeed;
uniform float u_senseLength;
uniform float u_senseSpread;
uniform int u_senseSize;

in vec2 a_position;
in float a_angleInRad; // In Radians
in vec3 a_color;

out vec2 o_position;
out float o_angleInRad;

// Hash function www.cs.ubc.ca/~rbridson/docs/schechter-sca08-turbulence.pdf
uint hash(uint state)
{
    state ^= 2747636419u;
    state *= 2654435769u;
    state ^= state >> 16;
    state *= 2654435769u;
    state ^= state >> 16;
    state *= 2654435769u;
    return state;
}

float scaleRandomTo01(const uint state)
{
    return float(state) / 4294967295.0; //--Largest output of "hash" method
}

vec2 dirFromRad(float angleInRad) {
    return vec2(cos(angleInRad), sin(angleInRad));
}

vec2 canvasContained(vec2 position) {
    return mod(position, u_canvasDimensions);
}

float sense_sum(vec2 pos, vec2 direction)
{
    float sum = 0.0;

    vec2 center_point = pos + direction * u_senseLength;
    int center_x = int(center_point.x);
    int center_y = int(center_point.y);

    for (int x = -u_senseSize; x < u_senseSize; x++) {
        int sample_x = center_x + x;
        for (int y = -u_senseSize; y < u_senseSize; y++) {
            int sample_y = center_y + y;
//            vec2 conainedPos = canvasContained(vec2(sample_x, sample_y));
            vec4 sampled = texture(u_texture, vec2(sample_x, sample_y) / u_canvasDimensions);
            sum += dot(sampled.rgb, a_color * 2.0 - 1.0);
        }
    }
    return sum;
}

void main() {
    float left_sense = sense_sum(a_position, dirFromRad(a_angleInRad + u_senseSpread));
    float straight_sense = sense_sum(a_position, dirFromRad(a_angleInRad));
    float right_sense = sense_sum(a_position, dirFromRad(a_angleInRad - u_senseSpread));

    o_angleInRad = a_angleInRad;

    uint id = uint(a_position.y * u_canvasDimensions.x + a_position.x) + u_time;
    uint random = hash(uint(gl_InstanceID) + u_time + hash(id));
    float randomSteerStrength = scaleRandomTo01(random);

    if (straight_sense > left_sense && straight_sense > right_sense) {
        //o_angleInRad += 0;
    }
    else if (straight_sense < left_sense && straight_sense < right_sense) {
        o_angleInRad -= (randomSteerStrength - 0.5) * 2.0 * u_rotationSpeed * u_deltaTime;
    }
    // Turn right
    else if (right_sense > left_sense) {
        o_angleInRad -= randomSteerStrength * u_rotationSpeed * u_deltaTime;
    }
    // Turn left
    else if (left_sense > right_sense) {
        o_angleInRad += randomSteerStrength * u_rotationSpeed * u_deltaTime;
    }

    o_position = canvasContained(a_position + dirFromRad(o_angleInRad) * u_antSpeed * u_deltaTime);
}