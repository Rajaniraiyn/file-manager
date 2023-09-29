import { fileOrFolder, previewFile, tab } from "./elements";
import { string2DOMElement } from "./helpers";

import "./style.css";

// using IIFE to avoid polluting global scope, using top level await and preventing potential memory leaks
(async () => {
  function mainCall(fn: string, ...args: any[]) {
    return window.ipcRenderer.invoke(fn, ...args);
  }

  async function homedir() {
    return await mainCall("fs:homedir");
  }

  const UI = {
    app: document.getElementById("app")!,
    main: document.getElementById("main")!,
    nav: document.getElementById("nav")!,
    sidebar: document.getElementById("sidebar")!,
    preview: document.getElementById("preview")!,
    contextmenu: document.getElementById("contextmenu")!,
    tabs: document.getElementById("tabs")!,
  }

  let STORE = new Proxy({
    root: await homedir(),
    history: {
      previous: [] as string[],
      next: [] as string[],
    },
    pinned: ["Desktop", "Documents", "Downloads", "Music", "Pictures",],
  }, {
    set(target, prop, value) {
      target[prop as keyof typeof target] = value;
      update();
      return true;
    }
  });

  const TABS = [
    STORE
  ]

  async function populateContents() {
    const contents = await mainCall("fs:readdir", STORE.root);

    UI.main.innerHTML = contents
      .filter(({ name }: { name: string }) => !name.startsWith(".")) // hide hidden files
      .map(({ name, type }: { name: string, type: 'file' | 'folder' }) => {
        const path = `${STORE.root}/${name}`;
        return fileOrFolder(name, type, path);
      }).join("\n");

  }

  async function populateSidebar() {
    const contents = await mainCall("fs:readdir");

    const home = await homedir();

    UI.sidebar.querySelector(".pinned-folders")!.innerHTML = contents
      .filter(({ name }: { name: string }) => STORE.pinned.includes(name)) // only show pinned folders
      .map(({ name, type }: { name: string, type: 'file' | 'folder' }) => {
        const path = `${home}/${name}`;
        return fileOrFolder(name, type, path);
      }).join("\n");
  }

  async function setBreadcrumb() {
    UI.nav.querySelector("#breadcrumb")!.innerHTML = STORE.root
  }

  let activeTabIndex = 0;
  function populateTabs() {
    UI.tabs.querySelectorAll(".tab").forEach(el => el.remove());
    TABS.forEach((tabStore, i) => {
      const tabElement = string2DOMElement(tab(tabStore.root, i))! as HTMLElement;
      if (i === activeTabIndex) tabElement.classList.add("active");
      UI.tabs.appendChild(tabElement);
    });
  }

  async function update() {
    /* The Below Functions must not mutate STORE Object */
    /* Because it might cause circular reference issues */
    await populateContents();
    await setBreadcrumb();
    await populateSidebar();
    populateTabs();
  }
  update();

  function attachEvents() {

    function fileOrFolderNavigationHandler(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const path = target.dataset.path || target.parentElement!.dataset.path;
      if (!path) return;
      STORE.history.previous.push(STORE.root);
      STORE.root = path;
    }

    UI.app.addEventListener("dblclick", fileOrFolderNavigationHandler);
    UI.sidebar.addEventListener("click", fileOrFolderNavigationHandler);

    async function fileOrFolderPreviewHandler(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const path = target.dataset.path || target.parentElement!.dataset.path;
      if (!path) return;

      UI.preview.innerHTML = (await previewFile(path))!;

    }

    UI.app.addEventListener("click", fileOrFolderPreviewHandler);

  }
  attachEvents();

  function handleNavigation() {
    const nav = {
      forward: UI.nav.querySelector(".forward")!,
      backward: UI.nav.querySelector(".backward")!,
      up: UI.nav.querySelector(".upward")!,
    }

    function forward() {
      if (STORE.history.next.length === 0) return;
      STORE.history.previous.push(STORE.root);
      STORE.root = STORE.history.next.pop()!;
    }

    function backward() {
      if (STORE.history.previous.length === 0) return;
      STORE.history.next.push(STORE.root);
      STORE.root = STORE.history.previous.pop()!;
    }

    function upward() {
      const parentPath = STORE.root.split("/").slice(0, -1).join("/");
      if (parentPath === "") return;
      STORE.history.previous.push(STORE.root);
      STORE.root = parentPath;
    }

    nav.forward.addEventListener("click", forward);
    nav.backward.addEventListener("click", backward);
    nav.up.addEventListener("click", upward);

  }
  handleNavigation();

  function handleContextmenu() {

    function resetContextmenu() {
      UI.contextmenu.querySelectorAll(".context-menu").forEach(el => el.classList.remove("active"));
      UI.app.removeEventListener("click", resetContextmenu);
    }

    UI.main.addEventListener("contextmenu", (e) => {
      resetContextmenu();

      UI.app.addEventListener("click", resetContextmenu, { once: true });

      if (e.target === UI.main) {
        UI.contextmenu.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        UI.contextmenu.querySelector(".context-menu.for-empty")?.classList.add("active");
        return;
      }
      let path = (e.target as HTMLElement).dataset.path || (e.target as HTMLElement).parentElement!.dataset.path;
      if (path) {
        UI.contextmenu.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        UI.contextmenu.querySelector(".context-menu.for-file")?.classList.add("active");
      }

    });
  }
  handleContextmenu();

  function tabsService() {

    UI.tabs.querySelector(".new-tab")!.addEventListener("click", async () => {
      STORE = new Proxy({
        root: await homedir(),
        history: {
          previous: [] as string[],
          next: [] as string[],
        },
        pinned: STORE.pinned,
      }, {
        set(target, prop, value) {
          target[prop as keyof typeof target] = value;
          update();
          return true;
        }
      });

      TABS.push(STORE);
      activeTabIndex = TABS.length - 1;
      update();
    });

    UI.tabs.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("tab")) {
        target.classList.add("active");
        activeTabIndex = parseInt(target.dataset.key!);
        STORE = TABS[activeTabIndex];
      }

      const parentElement = target.parentElement!;
      if (parentElement.classList.contains("tab")) {
        parentElement.classList.add("active");
        activeTabIndex = parseInt(parentElement.dataset.key!);
        STORE = TABS[activeTabIndex];
      }

      if (target.innerText === "close" && TABS.length > 1) {
        const key = parseInt(target.parentElement!.dataset.key!);
        TABS.splice(key, 1);
        if (key === activeTabIndex) {
          activeTabIndex = TABS.length - 1;
          STORE = TABS[activeTabIndex];
        }
      }
      update();
    });

  }
  tabsService();

})()