export function string2DOMElement(html: string) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');
    return doc.body.firstChild;
}