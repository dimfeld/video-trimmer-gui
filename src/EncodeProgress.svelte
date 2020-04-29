<script>
  import Button from './components/Button.svelte';
  import { createEventDispatcher, onDestroy } from 'svelte';
  const { ipcRenderer } = window;

  const dispatch = createEventDispatcher();

  export let encodeInfo;

  let encodeProgress = {
    percent: 0,
    currentFps: 0,
  };

  let errorInfo;

  const WAITING_TO_START = Symbol('ENCODE_STATE_WAITING_TO_START');
  const ENCODING = Symbol('ENCODE_STATE_ENCODING');
  const CANCELLING = Symbol('CANCELLING');
  const DONE = Symbol('ENCODE_STATE_DONE');
  const ERROR = Symbol('ENCODE_STATE_ERROR');

  const transitions = {
    [WAITING_TO_START]: {
      'encode-error': ERROR,
      'encode-start': ENCODING,
      'encode-cancel': CANCELLING,
    },
    [ENCODING]: {
      'encode-error': ERROR,
      'encode-done': DONE,
      'encode-cancel': CANCELLING,
    },
    [CANCELLING]: {},
    [DONE]: {
      'encode-error': ERROR,
    },
    [ERROR]: {}
  }

  let state = WAITING_TO_START;
  function stepState(event) {
    let nextStates = transitions[state];
    let nextState = nextStates[event];
    if(nextState) {
      state = nextState;
    }
  }

  function closeButtonText(state) {
    switch(state) {
      case WAITING_TO_START:
      case ENCODING:
        return 'Cancel';
      case CANCELLING:
        return 'Cancelling...';
      case DONE:
      case ERROR:
        return 'Close';
    }
  }

  function handleEncodeProgress(event, message) {
    encodeProgress = message;
  }

  function handleEncodeEnd() {
    if(state === CANCELLING) {
      dispatch('close');
    }

    stepState('encode-end');
  }

  function handleEncodeStart() {
    stepState('encode-start');
  }

  function handleEncodeError(event, message) {
    if(state === CANCELLING) {
      dispatch('close');
    }

    errorInfo = message;
    stepState('encode-error');
  }

  ipcRenderer.on('encode-progress', handleEncodeProgress);
  ipcRenderer.on('encode-end', handleEncodeEnd);
  ipcRenderer.on('encode-start', handleEncodeStart);
  ipcRenderer.on('encode-error', handleEncodeError);
  onDestroy(() => {
    ipcRenderer.removeListener('encode-progress', handleEncodeProgress);
    ipcRenderer.removeListener('encode-end', handleEncodeEnd);
    ipcRenderer.removeListener('encode-start', handleEncodeStart);
    ipcRenderer.removeListener('encode-error', handleEncodeError);
  });

  ipcRenderer.send('encode-video', encodeInfo);

  function close() {
    switch(state) {
      case WAITING_TO_START:
      case ENCODING:
        // If we're currently encoding, we need to ask it to stop first.
        ipcRenderer.send('cancel-encoding');
        stepState('encode-cancel');
        break;
      case DONE:
      case ERROR:
        dispatch('close');
        break;
    }
  }

</script>

<div class="flex flex-col h-48 items-center">
{#if state === WAITING_TO_START}
  <span>Starting...</span>
{:else if state === ENCODING}
  <span>Encoding {encodeProgress.percent}% at {encodeProgress.currentFps} FPS</span>
  <progress class="w-7/8" max="100" value={encodeProgress.percent}>{encodeProgress.percent}%</progress>
{:else if state === DONE}
  <span>Done!</span>
{:else if state === ERROR}
  <p>Error! TODO show simple error info with option to show more complex error info.</p>
  <p>{JSON.stringify(errorInfo)}</p>
{/if}
</div>

<Button color="primary" on:click|once={close}>{closeButtonText(state)}</Button>
