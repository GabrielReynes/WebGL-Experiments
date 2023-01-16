/*
    This script contains all the utility methods, values,
    and objects needed to perform simple operations
    with mathematical data structure.
 */

// Degrees-to-radians conversion constant.
const degToRad = Math.PI / 180;
// Radians-to-degrees conversion constant.
const radToDeg = 180 / Math.PI;

/*
    Representation of 2D vectors and points.
 */
let vector2 = {
    /**
     * Creates a new vector2 object
     * @param _x The x component of the new vector2
     * @param _y The y component of the new vector2
     * @returns The newly created vector2 object.
     */
    create(_x, _y) {
        return {x: _x, y: _y};
    },
    /**
     * Copy the values of the update vector2 into the base vector2 object.
     * @param base The vector2 object to be updated.
     * @param update The vector2 reference object.
     */
    set(base, update) {
        base.x = update.x;
        base.y = update.y;
    },
    /**
     * Shorthand for writing vector2.create(0, 0).
     */
    zero() {
        return this.create(0, 0);
    },
    /**
     * Shorthand for writing vector2.create(1, 1).
     */
    one() {
        return this.create(1, 1);
    },
    /**
     * Shorthand for writing vector2.create(1, 0).
     */
    right() {
        return this.create(1, 0);
    },
    /**
     * Shorthand for writing vector2.create(0, 1).
     */
    up() {
        return this.create(0, 1);
    },
    /**
     * Shorthand for writing vector2.create(-1, 0).
     */
    left() {
        return this.create(-1, 0);
    },
    /**
     * Shorthand for writing vector2.create(0, -1).
     */
    down() {
        return this.create(0, -1);
    },
    /**
     * @returns A new vector2 object corresponding to the sum of the vector2 objects a and b.
     */
    add(a, b) {
        return this.create(a.x + b.x, a.y + b.y);
    },
    /**
     * @returns A new vector2 object corresponding to the difference of the vector2 objects a and b.
     */
    sub(a, b) {
        return this.create(a.x - b.x, a.y - b.y);
    },
    /**
     * @returns A new vector2 object corresponding to the vector2 object a components scaled by f
     */
    factor(a, f) {
        return this.create(a.x * f, a.y * f);
    },
    /**
     * @returns A new vector2 object corresponding to the multiplication result of the vector2 objects a and b.
     */
    multiply(a, b) {
        return this.create(a.x * b.x, a.y * b.y);
    },
    /**
     * @returns The magnitude of the given vector2.
     */
    magnitude(vector) {
        return Math.sqrt(this.sqrMagnitude(vector));
    },
    /**
     * @returns The squared magnitude of the given vector2.
     */
    sqrMagnitude(vector) {
        return vector.x * vector.x + vector.y * vector.y;
    },
    /**
     * @returns The magnitude of the given vector2.
     */
    distance(vectorA, vectorB) {
        return this.magnitude(this.sub(vectorA, vectorB));
    },
    /**
     * @returns The squared magnitude of the given vector2.
     */
    sqrDistance(vectorA, vectorB) {
        return this.sqrMagnitude(this.sub(vectorA, vectorB));
    },
    /**
     * @returns The dot product of the vector2 objects a and b.
     */
    dot(a, b) {
        return a.x * b.x + a.y * b.y;
    },
    /**
     * @returns The cross product of the vector2 objects a and b.
     */
    cross(p1, p2) {
        return p1.x * p2.y - p2.x * p1.y;
    },
    /**
     * @returns A new vector2 object corresponding to the multiplication of the vector2 object 'vector'
     * and the matrix3 object 'matrix'.
     */
    applyMatrix(vector, matrix) {
        return this.create(
            vector.x * matrix[0] + vector.y * matrix[3] + matrix[6],
            vector.x * matrix[1] + vector.y * matrix[4] + matrix[7],
        );
    },
    /**
     * @returns A new vector2 object sharing the same direction as the given vector2 object 'vector'
     * but with a length of 1.
     */
    normalize(vector) {
        let magnitude = this.magnitude(vector);
        return this.create(vector.x / magnitude, vector.y / magnitude);
    },
    /**
     * @returns A new vector3 object with x and y components corresponding to those the vector2 object 'vector'.
     */
    asVector3(vector) {
        return vector3.create(vector.x, vector.y, 0);
    },
    /**
     * @returns A copy of the given vector2 object.
     */
    copy(vector) {
        return vector2.create(vector.x, vector.y);
    },
    /**
     * Linearly interpolates between vectors a and b by t.
     * When t = 0 returns a.
     * When t = 1 return b.
     * When t = 0.5 returns the midpoint of a and b.
     * @returns The result of the linear interpolation between vectorA and vectorB.
     */
    lerp(a, b, t) {
        return this.add(a, this.factor(this.sub(b, a), t));
    },
    /**
     * @returns {boolean} Whether the two given vectors are equals.
     */
    equals(a, b) {
        return a.x === b.x && a.y === b.y;
    },
    /**
     * @returns A copy of the given vector with absolute values for each of its components.
     */
    abs(vector) {
        return this.create(Math.abs(vector.x), Math.abs(vector.y));
    },
    /**
     * Returns the angle in radians between the given vector and the unit right vector.
     * @param vector
     */
    angle(vector) {
        return Math.acos(vector.x / this.magnitude(vector)) * (vector.y < 0 ? -1 : 1)
    }
};

