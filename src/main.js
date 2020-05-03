const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const Ffmpeg = require('fluent-ffmpeg');
const probe = require('ffmpeg-probe');
const contextMenu = require('electron-context-menu');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let renderWatcher;
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module, { watchRenderer: false });
  } catch (_) {}

  renderWatcher = require('chokidar').watch(
    path.join(__dirname, '../build/bundle.js'),
    { ignoreInitial: true }
  );
  renderWatcher.on('change', () => {
    mainWindow && mainWindow.reload();
  });
}

contextMenu();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => {
    if(renderWatcher) {
      renderWatcher.close();
    }
    mainWindow = null;
  });
}

function showOpenDialog(description, existingPath) {
  return dialog.showOpenDialogSync(mainWindow, {
    title: `Choose a ${description} video file`,
    defaultPath: existingPath,
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mpg', 'mpeg', 'avi', 'mov', 'mkv']},
      { name: 'All Files', extensions: ['*']},
    ],
    properties: ['openFile'],
  });
}

async function getInfo(event, type, path) {
  try {
    let info = await probe(path);
    event.sender.send('select-file', { type, path, info });
  } catch(e) {
    console.error(e);
    event.sender.send('select-file-error', { type, path });
  }
}

ipcMain.on('show-open-dialog', async (event, { type, description, existingPath }) => {
  let file = showOpenDialog(description, existingPath);
  if(file && file.length) {
    getInfo(event, type, file[0]);
  }
});

ipcMain.on('get-info', (event, {type, path}) => getInfo(event, type, path));


function showSaveDialog() {
  return dialog.showSaveDialogSync(mainWindow, {
    title: `Select Output File`,
    properties: ['createDirectory']
  })
}

ipcMain.on('show-save-dialog', (event) => {
  let file = showSaveDialog();
  if(file) {
    event.sender.send('select-output-file', file);
  }
})

async function processVideo({ videoInfo, startTrim, endTrim, output }) {
  const { main, intro, outro } = videoInfo;
  const mainInfo = main.info;
  const probes = [intro.info, main.info, outro.info].filter(Boolean);
  const numVideos = probes.length;


  let command = new Ffmpeg();

  if(intro.path) {
    command = command.input(intro.path);
  }

  command = command.input(main.path).inputOptions([`-ss ${startTrim}`, `-to ${endTrim}`]);

  if(outro.path) {
    command = command.input(outro.path);
  }

  function stopEncoding() {
    console.log('command', command);
    command.kill('SIGTERM');
  }

  ipcMain.once('cancel-encoding', stopEncoding);

  const aValue = 'a'.charCodeAt(0);
  let filters = probes.map((info, i) => {
    let initialStreamName = `[${i}:v]`;
    let stream = initialStreamName;
    let streamCounter = 0;

    let filters = [];
    const addFilter = (filter) => {
      let inputStream = stream;
      let suffix = String.fromCharCode(aValue + streamCounter++);
      stream = `${i}${suffix}`;

      filters.push({
        ...filter,
        input: [inputStream],
        output: [stream]
      });
    }

    if(info.width !== mainInfo.width || info.height !== mainInfo.height) {
      addFilter({
        filter: 'scale',
        options: {
          w: mainInfo.width,
          h: mainInfo.height,
          force_original_aspect_ratio: 'increase',
          flags: 'bicubic,'
        }
      });

      addFilter({
        filter: 'pad',
        options: {
          w: mainInfo.width,
          h: mainInfo.height,
          // Center the video
          x: -1,
          y: -1,
        },
      });
    }

    return {
      videoInput: initialStreamName,
      audioInput: `[${i}:a]`,
      stream,
      filters,
    };
  });

  command = command
    .output(output)
    .complexFilter([
      ...filters.flatMap((f) => f.filters),
      {
        filter: 'concat',
        options: {
          n: numVideos,
          v: 1,
          a: 1,
        },
        inputs: filters.flatMap(({stream, audioInput}) => [stream, audioInput]),
        outputs: ['outv', 'outa'],
      }
    ],
    ['outv', 'outa'])
    .on('start', (cmd) => {
      console.log(cmd);
      mainWindow.webContents.send('encode-start');
    })
    .on('progress', (progress) => {
      mainWindow.webContents.send('encode-progress', progress);
    })
    .on('end', () => {
      console.log('DONE!');
      mainWindow.webContents.send('encode-end');
    })
    .on('error', (err, stdout, stderr) => {
      console.log(err);
      console.log(stderr);
      ipcMain.removeListener('cancel-encoding', stopEncoding);
      mainWindow.webContents.send('encode-error', {err, stdout, stderr});
    })
    .run(output);
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
