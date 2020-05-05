<script>
  import { padStart, get, pick } from 'lodash-es';
  import Button from './components/Button.svelte';
  import Switch from './components/Switch.svelte';
  import TextField from './components/TextField.svelte';
  import Label from './components/Label.svelte';
  import FadeSelector from './components/FadeSelector.svelte';
  import Popup from './components/Popup.svelte';
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

  let initialInfo = settings.get('videoInfo');
  let videoInfo = {
    main: {
      description: 'Main Video',
      path: null,
      info: null,
      fadeIn: get(initialInfo, ['main', 'fadeIn'], 0),
      fadeOut: get(initialInfo, ['main', 'fadeOut'], 0),
    },
    intro: {
      description: 'Intro',
      path: null,
      info: null,
      fadeIn: get(initialInfo, ['intro', 'fadeIn'], 0),
      fadeOut: get(initialInfo, ['intro', 'fadeOut'], 0),
    },
    outro: {
      description: 'Outro',
      path: null,
      info: null,
      fadeIn: get(initialInfo, ['outro', 'fadeIn'], 0),
      fadeOut: get(initialInfo, ['outro', 'fadeOut'], 0),
    },
  };

  for(let type of Object.keys(videoInfo)) {
    let path = get(initialInfo, [type, 'path']);
    if(path) {
      ipcRenderer.send('get-info', { type, path });
    }
  }

  $: {
    let output = {
      main: pick(videoInfo.main, ['path', 'fadeIn', 'fadeOut']),
      intro: pick(videoInfo.intro, ['path', 'fadeIn', 'fadeOut']),
      outro: pick(videoInfo.outro, ['path', 'fadeIn', 'fadeOut']),
    };
    settings.set('videoInfo',  output);
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
  const rightIconClasses = "cursor-pointer text-gray-400 transition-colors duration-100 ease-in hover:text-gray-600"


  function handleKeyup(evt) {
    if(evt.key === 'Space') {
      if(paused) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
    }
  }

  function formatFade(v) {
    if(v && typeof v === 'number') {
      return v.toFixed(1);
    }

    return 'Off';
  }

  function formatFadeSeconds(v) {
    v = formatFade(v);
    if(v !== 'Off') {
      v += ' seconds';
    }
    return v;
  }
</script>

<svelte:window on:keyup={handleKeyup} />

<div class="fixed overflow-hidden h-screen w-screen flex flex-col items-stretch">
  <div class="flex-1" >
    <video
      class="absolute left-0 top-0 w-full h-full"
      controls
      on:loadedmetadata={loadedMetadata}
      bind:this={videoElement}
      bind:currentTime
      bind:duration={videoDuration}
      bind:paused
      src={videoInfo.main.path} />
  </div>

  <div class="flex-none px-4 pb-2">
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
          <TextField readonly class="flex-grow" textFieldClass="cursor-pointer" id="{type}-field" bind:value={videoInfo[type].path} rightIcon={videoInfo[type].path ? xIcon : null} {rightIconClasses}
          placeholder="Click to choose a video..."
          on:click={() => selectVideo(type)}
          on:click-right={() => clearVideo(type)}/>
          <Popup title="Fade In - {formatFadeSeconds(videoInfo[type].fadeIn)}">
            <span slot="label" class="flex justify-between w-12 items-center">
              <svg class="inline-block w-4 h-4" viewBox="0 0 100 100">
                <polygon points="0,100 100,100 100,0" style="stroke:black;stroke-width:5;fill:hsl(0,0%,85%)" />
              </svg>
              <span>{formatFade(videoInfo[type].fadeIn)}</span>
            </span>
            <div slot="popup">
              <FadeSelector label="Fade In" bind:value={videoInfo[type].fadeIn} />
            </div>
          </Popup>
          <Popup title="Fade Out - {formatFadeSeconds(videoInfo[type].fadeOut)}">
            <span slot="label" class="flex justify-between w-12 items-center">
              <span>{formatFade(videoInfo[type].fadeOut)}</span>
              <svg class="inline-block w-4 h-4" viewBox="0 0 100 100">
                <polygon points="0,100 100,100 0,0" style="stroke:black;stroke-width:5;fill:hsl(0,0%,85%)" />
              </svg>
            </span>
            <div slot="popup">
              <FadeSelector label="Fade Out" bind:value={videoInfo[type].fadeOut} />
            </div>
          </Popup>
        </div>
      {/each}

      <Button class="ml-auto" color="primary" on:click={handleEncodeClick}>Encode Video</Button>

    </div>
  </div>
</div>

{#if encoding}
  <EncodeProgress {startTrim} {endTrim} {outputPath} {videoInfo} on:close={() => encoding = false} />
{/if}
