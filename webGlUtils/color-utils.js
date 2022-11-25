export const Color = {
    create(r, g, b, a = 1) {
        return {
            r, g, b, a,
        };
    },
    setProgramColor(gl, attributeLocation, color) {
        debugger;
        gl.uniform4f(attributeLocation, color.r, color.g, color.b, color.a);
    },
    get red() {
        return this.create(1, 0, 0);
    },
    get green() {
        return this.create(0, 1, 0);
    },
    get blue() {
        return this.create(0, 0, 1);
    },
    get white() {
        return this.create(1, 1, 1);
    },
};
