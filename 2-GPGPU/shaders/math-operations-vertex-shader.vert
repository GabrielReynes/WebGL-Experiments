#version 300 es

in float a;
in float b;

out float sum;
out float difference;
out float product;

void main() {
    sum = a + b;
    difference = a - b;
    product = a * b;
}