import {degToRad, m3, vector2} from "../../webGlUtils/math-utils.js";
import {Color} from "../../webGlUtils/color-utils.js";

export const SquareVertexArray = {
    create(gl, position, scale, rotation, color, uniformMatrixLocation, uniformColorLocation, attributePositionLocation) {
        let vao = gl.createVertexArray();
        this.bindInstance(vao, gl);

        let matrix = m3.translation(-0.5, -0.5);
        matrix = m3.scale(matrix, scale.x, scale.y);
        matrix = m3.rotation(rotation * degToRad);
        matrix = m3.translation(matrix, position.x, position.y);

        gl.uniformMatrix3fv(uniformMatrixLocation, false, matrix);

        Color.setProgramColor(gl, uniformColorLocation, color);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(attributePositionLocation);
        gl.vertexAttribPointer(attributePositionLocation, 2, gl.FLOAT, false, 0, 0);

        return vao;
    },
    bindInstance(squareVertexArray, gl) {
        gl.bindVertexArray(squareVertexArray);
    },
    draw(squareVertexArray, gl) {
        this.bindInstance(squareVertexArray, gl);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
};

const basePositionIndices = [
    0, 0,
    1, 0,
    1, 1,
    0, 0,
    1, 1,
    0, 1,
];