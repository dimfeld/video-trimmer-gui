<script>
  import { padStart } from 'lodash-es';
  import Button from './components/Button.svelte';
  import Switch from './components/Switch.svelte';
  import TextField from './components/TextField.svelte';
  import Label from './components/Label.svelte';
  import EncodeProgress from './EncodeProgress.svelte';

  const { ipcRenderer, SettingsStore } = window;
  const settings = new SettingsStore();

  let mainPath = settings.get('paths.main');
  let introPath = settings.get('paths.intro');
  let outroPath = settings.get('paths.outro');

  let videoElement;
  let currentTime;
  let videoDuration;
  let paused = true;

  let stopAtEndTrim = true;
  let startTrim = 0;
  let endTrim;

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
    let existingPath;
    switch(type) {
      case 'Intro':
        existingPath = introPath;
        break;
      case 'Outro':
        existingPath = outroPath;
        break;
      case 'Main':
        existingPath = mainPath;
        break;
    }
    ipcRenderer.send('show-open-dialog', { type, existingPath })
  }

  ipcRenderer.on('select-file', (event, { type, path}) => {
    switch(type) {
      case 'Intro':
        introPath = path;
        settings.set('paths.intro', path);
        break;
      case 'Outro':
        outroPath = path;
        settings.set('paths.outro', path);
        break;
      case 'Main':
        mainPath = path;
        settings.set('paths.main', path);
        break;
    }
  })

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
    src={mainPath} />

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
    <div class="flex items-center space-x-2">
      <Label class="w-24 text-right" for="main-field">Main Video</Label>
      <TextField class="flex-grow" id="main-field" bind:value={mainPath} />
      <Button on:click={() => selectVideo('Main')}>Select Video</Button>
    </div>

    <div class="flex items-center space-x-2">
      <Label class="w-24 text-right" for="intro-field">Intro</Label>
      <TextField class="flex-grow" id="intro-field" bind:value={introPath} />
      <Button on:click={() => selectVideo('Intro')}>Select Video</Button>
    </div>

    <div class="flex items-center space-x-2">
      <Label class="w-24 text-right" for="outro-field">Outro</Label>
      <TextField class="flex-grow" id="outro-field" bind:value={outroPath} />
      <Button on:click={() => selectVideo('Outro')}>Select Video</Button>
    </div>

    <Button class="ml-auto" color="primary" on:click={handleEncodeClick}>Encode Video</Button>

  </div>
</div>

{#if encoding}
  <EncodeProgress {introPath} {outroPath} {mainPath} {startTrim} {endTrim} {outputPath} on:close={() => encoding = false} />
{/if}
