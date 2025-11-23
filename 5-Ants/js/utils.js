export function createTexture(gl, textureWidth, textureHeight) {
    // create to render to
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureWidth, textureHeight, border, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

export function createFloatTexture(gl, textureWidth, textureHeight) {
    // create floating-point texture for HDR values
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const border = 0;
    const format = gl.RGBA;
    const data = null;

    // Try to use RGBA16F first (more compatible, requires EXT_color_buffer_half_float)
    // Fall back to RGBA32F if needed (requires EXT_color_buffer_float)
    let internalFormat, type;
    
    const colorBufferHalfFloatExt = gl.getExtension('EXT_color_buffer_half_float');
    const colorBufferFloatExt = gl.getExtension('EXT_color_buffer_float');
    
    if (colorBufferHalfFloatExt) {
        // Use RGBA16F with half-float (more compatible, still supports HDR)
        // HALF_FLOAT is a standard WebGL2 constant (0x8D61)
        internalFormat = gl.RGBA16F;
        type = gl.HALF_FLOAT;
    } else if (colorBufferFloatExt) {
        // Use RGBA32F with full float (requires EXT_color_buffer_float)
        internalFormat = gl.RGBA32F;
        type = gl.FLOAT;
    } else {
        console.error('No floating-point color buffer extensions available. Falling back to RGBA32F (may not be renderable).');
        // Fallback - may not work but we'll try
        internalFormat = gl.RGBA32F;
        type = gl.FLOAT;
    }

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureWidth, textureHeight, border, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}
