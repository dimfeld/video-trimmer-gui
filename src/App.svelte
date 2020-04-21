<script>
  import { padStart } from 'lodash-es';

  export let videoFile =
    'file:///Users/dimfeld/Downloads/Intro to Machine Learning - Lesson 3-YSFG_W8JxBo.mp4';
  export let videoType;

  let videoElement;
  let currentTime;
  let videoDuration;

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
    src={videoFile} />

  <div class="mt-4 flex justify-between">
    <div class="flex flex-col spacing-y-4">
      <button on:click={setStartTrim}>Set Start Point</button>
      <div>Start Point: {formatTime(startTrim)}</div>
      <button on:click={playFromStartPoint}>Play From Start Point</button>
    </div>

    <!-- Add Step Left and Right Controls here. 100ms, 500ms, 1 sec, 5 sec -->
    <p>Time: {formatTime(currentTime)}</p>

    <div class="flex flex-col spacing-y-4">
      <button on:click={setEndTrim}>Set End Point</button>
      <div>End Point: {formatTime(endTrim)}</div>
    </div>
  </div>
</div>
