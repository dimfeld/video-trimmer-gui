<script>
  import TextField from './TextField.svelte';
  export let value;
  export let label;

  $: value = +value || 0;
</script>

<p>{label}</p>
<input type="range" bind:value min="0" max="5" step="0.1" />
<div class="flex items-baseline"><TextField class="w-16" type="number" min="0" max="5" step="0.1" bind:value /><span class="ml-2">seconds</span></div>
