import { type IpcMainInvokeEvent, ipcMain } from "electron";
import { FileSystem } from "./files";

export function enableIPC() {

    for (let method in FileSystem) {
        type Args = Parameters<typeof FileSystem[keyof typeof FileSystem]>;

        let handler = async function (_event: IpcMainInvokeEvent, ...args: Args) {
            try {
                // @ts-ignore
                return await FileSystem[method as keyof typeof FileSystem](...args);
            } catch (err) {
                console.error(err);
                return err;
            }
        }

        // @ts-ignore
        ipcMain.handle(`fs:${method}`, handler);
    }

}