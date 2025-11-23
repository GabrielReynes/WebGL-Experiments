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
    get orange() {
        return this.create(1, 0.5, 0);
    },
    get brown() {
        return this.create(0.5, 0.25, 0);
    },
    get gray() {
        return this.create(0.5, 0.5, 0.5);
    },
    get pink() {
        return this.create(1, 0.5, 0.5);
    },
    get lime() {
        return this.create(0.5, 1, 0.5);
    },
    get teal() {
        return this.create(0, 0.5, 0.5);
    },
    get indigo() {
        return this.create(0.5, 0, 1);
    },
    get violet() {
        return this.create(0.5, 0, 0.5);
    },
    get magenta() {
        return this.create(1, 0, 1);
    },
    get slate() {
        return this.create(0.18, 0.24, 0.31);
    },
};
