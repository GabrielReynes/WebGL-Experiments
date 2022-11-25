/**
 * Creates a default texture which is simply a white square of 1x1 pixel size.
 * @param gl The gl context to use to create the texture.
 * @returns The newly created texture.
 */
function defaultTexture(gl) {
    let texture = gl.createTexture();
    texture.textureMatrix = m3.identity();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 white pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255]));
    return texture;
}

/**
 * This binds the given image to the texture unit of the given gl context.
 * This allows to pass the image as a texture to frag shaders.
 * @param gl The gl context onto which bind the image
 * @param image The image to bind
 */
function bindImageToActiveTexture(gl, image) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Turn off mips and set wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

/**
 * Convert the image contained on the given path into a texture that can be used by sprite displaying behaviors.
 * @param gl The gl context to use to create the texture.
 * @param src The source path of the image to convert into a texture.
 * @returns The newly create image texture.
 */
export function textureFromImage(gl, src) {
    let image = new Image();
    image.src = src;
    let texture = defaultTexture(gl);

    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        bindImageToActiveTexture(gl, image);
    });
    return texture;
}