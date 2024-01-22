"use strict";

const app = {
    i18n: function () {
        document.querySelectorAll("[data-text]").forEach((container) => {
            container.innerText = app.getI18n(container.dataset.text);
        });
        document.querySelectorAll("[data-title]").forEach((container) => {
            container.title = app.getI18n(container.dataset.title);
        });
    },
    getI18n: function (id) {
        return chrome.i18n.getMessage(id);
    },

    dom: {
        // components
        themeLink: document.getElementById("themeLink"),
        wrapper: document.querySelector(".wrapper"),
        header: document.querySelector(".header"),
        asides: document.querySelectorAll("aside"),
        scrollButton: document.getElementById("scrollButton"),

        // header controls
        searchInput: document.getElementById("search"),
        controlButtons: document.querySelectorAll(".control__item"),
        controlButtonSetting: document.getElementById("controlButtonSetting"),
        controlButtonRefresh: document.getElementById("controlButtonRefresh"),

        // bookmarks
        bookmark: document.getElementById("bookmarks"),
        folders: function () { return document.querySelectorAll(".bookmarks__folder"); },
        links: function () { return document.querySelectorAll("[data-url]"); },

        // setting panel
        setting: document.querySelector(".settings"),
        settingResetButton: document.getElementById("settingResetButton"),
        settingOpenBookmarkManager: document.getElementById("settingOpenBookmarkManager"),
        settingDefaultTheme: document.getElementById("settingDefaultTheme"),
        settingPopupMinWidth: document.getElementById("settingPopupMinWidth"),
        settingPopupMaxWidth: document.getElementById("settingPopupMaxWidth"),
        settingPopupMinHeight: document.getElementById("settingPopupMinHeight"),
        settingPopupMaxHeight: document.getElementById("settingPopupMaxHeight"),
        settingLinkOpenPolicy: document.getElementById("settingLinkOpenPolicy"),
        settingBookmarkRoot: document.getElementById("settingBookmarkRoot"),
        settingSearchIncludeUrl: document.getElementById("settingSearchIncludeUrl"),
        settingEnableDoubleClick: document.getElementById("settingEnableDoubleClick"),
        settingDoubleClickDetectDelay: document.getElementById("settingDoubleClickDetectDelay"),
        settingShowScrollToTopButton: document.getElementById("settingShowScrollToTopButton"),

        // link editor
        linkEditor: document.querySelector(".link-editor"),
        linkEditorForm: document.getElementById("linkEditorForm"),
        linkEditorBookmarkTitle: document.getElementById("linkEditorBookmarkTitle"),
        linkEditorBookmarkUrl: document.getElementById("linkEditorBookmarkUrl"),
        linkEditorUpdateButton: document.getElementById("linkEditorUpdateButton"),
        linkEditorCloseButton: document.getElementById("linkEditorCloseButton"),
        linkEditorRemoveButton: document.getElementById("linkEditorRemoveButton"),
        linkEditorOpenInBackground: document.getElementById("linkEditorOpenInBackground"),
        linkEditorOpenInPrivate: document.getElementById("linkEditorOpenInPrivate"),

        // folder editor panel
        folderEditor: document.querySelector(".folder-editor"),
        folderEditorForm: document.getElementById("folderEditorForm"),
        folderEditorFolderTitle: document.getElementById("folderEditorFolderTitle"),
        folderEditorUpdateButton: document.getElementById("folderEditorUpdateButton"),
        folderEditorCloseButton: document.getElementById("folderEditorCloseButton"),
        folderEditorRemoveButton: document.getElementById("folderEditorRemoveButton"),
        folderEditorAppendButton: document.getElementById("folderEditorAppendButton"),
        folderEditorOpenAll: document.getElementById("folderEditorOpenAll"),
        folderEditorGroupOpenAll: document.getElementById("folderEditorGroupOpenAll"),
        folderEditorManagerLink: document.getElementById("folderEditorManagerLink")
    },

    settings: {
        defaults: {
            theme: "system",
            popupWidthRange: [350,350],
            popupHeightRange: [90,490],
            linkOpenPolicy: "0",
            bookmarkRoot: "0",
            searchIncludeUrl: false,
            enableDoubleClick: false,
            doubleClickDetectDelay: 230,
            showScrollButton: true,
            scrollPosition: 0,
            openedFolders: []
        },
        data: {},
        saveHandler: {},

        init: async function () {
            Object.assign(app.settings.data, app.settings.defaults);
            return chrome.storage.local.get().then((saved) => {
                Object.assign(app.settings.data, saved);
            });
        },

        get: function (key) {
            return app.settings.data[key];
        },

        set: function (key, value, delay=0, callback=null) {
            if (value != undefined) { app.settings.data[key] = value; }
            if (delay <= 0) {
                chrome.storage.local.set({[key]: app.settings.data[key]}).then(() => {
                    if (callback) { callback(); }
                });
            }
            else {
                let handlerId = app.settings.saveHandler[key];
                if (handlerId && handlerId > 0) { clearTimeout(handlerId); }
                app.settings.saveHandler[key] = setTimeout(() => {
                    app.settings.saveHandler[key] = 0;
                    chrome.storage.local.set({[key]: app.settings.data[key]}).then(() => {
                        if (callback) { callback(); }
                    });
                }, delay);
            }
        },

        reset: async function () {
             return chrome.storage.local.clear().then(() => {
                app.settings.data = {}
                Object.assign(app.settings.data, app.settings.defaults);
                return chrome.storage.local.set(app.settings.data);
            });
        },
    },

    styles: {
        init: function () {
            app.styles.layout.init();
            app.styles.theme.init();
        },

        refresh: function () {
            app.styles.layout.init();
            app.styles.theme.adjustTheme();
        },

        adjustHeight: function (height) {
            height = (height ? height : app.dom.wrapper.offsetHeight) + app.dom.header.offsetHeight;
            document.documentElement.style.height = document.body.style.height = height + "px";
        },

        layout: {
            init: function () {
                app.styles.layout.adjustPopupWidth();
                app.styles.layout.adjustPopupHeight();
            },

            adjustPopupWidth: function () {
                let range = app.settings.get("popupWidthRange");

                let width = "", minWidth = "", maxWidth = "";
                if (range[0] == range[1]) {
                    width = range[0] + "px";
                }
                else {
                    minWidth = range[0] + "px";
                    maxWidth = range[1] + "px";
                }

                app.dom.wrapper.style.width = width;
                app.dom.wrapper.style.minWidth = minWidth;
                app.dom.wrapper.style.maxWidth = maxWidth;
            },

            adjustPopupHeight: function () {
                let range = app.settings.get("popupHeightRange");
                let headerPixelHeight = getComputedStyle(app.dom.header).height;
                let reservedHeight = parseInt(headerPixelHeight.slice(0, headerPixelHeight.length-2));

                let height = "", minHeight = "", maxHeight = "";
                if (range[0] == range[1]) {
                    height = Math.max(0, range[0] - reservedHeight) + "px";
                }
                else {
                    minHeight = Math.max(0, range[0] - reservedHeight) + "px";
                    maxHeight = Math.max(0, range[1] - reservedHeight) + "px";
                }

                app.dom.bookmark.style.height = height;
                app.dom.bookmark.style.minHeight = minHeight;
                app.dom.bookmark.style.maxHeight = maxHeight;
                app.dom.asides.forEach((aside) => {
                    aside.style.height = height;
                    aside.style.minHeight = minHeight;
                    aside.style.maxHeight = maxHeight;
                });
            }
        },

        theme: {
            light: "styles/theme_light.css",
            dark: "styles/theme_dark.css",

            init: function () {
                app.styles.theme.adjustTheme();
            },

            adjustTheme: function () {
                let themeUrl = "";
                let theme = app.settings.get("theme");
                if (theme == "system") {
                    let isOsLightTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
                    themeUrl = isOsLightTheme ? app.styles.theme.light : app.styles.theme.dark;
                }
                else {
                    themeUrl = theme == "light" ? app.styles.theme.light : app.styles.theme.dark;
                }
                app.dom.themeLink.href = themeUrl;
            }
        }
    },

    headerControls: {
        init: function () {
            app.headerControls.initListener();
        },

        refreshButton: {
            isAnimationPlaying: function () {
                return app.dom.controlButtonRefresh.classList.contains("control__item--refreshing");
            },
            startAnimation: function () {
                app.dom.controlButtonRefresh.classList.add("control__item--refreshing");
            },
            stopAnimation: function () {
                app.dom.controlButtonRefresh.classList.remove("control__item--refreshing", "control__item--active");
            },
        },

        toggleAvailability: function (enable) {
            if (enable) { app.dom.controlButtons.forEach((btn) => { btn.removeAttribute("disabled"); }); }
            else { app.dom.controlButtons.forEach((btn) => { btn.setAttribute("disabled", "disabled"); }); }
        },

        initListener: function () {
            app.dom.controlButtonSetting.addEventListener("click", (event) => {
                let state = event.target.classList.toggle("control__item--active");
                if (state) { app.asides.settings.openPanel(); }
                else { app.asides.settings.closePanel(); }
            });

            app.dom.controlButtonRefresh.addEventListener("click", () => {
                if (app.headerControls.refreshButton.isAnimationPlaying()) { return; }
                app.refresh(true);
            });
        }
    },

    bookmarks: {
        init: async function () {
            app.bookmarks.scroll.initListener();
            return app.bookmarks.build.build().then(() => {
                app.bookmarks.manage.initListener();
                app.bookmarks.search.initListener();
                app.bookmarks.sort.initSortables();
                app.bookmarks.scroll.adjustScrollButton();
            });
        },

        build: {
            build: async function () {
                return app.bookmarks.build.getRawTree().then((rawTree) => {
                    rawTree = rawTree[0];
                    let bookmarkRoot = app.settings.get("bookmarkRoot");
                    if (bookmarkRoot == "1") { rawTree = rawTree.children[0]; }
                    else if (bookmarkRoot == "2") { rawTree = rawTree.children[1]; }

                    let treeNode = app.bookmarks.build.buildTree(rawTree);
                    if (treeNode.children.length == 0) {
                        treeNode = document.createElement("div");
                        treeNode.classList.add("bookmarks__empty");
                        treeNode.innerText = app.getI18n("bookmarks_empty");
                    }
                    app.dom.bookmark.replaceChildren(treeNode);
                });
            },

            getRawTree: async function (folderId) {
                if (folderId) { return chrome.bookmarks.getSubTree(folderId); }
                else { return chrome.bookmarks.getTree(); }
            },

            buildTree: function (root) {
                let listNode = document.createElement("ul");
                root.children.forEach((node) => {
                    if (node.url) {
                        let linkNode = app.bookmarks.build.createLinkNode(node.id, node.title, node.url);
                        listNode.appendChild(linkNode);
                    }
                    else {
                        let folderNode = app.bookmarks.build.createFolderNode(node.id, node.title);
                        folderNode.appendChild(app.bookmarks.build.buildTree(node));
                        listNode.appendChild(folderNode);
                    }
                });
                return listNode;
            },

            createLinkNode: function (id, title, url) {
                let containerNode = document.createElement("li");
                containerNode.dataset.id = id;
                containerNode.dataset.url = url;
                containerNode.tabIndex = "1";
                containerNode.style.backgroundImage = "url(" + app.bookmarks.build.createFaviconUrl(url) + ")";

                let titleNode = document.createElement("span");
                titleNode.title = title + "\n" + url;
                titleNode.innerText = title;

                containerNode.appendChild(titleNode);
                return containerNode;
            },
            updateLinkNode: function (element, id, title, url) {
                let containerNode = element;
                containerNode.dataset.id = id;
                containerNode.dataset.url = url;
                containerNode.style.backgroundImage = "url(" + app.bookmarks.build.createFaviconUrl(url) + ")";
                let titleNode = containerNode.children[0];
                titleNode.title = title + "&#010;" + url;
                titleNode.innerText = title;
            },
            serializeLinkNode: function (element) {
                return {
                    id: element.dataset.id,
                    title: element.children[0].innerText,
                    url: element.dataset.url
                };
            },

            createFolderNode: function (id, title) {
                let containerNode = document.createElement("li");
                containerNode.classList.add("bookmarks__folder");
                if (app.settings.get("openedFolders").indexOf(id) !== -1) {
                    containerNode.classList.add("bookmarks__folder--opened");
                }
                containerNode.dataset.id = id;

                let titleNode = document.createElement("span");
                titleNode.innerText = title;

                containerNode.appendChild(titleNode);
                return containerNode;
            },
            updateFolderNode: function (element, id, title) {
                let containerNode = element;
                containerNode.dataset.id = id;
                let titleNode = containerNode.children[0];
                titleNode.innerText = title;
            },
            serializeFolderNode: function (element) {
                return {
                    id: element.dataset.id,
                    title: element.children[0].innerText
                }
            },

            createFaviconUrl: function (url) {
                const faviconUrl = new URL(chrome.runtime.getURL("/_favicon/"));
                faviconUrl.searchParams.set("pageUrl", url);
                faviconUrl.searchParams.set("size", "128");
                return faviconUrl.toString();
            }
        },

        manage: {
            openLink: async function (element) {
                let data = app.bookmarks.build.serializeLinkNode(element);
                let policy = app.settings.get("linkOpenPolicy");
                if (policy == "0") {
                    return chrome.tabs.create({url: data.url, active: true});
                }
                else {
                    return chrome.tabs.query({active: true, currentWindow: true}).then((result) => {
                        if (result.length == 0 || (policy == "2" && result[0].url != "chrome://newtab/")) {
                            return chrome.tabs.create({url: data.url, active: true});
                        }
                        else {
                            return chrome.tabs.update(result[0].id, { url: data.url });
                        }
                    });
                }
            },

            openFolder: async function (element, grouping=false) {
                let data = app.bookmarks.build.serializeFolderNode(element);
                return chrome.bookmarks.getChildren(data.id).then((nodes) => {
                    let promises = [];
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].url) { promises.push(chrome.tabs.create({ url:nodes[i].url, active:true })); }
                    }
                    return Promise.all(promises).then((tabs) => {
                        let tabIds = tabs.map((tab) => { return tab.id; });
                        if (grouping && tabIds.length > 0) {
                            chrome.tabs.group({tabIds: tabIds}).then((groupId) => {
                                chrome.tabGroups.update(groupId, {title: data.title, color: "orange", collapsed: false});
                            });
                        }
                        return tabIds;
                    });
                });
            },

            createLink: async function (element, title, url) {
                let data = app.bookmarks.build.serializeFolderNode(element);
                return chrome.bookmarks.create({ parentId: data.id, title:title, url: url }).then((node) => {
                    let link = app.bookmarks.build.createLinkNode(node.id, node.title, node.url);
                    app.bookmarks.manage._initLinkListener(link);
                    element.children[1].appendChild(link);

                    if (app.bookmarks.manage.isFolderExpanded(element)) {
                        link.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
                        link.classList.add("create-ready");
                        link.addEventListener("animationend", (event) => {
                            link.classList.remove("create-ready");
                        });
                    }
                });
            },

            createFolder: async function(element, title) {
                let data = app.bookmarks.build.serializeFolderNode(element);
                return chrome.bookmarks.create({ parentId: data.id, title:title }).then((node) => {
                    let folder = app.bookmarks.build.createFolderNode(node.id, node.title);
                    let folderList = document.createElement("ul");
                    folder.appendChild(folderList);
                    app.bookmarks.manage._initFolderListener(folder);
                    app.bookmarks.sort.createSortable(folderList);
                    element.children[1].appendChild(folder);

                    if (app.bookmarks.manage.isFolderExpanded(element)) {
                        app.bookmarks.manage.expandFolder(folder);
                        folder.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
                        folder.classList.add("create-ready");
                        folder.addEventListener("animationend", (event) => {
                            folder.classList.remove("create-ready");
                        });
                    }
                });
            },

            updateLink: async function (element, title, url) {
                let data = app.bookmarks.build.serializeLinkNode(element);
                return chrome.bookmarks.update(data.id, { title, url }).then((node) => {
                    app.bookmarks.build.updateLinkNode(element, node.id, node.title, node.url);
                });
            },

            updateFolder: async function (element, title) {
                let data = app.bookmarks.build.serializeFolderNode(element);
                return chrome.bookmarks.update(data.id, { title }).then((node) => {
                    app.bookmarks.build.updateFolderNode(element, node.id, node.title);
                });
            },

            removeLink: async function (element) {
                let data = app.bookmarks.build.serializeFolderNode(element);
                return chrome.bookmarks.remove(data.id).then(() => {
                    element.classList.add("remove-ready");
                    element.addEventListener("animationend", (event) => {
                        event.target.remove();
                        app.styles.adjustHeight();
                        if (app.bookmarks.search.isSearching()) {
                            app.bookmarks.search.detectSearchMatchTail();
                        }
                    });
                });
            },

            removeFolder: async function (element) {
                let data = app.bookmarks.build.serializeFolderNode(element);
                return chrome.bookmarks.removeTree(data.id).then(() => {
                    app.bookmarks.sort.removeSortable(element.children[1]);
                    let openedFolders = app.settings.get("openedFolders");
                    let idx = openedFolders.indexOf(data.id);
                    if (idx >= 0) { openedFolders.splice(idx, 1); }
                    app.settings.set("openedFolders", openedFolders);

                    element.classList.add("remove-ready");
                    element.addEventListener("animationend", (event) => {
                        event.target.remove();
                        app.styles.adjustHeight();
                    });
                });
            },

            isFolderExpanded: function (element) {
                return element.classList.contains("bookmarks__folder--opened");
            },
            expandFolder: function (element, cascade=false) {
                let openedFolders = app.settings.get("openedFolders");
                element.classList.add("bookmarks__folder--opened");
                openedFolders.push(element.dataset.id);
                if (cascade) {
                    element.querySelectorAll(".bookmarks__folder:not(.bookmarks__folder--opened)").forEach((sub) => {
                        sub.classList.add("bookmarks__folder--opened");
                        openedFolders.push(sub.dataset.id);
                    });
                }
                app.styles.adjustHeight();
                app.settings.set("openedFolders", openedFolders);
            },
            collapseFolder: function (element, cascade=false) {
                let openedFolders = app.settings.get("openedFolders");
                element.classList.remove("bookmarks__folder--opened");
                let idx = openedFolders.indexOf(element.dataset.id);
                if (idx >= 0) { openedFolders.splice(idx, 1); }
                if (cascade) {
                    element.querySelectorAll(".bookmarks__folder--opened").forEach((sub) => {
                        sub.classList.remove("bookmarks__folder--opened");
                        let idx = openedFolders.indexOf(sub.dataset.id);
                        if (idx >= 0) { openedFolders.splice(idx, 1); }
                    });
                }
                app.styles.adjustHeight();
                app.settings.set("openedFolders", openedFolders);
            },

            _initFolderListener: function (folder) {
                folder = folder.children[0];  // relocate to folder span

                // expand or collapse folder
                var clickTimeout = -1;
                folder.addEventListener("click", (event) => {
                    if (app.bookmarks.search.isSearching()) { return; }
                    let expanded = app.bookmarks.manage.isFolderExpanded(folder.parentNode);
                    let handler = expanded ? app.bookmarks.manage.collapseFolder : app.bookmarks.manage.expandFolder;

                    if(!app.settings.get("enableDoubleClick")) {
                        handler(folder.parentNode, false);
                    }
                    else {
                        if (clickTimeout <= 0) {
                            clickTimeout = setTimeout(function () {
                                clickTimeout = -1;
                                handler(folder.parentNode, false);
                            }, app.settings.get("doubleClickDetectDelay"));
                        }
                        else {
                            clearTimeout(clickTimeout);
                            clickTimeout = -1;
                            handler(folder.parentNode, true);
                        }
                    }
                });

                // folder edit panel
                folder.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                    if (app.bookmarks.search.isSearching()) { return; }
                    app.asides.folderEditor.prepare(folder.parentNode);
                });
            },

            _initLinkListener: function (link) {
                // open link
                link.addEventListener("click", (event) => {
                    app.bookmarks.manage.openLink(link);
                    window.close();
                });
                link.addEventListener("keypress", (event) => {
                    if (event.which == 13) { event.target.click(); }
                })

                // link edit panel
                link.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                    app.asides.linkEditor.prepare(link);
                });
            },

            initListener: function () {
                app.dom.folders().forEach((folder) => { app.bookmarks.manage._initFolderListener(folder); });
                app.dom.links().forEach((link) => { app.bookmarks.manage._initLinkListener(link); });
            }
        },

        search: {
            isSearching: function () {
                return app.dom.bookmark.classList.contains("bookmarks--searching");
            },

            toggleSearchingMode: function (enable) {
                if (enable === app.bookmarks.search.isSearching()) { return; }

                if (enable) {
                    app.asides.closeAllPanels();
                    app.headerControls.toggleAvailability(false);
                    app.bookmarks.sort.toggleAvailability(false);

                    app.dom.bookmark.classList.add("bookmarks--searching");
                    app.dom.folders().forEach((folder) => {
                        folder.classList.add("bookmarks__folder--temp-opened");
                    });

                    app.styles.adjustHeight();
                }
                else {
                    app.headerControls.toggleAvailability(true);
                    app.bookmarks.sort.toggleAvailability(true);

                    app.dom.bookmark.classList.remove("bookmarks--searching");
                    app.dom.folders().forEach((folder) => {
                        folder.classList.remove("bookmarks__folder--temp-opened");
                    });

                    app.styles.adjustHeight();
                    app.bookmarks.scroll.scrollToSavedPosition();
                }
            },

            detectSearchMatchTail: function () {
                app.dom.bookmark.querySelectorAll("li.bookmarks__folder:has(li.search-match)").forEach((folder) => {
                    let childrens = folder.children[1].children;
                    let tailFolderIndex = -1;
                    for(let i = 0; i < childrens.length; i++) {
                        if (childrens[i].matches(".search-match")) { tailFolderIndex = -1; }
                        else if (childrens[i].matches(":has(li.search-match)")) { tailFolderIndex = i; }
                    }
                    if (tailFolderIndex >= 0) { childrens[tailFolderIndex].classList.add("search-match-tail"); }
                });
            },

            doSearch: function (keywords) {
                app.dom.bookmark.querySelectorAll("li[data-url].search-match").forEach((link) => {
                    link.classList.remove("search-match");
                });
                app.dom.bookmark.querySelectorAll("li.bookmarks__folder.search-match-tail").forEach((folder) => {
                    folder.classList.remove("search-match-tail");
                });

                if (keywords == "") {
                    app.bookmarks.search.toggleSearchingMode(false);
                    return;
                }
                else if (!app.bookmarks.search.isSearching()) {
                    app.bookmarks.search.toggleSearchingMode(true);
                }

                keywords = keywords.toLowerCase();
                app.dom.bookmark.querySelectorAll("li[data-url]").forEach((link) => {
                    let match = link.children[0].innerText.toLowerCase().includes(keywords);
                    if (app.settings.get("searchIncludeUrl")) { match ||= link.dataset.url.toLowerCase().includes(keywords); }
                    if (match) { link.classList.add("search-match"); }
                });

                app.bookmarks.search.detectSearchMatchTail();
                app.styles.adjustHeight();

                app.bookmarks.scroll.adjustScrollButton();
            },

            initListener: function () {
                app.dom.searchInput.addEventListener("input", (event) => {
                    let keywords = event.target.value;
                    app.bookmarks.search.doSearch(keywords);
                });
            }
        },

        sort: {
            // ref: https://github.com/SortableJS/Sortable#options

            sortables: [],

            initSortables: function () {
                app.bookmarks.sort.removeAllSortables();
                app.dom.bookmark.querySelectorAll("ul").forEach((list) => {
                    app.bookmarks.sort.createSortable(list);
                });
            },

            createSortable(listElement) {
                var folderId = listElement.parentNode.dataset.id;
                if (folderId ===  undefined) { folderId = 0; }

                var sourceParentId = -1;
                let bookmarkRoot = app.settings.get("bookmarkRoot");

                app.bookmarks.sort.sortables.push(Sortable.create(listElement, {
                    group: "bookmarks_container",
                    animation: 150,
                    filter: "li[data-id=\"1\"], li[data-id=\"2\"]",  // disable sort for root
                    ghostClass: "sortable-ghost",  // class name of drop placeholder
                    chosenClass: "sortable-chosen",  // class name of chosen item
                    dragClass: "sortable-drag",  // class name of dragging item
                    direction: "vertical",
                    swapThreshold: 0.75,
                    onStart: (event) => {
                        sourceParentId = event.from.parentNode.dataset.id;
                        if (sourceParentId === undefined) { sourceParentId = bookmarkRoot; }
                    },
                    onMove: (event) => {
                        let target = event.to.parentNode;
                        if (target.dataset.id === undefined) {
                            if (target === app.dom.bookmark) { return bookmarkRoot != "0"; }
                            else { return false; }
                        }
                        return true;
                    },
                    onEnd: (event) => {
                        let itemId = event.item.dataset.id;
                        let targetParentId =
                            event.to.parentNode.dataset.id === undefined ?
                            bookmarkRoot : event.to.parentNode.dataset.id;
                        let targetIndex =
                            (sourceParentId == targetParentId && event.newIndex > event.oldIndex)
                            ? event.newIndex + 1 : event.newIndex;

                        chrome.bookmarks.move(
                            itemId, { parentId: targetParentId, index: targetIndex }
                        ).then(() => {
                            app.bookmarks.sort.isSorting = false;
                        })
                    }
                }));
            },

            removeSortable(element) {
                let sortables = app.bookmarks.sort.sortables;
                for (let i in sortables) {
                    if (sortables[i].el.isSameNode(element)) {
                        sortables[i].destroy();
                        sortables.splice(i,1);
                        break;
                    }
                }
            },

            removeAllSortables() {
                let sortables = app.bookmarks.sort.sortables;
                for (let i in sortables) { sortables[i].destroy(); }
                sortables.splice(0);
            },

            toggleAvailability(enable) {
                let sortables = app.bookmarks.sort.sortables;
                for (let i in sortables) { sortables[i].option("disabled", !enable); }
            }
        },

        scroll: {
            direction: 0,

            scrollTo: function (offset, behavior) {
                app.dom.bookmark.scrollTo({ top: offset, behavior: behavior || "auto" });
            },

            saveScrolledPosition: function () {
                if (app.bookmarks.search.isSearching()) { return; }
                app.settings.set("scrollPosition", app.dom.bookmark.scrollTop, 150);
            },

            scrollToSavedPosition: function () {
                app.bookmarks.scroll.scrollTo(app.settings.get("scrollPosition"), "instant");
            },

            adjustScrollButton: function () {
                let windowSize = app.dom.bookmark.offsetHeight;
                let globalSize = app.dom.bookmark.scrollHeight;
                let position = app.dom.bookmark.scrollTop;

                let visible =
                    app.settings.get("showScrollButton") && globalSize >= windowSize * 4 &&
                    (position > windowSize && position < globalSize - windowSize*2);
                if (!visible) {
                    app.dom.scrollButton.classList.remove("scroller--visible");
                    return;
                }

                let direction =
                    (position + windowSize < globalSize / 2) ? 1 :
                    (position > globalSize / 2) ?  0 : app.bookmarks.scroll.direction;
                app.bookmarks.scroll.direction = direction;

                app.dom.scrollButton.classList.add("scroller--visible");
                if (direction == 0) { app.dom.scrollButton.classList.add("scroller--top"); }
                else { app.dom.scrollButton.classList.remove("scroller--top"); }
            },

            scrollToEdge: function () {
                if (app.bookmarks.scroll.direction == 0) {
                    app.bookmarks.scroll.scrollTo(0, "smooth");
                }
                else {
                    let bottom = app.dom.bookmark.scrollHeight - app.dom.bookmark.offsetHeight;
                    app.bookmarks.scroll.scrollTo(bottom, "smooth");
                }
            },

            initListener: function () {
                app.dom.bookmark.addEventListener("scroll", (event) => {
                    app.bookmarks.scroll.saveScrolledPosition();
                    app.bookmarks.scroll.adjustScrollButton();
                }, false);

                app.dom.scrollButton.addEventListener("click", () => {
                    app.bookmarks.scroll.scrollToEdge();
                });
            }
        }
    },

    asides: {
        init: function () {
            app.asides.settings.init();
            app.asides.linkEditor.initListener();
            app.asides.folderEditor.initListener();
        },

        closeAllPanels: function () {
            app.asides.settings.closePanel();
            app.asides.linkEditor.closePanel();
            app.asides.folderEditor.closePanel();
        },

        currentSize: function () {
            if (app.asides.settings.isPanelOpening()) { return app.dom.setting.offsetHeight; }
            else if (app.asides.linkEditor.isPanelOpening()) { return app.dom.linkEditor.offsetHeight; }
            else if (app.asides.folderEditor.isPanelOpening()) { return app.dom.folderEditor.offsetHeight; }
            else { return 0; }
        },

        settings: {
            init: function () {
                app.asides.settings.loadPanelData();
                app.asides.settings.initListener();
            },

            isPanelOpening: function () {
                return app.dom.setting.classList.contains("active");
            },
            openPanel: function () {
                if (app.asides.settings.isPanelOpening()) { return; }
                app.asides.closeAllPanels();
                app.dom.setting.classList.add("active");
                app.styles.adjustHeight(app.dom.setting.offsetHeight);
                app.dom.settingDefaultTheme.focus();
            },
            closePanel: function () {
                if (!app.asides.settings.isPanelOpening()) { return; }
                app.dom.setting.classList.remove("active");
                app.dom.controlButtonSetting.classList.remove("control__item--active");
                app.styles.adjustHeight();
                app.dom.searchInput.focus();
            },

            loadPanelData: function () {
                app.dom.settingDefaultTheme.value = app.settings.get("theme");
                app.dom.settingPopupMinWidth.value = app.settings.get("popupWidthRange")[0];
                app.dom.settingPopupMaxWidth.value = app.settings.get("popupWidthRange")[1];
                app.dom.settingPopupMinHeight.value = app.settings.get("popupHeightRange")[0];
                app.dom.settingPopupMaxHeight.value = app.settings.get("popupHeightRange")[1];
                app.dom.settingLinkOpenPolicy.value = app.settings.get("linkOpenPolicy");
                app.dom.settingBookmarkRoot.value = app.settings.get("bookmarkRoot");
                app.dom.settingSearchIncludeUrl.checked = app.settings.get("searchIncludeUrl");
                app.dom.settingEnableDoubleClick.checked = app.settings.get("enableDoubleClick");
                app.dom.settingDoubleClickDetectDelay.value = app.settings.get("doubleClickDetectDelay");
                app.dom.settingShowScrollToTopButton.checked = app.settings.get("showScrollButton");
            },

            initListener: function () {
                // reset to default
                app.dom.settingResetButton.addEventListener("click", (event) =>{
                    event.preventDefault();
                    app.settings.reset().then(() => {
                        app.asides.settings.loadPanelData();
                        app.refresh();
                    });
                });

                // open chrome bookmark manager
                app.dom.settingOpenBookmarkManager.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                }),
                app.dom.settingOpenBookmarkManager.addEventListener("click", (event) => {
                    event.preventDefault();
                    chrome.tabs.create({url: "chrome://bookmarks/", active: true});
                    window.close();
                });

                // setting default theme
                app.dom.settingDefaultTheme.addEventListener("change", (event) => {
                    let theme = event.target.options[event.target.selectedIndex].value;
                    app.settings.set("theme", theme, 0, () => { app.styles.init(); });
                });

                // setting popup size
                function _balanceSizeRange(range, priority, minVal, maxVal) {
                    range[0] = range[0] ? range[0] : 0;
                    range[1] = range[1] ? range[1] : 0;
                    range[0] = range[0] < minVal ? minVal : (range[0] > maxVal ? maxVal : range[0]);
                    range[1] = range[1] < minVal ? minVal : (range[1] > maxVal ? maxVal : range[1]);
                    if (range[0] > range[1]) {
                        if (priority == 0) { range[1] = range[0]; }
                        else { range[0] = range[1]; }
                    }
                }
                function updateWidth(priority) {
                    let range = app.settings.get("popupWidthRange");
                    range[0] = parseInt(app.dom.settingPopupMinWidth.value);
                    range[1] = parseInt(app.dom.settingPopupMaxWidth.value);
                    _balanceSizeRange(range, priority, 250, 800);
                    app.dom.settingPopupMinWidth.value = range[0];
                    app.dom.settingPopupMaxWidth.value = range[1];
                    app.settings.set("popupWidthRange", range, 0, () => {
                        app.styles.layout.adjustPopupWidth();
                        app.styles.adjustHeight(app.dom.setting.offsetHeight);
                    });
                }
                function updateHeight(priority) {
                    let range = app.settings.get("popupHeightRange");
                    range[0] = parseInt(app.dom.settingPopupMinHeight.value);
                    range[1] = parseInt(app.dom.settingPopupMaxHeight.value);
                    _balanceSizeRange(range, priority, 90, 600);
                    app.dom.settingPopupMinHeight.value = range[0];
                    app.dom.settingPopupMaxHeight.value = range[1];
                    app.settings.set("popupHeightRange", range, 0, () => {
                        app.styles.layout.adjustPopupHeight();
                        app.styles.adjustHeight(app.dom.setting.offsetHeight);
                    });
                }
                app.dom.settingPopupMinWidth.addEventListener("change", (event) => { updateWidth(0); });
                app.dom.settingPopupMaxWidth.addEventListener("change", (event) => { updateWidth(1); });
                app.dom.settingPopupMinHeight.addEventListener("change", (event) => { updateHeight(0); });
                app.dom.settingPopupMaxHeight.addEventListener("change", (event) => { updateHeight(1); });

                // setting link open policy
                app.dom.settingLinkOpenPolicy.addEventListener("change", (event) => {
                    let policy = event.target.options[event.target.selectedIndex].value;
                    app.settings.set("linkOpenPolicy", policy);
                });

                // setting bookmark root
                app.dom.settingBookmarkRoot.addEventListener("change", (event) => {
                    let root = event.target.options[event.target.selectedIndex].value;
                    app.settings.set("bookmarkRoot", root, 0, () => { app.refresh(true); });
                });

                // setting search include url
                app.dom.settingSearchIncludeUrl.addEventListener("change", (event) => {
                    let checked = event.target.checked;
                    app.settings.set("searchIncludeUrl", checked);
                });

                // setting enable double click
                app.dom.settingEnableDoubleClick.addEventListener("change", (event) => {
                    let checked = event.target.checked;
                    app.settings.set("enableDoubleClick", checked);
                });

                // double click detect delay
                app.dom.settingDoubleClickDetectDelay.addEventListener("change", (event) => {
                    let delay = parseInt(app.dom.settingDoubleClickDetectDelay.value);
                    delay = delay ? delay : 0;
                    let minVal = 100, maxVal = 1000;
                    delay = delay < minVal ? minVal : (delay > maxVal ? maxVal : delay);
                    app.dom.settingDoubleClickDetectDelay.value = delay;
                    app.settings.set("doubleClickDetectDelay", delay);
                });

                // show scroll-top-top button
                app.dom.settingShowScrollToTopButton.addEventListener("change", (event) => {
                    let checked = event.target.checked;
                    app.settings.set("showScrollButton", checked, 0, () => {
                        app.bookmarks.scroll.adjustScrollButton();
                    });
                });
            }
        },

        linkEditor: {
            sourceElement: null,

            isPanelOpening: function () {
                return app.dom.linkEditor.classList.contains("active");
            },
            openPanel: function () {
                if (app.asides.linkEditor.isPanelOpening()) { return; }
                app.asides.closeAllPanels();
                app.dom.linkEditor.classList.add("active");
                app.styles.adjustHeight(app.dom.linkEditor.offsetHeight);
                setTimeout(() => {
                    app.dom.linkEditorBookmarkTitle.focus();
                }, 100);
            },
            closePanel: function () {
                if (!app.asides.linkEditor.isPanelOpening()) { return; }
                app.dom.linkEditor.classList.remove("active");
                app.styles.adjustHeight();
                app.dom.searchInput.focus();
                app.asides.linkEditor.sourceElement = null;
            },

            prepare: function (element) {
                let data = app.bookmarks.build.serializeLinkNode(element);
                app.asides.linkEditor.sourceElement = element;
                app.dom.linkEditorBookmarkTitle.value = data.title;
                app.dom.linkEditorBookmarkTitle.style.backgroundImage = element.style.backgroundImage;
                app.dom.linkEditorBookmarkUrl.value = data.url;
                app.asides.linkEditor.openPanel();
            },

            initListener: function () {
                // update link
                app.dom.linkEditorForm.addEventListener("submit", (event) => {
                    event.preventDefault();
                    let element = app.asides.linkEditor.sourceElement;
                    if (element) {
                        let title = app.dom.linkEditorBookmarkTitle.value;
                        let url = app.dom.linkEditorBookmarkUrl.value;
                        app.bookmarks.manage.updateLink(element, title, url).then(() => {
                            app.asides.linkEditor.closePanel();
                        });
                    }
                });

                // delete link
                app.dom.linkEditorRemoveButton.addEventListener("click", (event) => {
                    let element = app.asides.linkEditor.sourceElement;
                    if (element) {
                        app.bookmarks.manage.removeLink(element);
                        app.asides.linkEditor.closePanel();
                    }
                });

                // cancel edit
                app.dom.linkEditorCloseButton.addEventListener("click", (event) => {
                    app.asides.linkEditor.closePanel();
                });

                // open link in background
                app.dom.linkEditorOpenInBackground.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                }),
                app.dom.linkEditorOpenInBackground.addEventListener("click", (event) => {
                    event.preventDefault();
                    let element = app.asides.linkEditor.sourceElement;
                    if (element) {
                        let url = app.bookmarks.build.serializeLinkNode(element).url;
                        chrome.tabs.create({url: url, active: false});
                    }
                    app.asides.linkEditor.closePanel();
                }),

                // open link in incognito window
                app.dom.linkEditorOpenInPrivate.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                }),
                app.dom.linkEditorOpenInPrivate.addEventListener("click", (event) => {
                    event.preventDefault();
                    let element = app.asides.linkEditor.sourceElement;
                    if (element) {
                        let url = app.bookmarks.build.serializeLinkNode(element).url;
                        chrome.windows.create({ url: url, incognito: true });
                    }
                    window.close();
                });
            }
        },

        folderEditor: {
            sourceElement: null,

            isPanelOpening: function () {
                return app.dom.folderEditor.classList.contains("active");
            },
            openPanel: function () {
                if (app.asides.folderEditor.isPanelOpening()) { return; }
                app.asides.closeAllPanels();
                app.dom.folderEditor.classList.add("active");
                app.styles.adjustHeight(app.dom.folderEditor.offsetHeight);
                setTimeout(() => {
                    app.dom.folderEditorFolderTitle.focus();
                }, 100);
            },
            closePanel: function () {
                if (!app.asides.folderEditor.isPanelOpening()) { return; }
                app.dom.folderEditor.classList.remove("active");
                app.styles.adjustHeight();
                app.dom.searchInput.focus();
                app.asides.folderEditor.sourceElement = null;
            },

            prepare: function (element) {
                let data = app.bookmarks.build.serializeFolderNode(element);

                app.asides.folderEditor.sourceElement = element;
                app.dom.folderEditorFolderTitle.value = data.title;
                app.dom.folderEditorManagerLink.href = "chrome://bookmarks/?id=" + data.id;

                if (data.id == 1 || data.id == 2) {
                    app.dom.folderEditorFolderTitle.setAttribute("disabled", "disabled");
                    app.dom.folderEditorUpdateButton.setAttribute("disabled", "disabled");
                    app.dom.folderEditorRemoveButton.setAttribute("disabled", "disabled");
                }
                else {
                    app.dom.folderEditorFolderTitle.removeAttribute("disabled");
                    app.dom.folderEditorUpdateButton.removeAttribute("disabled");
                    app.dom.folderEditorRemoveButton.removeAttribute("disabled");
                }

                app.asides.folderEditor.openPanel();
            },

            initListener: function () {
                // update folder
                app.dom.folderEditorForm.addEventListener("submit", (event) => {
                    event.preventDefault();
                    let element = app.asides.folderEditor.sourceElement;
                    if (element) {
                        let title = app.dom.folderEditorFolderTitle.value;
                        app.bookmarks.manage.updateFolder(element, title).then(() => {
                            app.asides.folderEditor.closePanel();
                        });
                    }
                });

                // remove folder
                app.dom.folderEditorRemoveButton.addEventListener("click", (event) => {
                    let element = app.asides.folderEditor.sourceElement;
                    if (element) {
                        app.bookmarks.manage.removeFolder(element);
                        app.asides.folderEditor.closePanel();
                    }
                });

                // create sub folder
                app.dom.folderEditorAppendButton.addEventListener("click", (event) => {
                    let element = app.asides.folderEditor.sourceElement;
                    if (element) {
                        let title = app.getI18n("default_folder_name");
                        app.bookmarks.manage.createFolder(element, title).then(() => {
                            app.asides.folderEditor.closePanel();
                        });
                    }
                });

                // cancel edit
                app.dom.folderEditorCloseButton.addEventListener("click", (event) => {
                    app.asides.folderEditor.closePanel();
                });

                // open all links
                app.dom.folderEditorOpenAll.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                }),
                app.dom.folderEditorOpenAll.addEventListener("click", (event) => {
                    event.preventDefault();
                    let element = app.asides.folderEditor.sourceElement;
                    if (element) {
                        app.bookmarks.manage.openFolder(element, false);
                        window.close();
                    }
                });

                // opan all links as group
                app.dom.folderEditorGroupOpenAll.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                }),
                app.dom.folderEditorGroupOpenAll.addEventListener("click", (event) => {
                    event.preventDefault();
                    let element = app.asides.folderEditor.sourceElement;
                    if (element) {
                        app.bookmarks.manage.openFolder(element, true);
                        window.close();
                    }
                });

                // open in bookmark manager
                app.dom.folderEditorManagerLink.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                }),
                app.dom.folderEditorManagerLink.addEventListener("click", (event) => {
                    event.preventDefault();
                    chrome.tabs.create({url: event.target.href, active: true});
                    window.close();
                });
            }
        }
    },

    refresh: async function (clearOpenedFolder=false) {
        app.headerControls.refreshButton.startAnimation();
        if (clearOpenedFolder) { app.settings.set("openedFolders", []); }
        app.styles.refresh();
        return app.bookmarks.build.build().then(() => {
            app.bookmarks.manage.initListener();
            app.bookmarks.sort.initSortables();
            app.styles.adjustHeight(app.asides.currentSize());
            app.headerControls.refreshButton.stopAnimation();
        });
    },

    init: function () {
        app.i18n();
        app.settings.init().then(() => {
            app.styles.init();
            app.headerControls.init();
            app.asides.init();
            app.bookmarks.init().then(() => {
                app.styles.adjustHeight();
                app.bookmarks.scroll.scrollToSavedPosition();
                app.dom.searchInput.focus();
            });
        });
    }
}

app.init();