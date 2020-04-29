const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const Ffmpeg = require('fluent-ffmpeg');
const probe = require('ffmpeg-probe');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let watcher;
if (process.env.NODE_ENV === 'development') {
  watcher = require('chokidar').watch(
    path.join(__dirname, '../build/bundle.js'),
    { ignoreInitial: true }
  );
  watcher.on('change', () => {
    mainWindow && mainWindow.reload();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => {
    if (watcher) {
      watcher.close();
    }
    mainWindow = null;
  });
}

function showOpenDialog(type, existingPath) {
  return dialog.showOpenDialogSync(mainWindow, {
    title: `Choose a ${type} video file`,
    defaultPath: existingPath,
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mpg', 'mpeg', 'avi', 'mov', 'mkv']},
      { name: 'All Files', extensions: ['*']},
    ],
    properties: ['openFile'],
  });
}

ipcMain.on('show-open-dialog', (event, { type, existingPath }) => {
  let file = showOpenDialog(type, existingPath);
  if(file && file.length) {
    event.sender.send('select-file', { type, path: file[0] });
  }
});

async function processVideo({ intro, outro, main, startTrim, endTrim, output }) {
  const info = await probe(main);

  let command = new Ffmpeg();

  if(intro) {
    command = command.input(intro);
  }

  command = command.input(main).inputOptions(`-ss ${startTrim} -to ${endTrim}`);

  if(outro) {
    command = command.input(outro);
  }

  let stopEncoding = () => {
    command.kill('SIGTERM');
  };

  ipcMain.once('cancel-encoding', stopEncoding);

  command = command.output(output)
    .autopad()
    .size(`${info.width}x${info.height}`)
    .on('start', () => mainWindow.webContents.send('encode-start'))
    .on('progress', (progress) => {
      mainWindow.webContents.send('encode-progress', progress);
    })
    .on('end', () => mainWindow.webContents.send('encode-end'))
    .on('error', (err, stdout, stderr) => {
      ipcMain.removeEventListener('cancel-encoding', stopEncoding);
      mainWindow.webContents.send('encode-error', {err, stdout, stderr});
    })
    .run();
}

ipcMain.on('encode-video', (event, message) => processVideo(message));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
