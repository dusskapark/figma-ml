export const uint8ArrayToObjectURL = (data: Uint8Array): string => {
    return URL.createObjectURL(new Blob([data], {type: 'image/png'}));
};
