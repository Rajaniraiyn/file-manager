import { PathLike } from "node:fs";
import { mkdir, rm, cp, rename, readdir, writeFile, readFile, copyFile } from "node:fs/promises"
import { homedir } from "node:os";
import { join } from "node:path"


const FileSystem = {
    homedir() {
        return homedir();
    },

    async readdir(path: PathLike = homedir()) {
        const contents = await readdir(path, { withFileTypes: true });
        return contents.map((item) => {
            return {
                name: item.name,
                type: item.isDirectory() ? "folder" : "file"
            }
        });
    },

    async writeFile(path: string, content: string) {
        if (!path.startsWith(homedir())) path = join(homedir(), path);
        return await writeFile(path, content);
    },

    async readFile(path: string) {
        return (await readFile(path)).toString();
    },

    async mkdir(path: string) {
        if (path.startsWith(homedir())) {
            return mkdir(path);
        } else {
            return mkdir(join(homedir(), path));
        }
    },

    async rm(path: string) {
        if (path.startsWith(homedir())) {
            return rm(path);
        } else {
            return rm(join(homedir(), path));
        }
    },

    async cp(path: string, dest: string) {
        if (!path.startsWith(homedir())) path = join(homedir(), path);
        if (!dest.startsWith(homedir())) dest = join(homedir(), dest);
        return cp(path, dest);
    },

    async rename(oldPath: string, newPath: string) {
        if (!oldPath.startsWith(homedir())) oldPath = join(homedir(), oldPath);
        if (!newPath.startsWith(homedir())) newPath = join(homedir(), newPath);
        return rename(oldPath, newPath);
    },

    async copyFile(oldPath: string, newPath: string) {
        if (!oldPath.startsWith(homedir())) oldPath = join(homedir(), oldPath);
        if (!newPath.startsWith(homedir())) newPath = join(homedir(), newPath);
        return copyFile(oldPath, newPath);
    },
}

export { FileSystem };