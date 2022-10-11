import {readShaderFile} from "./shader-utils.js";

/**
 * For the given vertex attribute location, specifies to the given webGl context how to read its attached buffer data.
 * This enables the reading of buffers containing 2-dimensional float32 vectors.
 * @param gl The used webGl context.
 * @param positionAttributeLocation The location of the attribute used to store vertices coordinates inside the shader.
 * @param nbDimensions The number of dimensions of the data contained by the buffer.
 */
export function vertexAttribPoint(gl, positionAttributeLocation, nbDimensions = 2) {
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const type = gl.FLOAT;   // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation, nbDimensions, type, normalize, stride, offset);
}

/**
 *  Creates a webGl buffer from a given array of fixed data type or a predefined byte size.
 * @param gl The used webGl context.
 * @param sizeOrData The data to be copied onto the buffer, or its predefined size.
 * @param usage The GLEnum specifying the intended usage pattern of the data store for optimization purposes.
 * @see https://developer.mozilla.org/fr/docs/Web/API/WebGLRenderingContext/bufferData
 * @returns {WebGLBuffer} The created buffer.
 */
export function makeBuffer(gl, sizeOrData, usage = gl.STATIC_DRAW) {
    const buf = gl.createBuffer();
    // anchor point ARRAY_BUFFER = positionBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // defines the buffer data (or size) and its usage (default: STATIC_DRAW)
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    return buf;
}

/**
 * Creates a webGl buffer and initializes it to read fixed dimensional data and apply it to the linked attribute.
 * @param gl the webGl context used.
 * @param sizeOrData The size or data to be applied to the buffer.
 * @param positionAttributeLocation The positional attribute onto which write the buffer data
 * @param nbDimensions (default 2)
 * @returns {WebGLBuffer} The created buffer.
 */
export function makeReadableVertexBuffer(gl, sizeOrData, positionAttributeLocation, nbDimensions = 2) {
    const buf = makeBuffer(gl, sizeOrData);
    // set up our attributes to tell WebGL how to pull
    // the data from the buffer above to the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
    vertexAttribPoint(gl, positionAttributeLocation, nbDimensions);
    return buf;
}

/**
 * Links the given program to a webGl context.
 * This compiles the shader program and allows us to check for compilation errors in shader files.
 * @param gl
 * @param program
 */
function linkProgram(gl, program) {
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
}

/**
 * Utility function allowing us to generate a basic webGl program object and attach the shaders generated from the 
 * given paths corresponding files. 
 * @param gl
 * @param vertexShaderPath The relative path towards the vertex shader file
 * @param fragmentShaderPath The relative path towards the fragment shader file
 * @returns {WebGLProgram}
 */
function createProgram(gl, vertexShaderPath, fragmentShaderPath) {
    const vertexShader = readShaderFile(gl, gl.VERTEX_SHADER, vertexShaderPath);
    const fragmentShader = readShaderFile(gl, gl.FRAGMENT_SHADER, fragmentShaderPath);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    return program;
}


/**
 * Create a webGl program object, attaches the shader object generated from the given file paths and returns it.
 * @param gl
 * @param vertexShaderPath The relative path towards the vertex shader file
 * @param fragmentShaderPath The relative path towards the fragment shader file
 * @returns {WebGLProgram}
 */
export function createProgramFrom(gl, vertexShaderPath, fragmentShaderPath) {
    const program = createProgram(gl, vertexShaderPath, fragmentShaderPath);
    linkProgram(gl, program);
    return program;
}

/**
 * Create a webGl compute program object, attaches the shader object generated from the given file paths and returns it.
 * This program can be used to retrieve varying attributes via buffers.
 * @param gl
 * @param vertexShaderPath The relative path towards the vertex shader file
 * @param fragmentShaderPath The relative path towards the fragment shader file
 * @param varyings An array containing the names of the shaders varyings which will be retrieved.
 * @param bufferMode The retrieving process mode.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings
 * @returns {WebGLProgram}
 */
export function createComputeProgramFrom(gl, vertexShaderPath, fragmentShaderPath, varyings, bufferMode = gl.SEPARATE_ATTRIBS) {
    const program = createProgram(gl, vertexShaderPath, fragmentShaderPath);
    gl.transformFeedbackVaryings(program, varyings, bufferMode);
    linkProgram(gl, program);
    return program;
}

