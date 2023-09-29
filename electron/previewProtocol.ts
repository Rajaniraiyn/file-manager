import { protocol } from "electron";

export function enablePreviewProtocol() {
    const protocolName = "preview";
    protocol.registerFileProtocol(protocolName, (request, callback) => {
        const url = request.url.slice(`${protocolName}://`.length);
        callback({ path: url });
    });
}