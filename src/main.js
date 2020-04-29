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
    width: 800,
    height: 900,
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

async function processVideo({ intro, outro, main, startTrim, endTrim, output }) {
  const videoParamInfo = await Promise.all([intro, outro, main].map((p) => p ? probe(p) : null));
  const [introInfo, mainInfo, outroInfo] = videoParamInfo;
  const videoInfo = videoParamInfo.filter(Boolean);
  const numVideos = videoInfo.length;


  let command = new Ffmpeg();

  if(intro) {
    command = command.input(intro);
  }

  command = command.input(main).inputOptions([`-ss ${startTrim}`, `-to ${endTrim}`]);

  if(outro) {
    command = command.input(outro);
  }

  function stopEncoding() {
    console.log('command', command);
    command.kill('SIGTERM');
  }

  ipcMain.once('cancel-encoding', stopEncoding);

  let indexes = Array.from({length: numVideos}, (v, i) => i);

  const aValue = 'a'.charCodeAt(0);
  let filters = videoInfo.map((info, i) => {
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
