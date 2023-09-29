
const icons = {
    file: "https://img.icons8.com/?size=100&id=DVzc1vi8FDJt&format=png",
    folder: "https://img.icons8.com/?size=100&id=MQUrzsTq4kA3&format=png",
    pdf: "https://img.icons8.com/?size=100&id=d2H6kHCiPSIg&format=png",
    image: "https://img.icons8.com/?size=100&id=TA1dhLHUqFQV&format=png",
    video: "https://img.icons8.com/?size=100&id=9pYYRMkYN2BY&format=png",
    movies: "https://img.icons8.com/?size=100&id=zUp64XaiqHhQ&format=png",
    music: "https://img.icons8.com/?size=100&id=qUrjwzmP7ZFz&format=png",
    pictures: "https://img.icons8.com/?size=100&id=6o5efO94uFDw&format=png",
    downloads: "https://img.icons8.com/?size=100&id=yGBEe6Dss9zK&format=png",
    documents: "https://img.icons8.com/?size=100&id=VaM8ApUEJzn8&format=png",
    desktop: "https://img.icons8.com/?size=100&id=rnDs41vgylGN&format=png",
    pc: "https://img.icons8.com/?size=100&id=rnDs41vgylGN&format=png",
    ssd: "https://img.icons8.com/?size=100&id=Bf7oS5wXY7ik&format=png",
}

function chooseIcon(name: string, type: 'file' | 'folder') {
    if (type === 'folder') {
        const sanitized_name = name.trim().toLowerCase();
        if (Object.keys(icons).includes(sanitized_name)) {
            return icons[sanitized_name as keyof typeof icons];
        }
        return icons.folder;
    }
    const extension = name.split(".").pop();
    switch (extension) {
        case "pdf":
            return icons.pdf;
        case "png":
        case "jpg":
        case "jpeg":
        case "svg":
        case "webp":
        case "bmp":
            return icons.image;
        case "gif":
        case "mp4":
        case "avi":
        case "mkv":
            return icons.video;
        default:
            return icons.file;
    }
}

export function fileOrFolder(name: string, type: 'file' | 'folder' = 'file', path: string) {
    return `
    <figure class="content" title="${name}" data-path="${path}">
        <img src="${chooseIcon(name, type)}" alt="${type}" />
        <figcaption>${name}</figcaption>
    </figure>
    `.trim();
}

export function pinnedFolder(name: string) {
    return `
    <figure class="content" title="${name}">
        <img src="${chooseIcon(name, 'folder')}" alt="folder" />
        <figcaption>${name}</figcaption>
    </figure>
    `.trim();
}

export async function previewFile(path: string) {
    const videoFiles = ["mp4", "webm", "mkv"];
    const audioFiles = ["mp3", "waw", "ogg", "flac", "aac", "m4a", "opus"];
    const imageFiles = ["png", "jpg", "jpeg", "webp", "bmp", "gif", "svg", "ico", "tiff"];
    const pdfFiles = ["pdf"];
    const textFiles = ["txt", "json", "csv", "md", "html", "css", "js", "jsx", "ts", "tsx", "xml", "yaml", "yml", "ini", "toml", "log", "bat", "sh", "ps1", "psm1", "psd1", "ps1xml", "pssc", "reg", "scf", "scpt", "vbs", "wsf", "wsh", "cer", "cert", "pem", "p7b", "p7r", "spc", "der", "crt", "key", "pfx", "p12", "asc", "gpg", "sig", "enc", "lock"];

    const ext = path.split(".").pop()!;

    if (textFiles.includes(ext)) {
        const text = await window.ipcRenderer.invoke("fs:readFile", path);
        return `
        <pre>${text}</pre>
        `.trim();
    }

    path = "preview://" + path;

    if (videoFiles.includes(ext)) {
        return `
        <video autoplay loop muted>
            <source src="${path}" type="video/${ext}" />
        </video>
        `.trim();
    }

    if (audioFiles.includes(ext)) {
        return `
        <audio controls autoplay>
            <source src="${path}" type="audio/${ext}" />
        </audio>
        `.trim();
    }

    if (imageFiles.includes(ext)) {
        return `
        <img src="${path}" alt="${path}" />
        `.trim();
    }

    if (pdfFiles.includes(ext)) {
        return `
        <embed src="${path}" type="application/pdf" />
        `.trim();
    }

    return `
    <p>
        Preview not available.
        Please click on some other file to preview
    </p>
    `.trim();
}

export function tab(path: string, key: number) {
    const name = path.split("/").pop()!;
    return `
        <div class="tab" data-path="${path}" data-key="${key}">
            <img src="${chooseIcon(name, 'folder')}" alt="folder" />
            <span class="title">${name}</span>
            <i>close</i>
        </div>
    `.trim();
}