export const Color = {
    create(r, g, b, a = 1) {
        return {
            r, g, b, a,
        };
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
    get black() {
        return this.create(0, 0, 0);
    },
    get yellow() {
        return this.create(1, 1, 0);
    },
    get cyan() {
        return this.create(0, 1, 1);
    },
    get purple() {
        return this.create(1, 0, 1);
    },
};
