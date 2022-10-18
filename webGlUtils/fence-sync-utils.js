/**
 * TODO
 * @param gl
 * @param sync
 * @param flags
 * @param interval_ms
 * @returns {Promise<unknown>}
 */
function clientWaitAsync(gl, sync, flags, interval_ms) {
    return new Promise((resolve, reject) => {
        function test() {
            const res = gl.clientWaitSync(sync, flags, 0);
            if (res === gl.WAIT_FAILED) {
                reject();
                return;
            }
            if (res === gl.TIMEOUT_EXPIRED) {
                setTimeout(test, interval_ms);
                return;
            }
            resolve();
        }
        test();
    });
}

/**
 * TODO
 * @param gl
 * @param target
 * @param buffer
 * @param srcByteOffset
 * @param dstBuffer
 * @returns {Promise<*>}
 */
export async function getBufferSubDataAsync(gl, target, buffer, srcByteOffset, dstBuffer) {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    await clientWaitAsync(gl, sync, 0, 10);
    gl.deleteSync(sync);

    gl.bindBuffer(target, buffer);
    gl.getBufferSubData(target, srcByteOffset, dstBuffer);
    gl.bindBuffer(target, null);

    return dstBuffer;
}
