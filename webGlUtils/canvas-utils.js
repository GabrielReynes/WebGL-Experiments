/**
 * This function allows us to ensure that the canvas resolution always match its size onto the browser window.
 * @param canvas The canvas which needs to be resized.
 * @param devicePixelRatio The window ratio between CSS pixels and real pixels.
 * @returns {boolean} Whether the canvas was resized. This value can be used to now if th viewport needs to be changed.
 */
export function resizeCanvas(canvas, devicePixelRatio = 1) {
    let realClientWidth = canvas.clientWidth * devicePixelRatio;
    let realClientHeight = canvas.clientHeight * devicePixelRatio;

    let needsResize = canvas.width !== realClientWidth || canvas.height !== realClientHeight;

    if (needsResize) {
        canvas.width = realClientWidth;
        canvas.height = realClientHeight;
    }

    return needsResize;
}