export const Color = {
    mul(color, factor) {
        return this.create(color.r * factor, color.g * factor, color.b * factor, color.a);
    },
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
    /**
     * Creates an RGB color from OKLab color space parameters
     * @param {number} L - Lightness (0-1)
     * @param {number} a - Green-red axis (typically -0.4 to 0.4)
     * @param {number} b - Blue-yellow axis (typically -0.4 to 0.4)
     * @param {number} alpha - Alpha channel (0-1, default 1)
     * @returns {Object} Color object with r, g, b, a properties
     */
    fromOKLab(L, a, b, alpha = 1) {
        // OKLab to Linear sRGB conversion
        // Step 1: OKLab -> Linear OKLab (via inverse OKLab transformation)
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        // Step 2: Linear OKLab -> Linear sRGB (via inverse OKLab to LMS, then LMS to sRGB)
        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        // LMS to Linear sRGB matrix
        const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const b_linear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        // Step 3: Linear sRGB -> sRGB (gamma correction)
        const gamma = (c) => {
            if (c >= 0.0031308) {
                return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
            } else {
                return 12.92 * c;
            }
        };

        // Clamp to valid RGB range [0, 1]
        const r_final = Math.max(0, Math.min(1, gamma(r)));
        const g_final = Math.max(0, Math.min(1, gamma(g)));
        const b_final = Math.max(0, Math.min(1, gamma(b_linear)));

        return this.create(r_final, g_final, b_final, alpha);
    },
};
