/**
 * Waits for the specified webGl client to finished its operations.
 * @param gl The webGl context to wait for.
 * @param sync The fenceSync object on which to wait on.
 * @param flags A bitwise combination if glEnum commands controlling the flushing behavior.
 * @param interval_ms The interval in milliseconds that it should wait between every request to the client.
 * @returns {Promise<unknown>} A Promise which will be resolved once the webGl client has finished the operations
 *  defined inside the fenceSync object.
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
 * Waits for the webGl client to finished its buffers operation then retrieves the data from the given buffer
 * and stores it in the target array.
 * @param gl The webGl context to use.
 * @param target The target array on which to store the buffer data.
 * @param buffer The buffer instance from which to retrieve the data.
 * @param srcByteOffset The byte offset from which to start reading the buffer data.
 * @param length The number of element to copy. If 0 or undefined -> copies the entirety of the buffer.
 * @returns {Promise<*>}
 */
export async function getBufferSubDataAsync(gl, target, buffer, srcByteOffset, length) {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    await clientWaitAsync(gl, sync, 0, 10);
    gl.deleteSync(sync);

    gl.bindBuffer(target, buffer);
    gl.getBufferSubData(target, srcByteOffset, length);
    gl.bindBuffer(target, null);
}
