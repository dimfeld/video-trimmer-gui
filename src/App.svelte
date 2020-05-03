<script>
  import { padStart } from 'lodash-es';
  import Button from './components/Button.svelte';
  import Switch from './components/Switch.svelte';
  import TextField from './components/TextField.svelte';
  import Label from './components/Label.svelte';
  import EncodeProgress from './EncodeProgress.svelte';

  const { ipcRenderer, SettingsStore } = window;
  const settings = new SettingsStore();

  let videoElement;
  let currentTime;
  let videoDuration;
  let paused = true;

  let stopAtEndTrim = true;
  let startTrim = 0;
  let endTrim;

  let videoInfo = {
    main: {
      description: 'Main Video',
      path: null,
      info: null,
    },
    intro: {
      description: 'Intro',
      path: null,
      info: null,
    },
    outro: {
      description: 'Outro',
      path: null,
      info: null,
    },
  };

  for(let type of Object.keys(videoInfo)) {
    let path = settings.get(`paths.${type}`);
    if(path) {
      ipcRenderer.send('get-info', { type, path });
    }
  }

  function loadedMetadata() {
    startTrim = 0;
    endTrim = videoElement.duration;
  }

  function setStartTrim() {
    startTrim = currentTime;
  }

  function setEndTrim() {
    endTrim = currentTime;
  }

  function playFromStartPoint() {
    currentTime = startTrim;
    videoElement.play();
  }

  function selectVideo(type) {
    let { path, description } = videoInfo[type];
    ipcRenderer.send('show-open-dialog', { type, description, existingPath: path || '' })
  }

  ipcRenderer.on('select-file', (event, { type, path, info }) => {
    videoInfo[type].info = info;
    videoInfo[type].path = path;
    settings.set(`paths.${type}`, path);
  });

  ipcRenderer.on('select-file-error', (event, {type, path}) => {
    alert(`Failed to open video file ${path}`);
  });

  function clearVideo(type) {
    videoInfo[type].path = null;
    videoInfo[type].info = null;
    settings.set(`paths.${type}`, null);
  }

  $: {
    if(stopAtEndTrim && videoElement && !paused && currentTime >= endTrim) {
      videoElement.pause();
      currentTime = endTrim;
    }
  }

  function formatTime(t) {
    t = t || 0;
    let minutes = Math.floor(t / 60);
    let remaining = t - minutes * 60;
    let seconds = Math.floor(remaining);
    let ms = Math.round(1000 * (remaining - seconds));
    return `${padStart(minutes.toString(), 2, '0')}:${padStart(
      seconds.toString(),
      2,
      '0'
    )}.${padStart(ms.toString(), 3, '0')}`;
  }

  function handleEncodeClick() {
    ipcRenderer.send('show-save-dialog');
  }

  let outputPath;
  let encoding = false;
  ipcRenderer.on('select-output-file', (event, path) => {
    encoding = true;
    outputPath = path;
  });

  const xIcon = `<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>`;
  const rightIconClasses = "cursor-pointer text-gray-400 rounded-lg transition-colors duration-200 ease-in hover:bg-gray-200"

</script>

<div class="w-full flex flex-col">
  <video
    width="1920"
    class="mx-auto"
    controls
    on:loadedmetadata={loadedMetadata}
    bind:this={videoElement}
    bind:currentTime
    bind:duration={videoDuration}
    bind:paused
    src={videoInfo.main.path} />

  <div class="mt-4 flex justify-center space-x-8">
    <div class="flex flex-col space-y-4">
      <Button on:click={setStartTrim}>Set Start Point</Button>
      <Button on:click={playFromStartPoint}>Play From Start Point</Button>
      <div>Start Point: {formatTime(startTrim)}</div>
    </div>

    <!-- Add Step Left and Right Controls here. 100ms, 500ms, 1 sec, 5 sec -->
    <p class="w-32">Time: {formatTime(currentTime)}</p>

    <div class="flex flex-col space-y-4">
      <Button on:click={setEndTrim}>Set End Point</Button>
      <div>Stop at End Trim Point <Switch bind:value={stopAtEndTrim} /></div>
      <div>End Point: {formatTime(endTrim)}</div>
    </div>
  </div>

  <div class="mt-8 mx-4 flex flex-col justify-start space-y-4">
    {#each ['main', 'intro', 'outro'] as type (type)}
      <div class="flex items-center space-x-2">
        <Label class="w-24 text-right" for="{type}-field">{videoInfo[type].description}</Label>
        <TextField readonly class="flex-grow" id="{type}-field" bind:value={videoInfo[type].path} rightIcon={videoInfo[type].path ? xIcon : null} {rightIconClasses} on:click-right={() => clearVideo(type)}/>
        <Button on:click={() => selectVideo(type)}>Select Video</Button>
      </div>
    {/each}

    <Button class="ml-auto" color="primary" on:click={handleEncodeClick}>Encode Video</Button>

  </div>
</div>

{#if encoding}
  <EncodeProgress {startTrim} {endTrim} {outputPath} {videoInfo} on:close={() => encoding = false} />
{/if}
