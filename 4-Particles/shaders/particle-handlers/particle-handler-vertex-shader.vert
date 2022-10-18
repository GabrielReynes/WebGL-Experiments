#version 300 es

uniform float deltaTime;
uniform vec2 canvasDimensions;

in vec2 position;
in vec2 velocity;

out vec2 newPosition;

void main() {
    newPosition = mod(position + velocity * deltaTime, canvasDimensions);
}