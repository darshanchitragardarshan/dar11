// This file is generated by ReNative.
// To override it simply copy/create ./appConfigs/base/builds/macos/contextMenu.js file

const { app, Menu } = require('electron');

let createWindow;

const template = [
    // { role: 'appMenu' }
    ...[
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        },
    ],
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [{ role: 'close' }],
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...[
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
                },
            ],
        ],
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'resetzoom' },
            { role: 'zoomin' },
            { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...[
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                {
                    label: app.name,
                    click: async () => {
                        if (!mainWindow) createWindow();
                    },
                },
            ],
        ],
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron');
                    await shell.openExternal('https://renative.org');
                },
            },
        ],
    },
];

exports.initContextMenu = function (createWindowHandler) {
    createWindow = createWindowHandler;
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};
