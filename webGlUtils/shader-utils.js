/**
 * Retrieves the raw content of the file at a given relative path.
 * @param filePath
 * @returns The raw file content, or *null* if an error was raised during the file request.
 */
function loadFile(filePath) {
    let result = null;
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if (xmlhttp.status===200) {
        result = xmlhttp.responseText;
    }
    return result;
}

/**
 * Creates a webGl shader object of a given type from the file at the given relative path. 
 * @param gl
 * @param type
 * @param source
 * @returns {WebGLShader}
 */
function createShader(gl, type, source) {
    // Creates a shader object
    const shader = gl.createShader(type);
    // Attach the source file to the shader object
    gl.shaderSource(shader, source);
    // Compiles the shader object
    gl.compileShader(shader);
    // This allows us to ensure that no compilation errors were raised.
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    
    // If compile errors were raised -> check the logs and delete the previously created shader.
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

/**
 * Creates a shader object from a given relative file's path.
 * @param gl The gl context on which to attach the created shader.
 * @param type The type of the created shader. (gl.VERTEX_SHADER | gl.FRAGMENT_SHADER)
 * @param filePath the relative path to the shader file.
 * @returns {WebGLShader}
 */
export function readShaderFile(gl, type, filePath) {
    return createShader(gl, type, loadFile(filePath));
}