/*
    Representation of 3D vectors and points.
 */
let vector3 = {
    /**
     * Creates a new vector3 object
     * @param _x The x component of the new vector2
     * @param _y The y component of the new vector2
     * @param _z The z component of the new vector2
     * @returns The newly created vector3 object.
     */
    create(_x, _y, _z) {
        return {x: _x, y: _y, z: _z};
    },
    /**
     * Copy the values of the update vector2 into the base vector3 object.
     * @param base The vector3 object to be updated.
     * @param update The vector3 reference object.
     */
    set(base, update) {
        base.x = update.x;
        base.y = update.y;
        base.z = update.z;
    },
    /**
     * Shorthand for writing vector3.create(0, 0, 0).
     */
    zero() {
        return this.create(0, 0, 0);
    },
    /**
     * Shorthand for writing vector3.create(1, 1, 1).
     */
    one() {
        return this.create(1, 1, 1);
    },
    /**
     * @returns A new vector3 object corresponding to the sum of the vector3 objects a and b.
     */
    add(a, b) {
        return this.create(a.x + b.x, a.y + b.y, a.z + b.z);
    },
    /**
     * @returns A new vector3 object corresponding to the difference of the vector3 objects a and b.
     */
    sub(a, b) {
        return this.create(a.x - b.x, a.y - b.y, a.z - b.z);
    },
    /**
     * @returns A new vector3 object corresponding to the vector3 object a components scaled by f
     */
    factor(a, f) {
        return this.create(a.x * f, a.y * f, a.z * f);
    },
    /**
     * @returns A new vector3 object corresponding to the multiplication result of the vector3 objects a and b.
     */
    multiply(a, b) {
        return this.create(a.x * b.x, a.y * b.y, a.z * b.z);
    },
    /**
     * @returns The magnitude of the given vector3.
     */
    magnitude(vector) {
        return Math.sqrt(this.sqrMagnitude(vector));
    },
    /**
     * @returns The squared magnitude of the given vector3.
     */
    sqrMagnitude(vector) {
        return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
    },
    /**
     * @returns The dot product of the vector3 objects a and b.
     */
    dot(a, y) {
        return a.x * y.x + a.y * y.y + a.z + y.z;
    },
    /**
     * @returns The cross product of the vector3 objects a and b.
     */
    cross(a, b) {
        return this.create(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    },
    /**
     * @returns A new vector3 object sharing the same direction as the given vector3 object 'vector'
     * but with a length of 1.
     */
    normalize(vector) {
        let magnitude = this.magnitude(vector);
        return this.create(vector.x / magnitude, vector.y / magnitude, vector.z / magnitude);
    },
    /**
     * Linearly interpolates between vectors a and b by t.
     * When t = 0 returns a.
     * When t = 1 return b.
     * When t = 0.5 returns the midpoint of a and b.
     * @returns The result of the linear interpolation between vectorA and vectorB.
     */
    lerp(a, b, t) {
        return this.add(a, this.factor(this.sub(b, a), t));
    },
};

/*
    Representation of a 3x3 matrix.
 */
let m3 = {
    /**
     * @returns The 3X3 identity matrix.
     */
    identity() {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ];
    },

    /**
     * @returns The result of the multiplication of the matrices a and b.
     */
    multiply(a, b) {
        const a00 = a[0 * 3 + 0];
        const a01 = a[0 * 3 + 1];
        const a02 = a[0 * 3 + 2];
        const a10 = a[1 * 3 + 0];
        const a11 = a[1 * 3 + 1];
        const a12 = a[1 * 3 + 2];
        const a20 = a[2 * 3 + 0];
        const a21 = a[2 * 3 + 1];
        const a22 = a[2 * 3 + 2];
        const b00 = b[0 * 3 + 0];
        const b01 = b[0 * 3 + 1];
        const b02 = b[0 * 3 + 2];
        const b10 = b[1 * 3 + 0];
        const b11 = b[1 * 3 + 1];
        const b12 = b[1 * 3 + 2];
        const b20 = b[2 * 3 + 0];
        const b21 = b[2 * 3 + 1];
        const b22 = b[2 * 3 + 2];

        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    },

    /**
     * Returns the inverse of the given 3x3 matrix.
     */
    inverse(m) {
        const m00 = m[0 * 3 + 0];
        const m01 = m[0 * 3 + 1];
        const m02 = m[0 * 3 + 2];
        const m10 = m[1 * 3 + 0];
        const m11 = m[1 * 3 + 1];
        const m12 = m[1 * 3 + 2];
        const m20 = m[2 * 3 + 0];
        const m21 = m[2 * 3 + 1];
        const m22 = m[2 * 3 + 2];

        const b01 = m22 * m11 - m12 * m21;
        const b11 = -m22 * m10 + m12 * m20;
        const b21 = m21 * m10 - m11 * m20;

        const det = m00 * b01 + m01 * b11 + m02 * b21;
        const invDet = 1.0 / det;

        let dst = new Array(9);

        dst[0] = b01 * invDet;
        dst[1] = (-m22 * m01 + m02 * m21) * invDet;
        dst[2] = (m12 * m01 - m02 * m11) * invDet;
        dst[3] = b11 * invDet;
        dst[4] = (m22 * m00 - m02 * m20) * invDet;
        dst[5] = (-m12 * m00 + m02 * m10) * invDet;
        dst[6] = b21 * invDet;
        dst[7] = (-m21 * m00 + m01 * m20) * invDet;
        dst[8] = (m11 * m00 - m01 * m10) * invDet;

        return dst;
    },

    /**
     * @returns The projection matrix allowing for the transformation of points inside a space of size
     * (width / pixelPerUnit) x (height / pixelPerUnit) to a space contained between -1 and 1
     */
    projection(width, height, pixelPerUnit = 1) {
        return [
            2 * pixelPerUnit / width,   0,                          0,
            0,                          2 * pixelPerUnit / height,  0,
            -1,                         -1,                         1,
        ];
    },

    /**
     * @returns The matrix allowing for the translation of a vector by tx on its x component and
     * ty on its y component.
     */
    translation(tx, ty) {
        return [
            1,  0,  0,
            0,  1,  0,
            tx, ty, 1,
        ];
    },

    /**
     * @returns The matrix allowing for the rotation of a vector a given amount of radians.
     */
    rotation(angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        return [
            c,  -s,  0,
            s,  c,   0,
            0,  0,   1,
        ];
    },

    /**
     * @returns The matrix allowing for the scaling of a vector's component respectively by sx for its x component
     * and sy for its y component.
     */
    scaling(sx, sy) {
        return [
            sx, 0,  0,
            0,  sy, 0,
            0,  0,  1,
        ];
    },

    /**
     * @returns The result of the multiplication of the matrix 'm' with the projection matrix built with the given
     * parameters.
     */
    project(m, width, height, ppu = 1) {
        return this.multiply(m, this.projection(width, height, ppu));
    },

    /**
     * @returns The result of the multiplication of the matrix 'm' with the translation matrix built with the given
     * parameters.
     * @see translation
     */
    translate(m, tx, ty) {
        return this.multiply(m, this.translation(tx, ty));
    },

    /**
     * @returns The result of the multiplication of the matrix 'm' with the rotation matrix built with the given
     * parameters.
     * @see rotation
     */
    rotate(m, angleInRadians) {
        return this.multiply(m, this.rotation(angleInRadians));
    },

    /**
     * @returns The result of the multiplication of the matrix 'm' with the scaling matrix built with the given
     * parameters
     * @see scaling.
     */
    scale(m, sx, sy) {
        return this.multiply(m, this.scaling(sx, sy));
    },
    /**
     * @returns The 3x3 matrix corresponding to the operation of a coordinate flip on the X axis.
     */
    flipX() {
        return [
            -1, 0, 0,
             0, 1, 0,
             1, 0, 1,
        ];
    },
    /**
     * @returns The 3x3 matrix corresponding to the operation of a coordinate flip on the Y axis.
     */
    flipY() {
        return [
            1, 0, 0,
            0,-1, 0,
            0, 1, 1,
        ];
    },

};

export {degToRad, radToDeg, vector2, vector3, m3};