import {createProgramFrom} from "../../webGlUtils/program-utils.js";
import {getAttributeLocations, getUniformLocations} from "../../webGlUtils/attribute-location-utils.js";

export const TextureDisplay = {
    async init(gl) {
        this.gl = gl;
        this.textureUnit = 0;

        let textureDisplayProgram = this.program = await createProgramFrom(gl,
            "./shaders/texture-draw/texture-draw-vertex-shader.vert",
            "./shaders/texture-draw/texture-draw-fragment-shader.frag");

        gl.useProgram(textureDisplayProgram);

        let uniformLocations = getUniformLocations(gl, textureDisplayProgram, ["u_texture"]);
        gl.uniform1i(uniformLocations["u_texture"], this.textureUnit);

        let attributeLocations = getAttributeLocations(gl, textureDisplayProgram, ["a_position"]);

        let vao = this.vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(attributeLocations["a_position"]);
        gl.vertexAttribPointer(attributeLocations["a_position"], 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    },
    update(inputTexture) {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.bindVertexArray(this.vao);
        gl.bindTexture(gl.TEXTURE_2D + this.textureUnit, inputTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    },
};