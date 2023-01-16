import {vector2} from "./math-utils.js";

export function randrange(start, end) {
    return start + (end - start) * Math.random();
}

export function randomVectorInsideUnitCircle() {
    let vec;
    do {
        vec = vector2.create(Math.random() * 2 - 1, Math.random() * 2 - 1)
    } while (vector2.sqrMagnitude(vec) > 1);
    return vec;
}