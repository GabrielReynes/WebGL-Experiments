function fetchLocation(programBoundFetch, locationContainer, prefix = "") {
    for (const [key, value] of Object.entries(locationContainer)) {
        const variableName = `${prefix}${key}`;
        if (value && typeof value === 'object') fetchLocation(programBoundFetch, value, `${variableName}.`);
        else locationContainer[key] = programBoundFetch(variableName);
    }
}

export function fetchAttributeLocations(gl, program, locationContainer) {
    fetchLocation(gl.getAttribLocation.bind(gl, program), locationContainer);
}

export function fetchUniformLocations(gl, program, locationContainer) {
    fetchLocation(gl.getUniformLocation.bind(gl, program), locationContainer);
}

function nameArrayToContainer(nameArray) {
    return Object.fromEntries(nameArray.flatMap(elm => [elm, undefined]));
}

export function getAttributeLocations(gl, program, attributesNames) {
    let container = nameArrayToContainer(attributesNames);
    fetchAttributeLocations(gl, program, container);
    return container;
}


export function getUniformLocations(gl, program, uniformNames) {
    let container = nameArrayToContainer(uniformNames);
    fetchUniformLocations(gl, program, container);
    return container;
}