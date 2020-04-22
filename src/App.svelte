<script>
  import { padStart } from 'lodash-es';
  import Button from './components/Button.svelte';
  import Switch from './components/Switch.svelte';

  export let videoFile =
    'file:///Users/dimfeld/Downloads/Intro to Machine Learning - Lesson 3-YSFG_W8JxBo.mp4';
  export let videoType;

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
    startTrim = videoElement.currentTime;
  }

  function setEndTrim() {
    endTrim = videoElement.currentTime;
  }

  function playFromStartPoint() {
    videoElement.currentTime = startTrim;
    videoElement.play();
  }

  $: {
    if(stopAtEndTrim && videoElement && !paused && currentTime >= endTrim) {
      videoElement.pause();
      videoElement.currentTime = endTrim;
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
</script>

<style>

</style>

<div class="w-full flex flex-col">
  <video
    width="1080"
    class="block mx-auto"
    controls
    on:loadedmetadata={loadedMetadata}
    bind:this={videoElement}
    bind:currentTime
    bind:duration={videoDuration}
    bind:paused
    src={videoFile} />

  <div class="mt-4 flex justify-between px-4">
    <div class="flex flex-col space-y-4">
      <Button on:click={setStartTrim}>Set Start Point</Button>
      <Button on:click={playFromStartPoint}>Play From Start Point</Button>
      <div>Start Point: {formatTime(startTrim)}</div>
    </div>

    <!-- Add Step Left and Right Controls here. 100ms, 500ms, 1 sec, 5 sec -->
    <p>Time: {formatTime(currentTime)}</p>

    <div class="flex flex-col space-y-4">
      <Button on:click={setEndTrim}>Set End Point</Button>
      <div><Switch bind:value={stopAtEndTrim} icon={true} /> Stop at End Trim Point</div>
      <div>End Point: {formatTime(endTrim)}</div>
    </div>
  </div>
</div>
