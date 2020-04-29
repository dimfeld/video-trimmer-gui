<script>
  import { fade } from 'svelte/transition';
  export let dim = false;
  export let fullScreenOnMobile = false;

  $: responsiveClasses = fullScreenOnMobile
    ? 'items-stretch sm:items-center'
    : 'items-center';
</script>

<style>
  .dim-bg {
    background-color: rgba(0, 0, 0, 0.4);
  }
</style>

<div
  on:click
  on:mousedown
  on:mouseup
  class="fixed flex z-50 m-0 w-full h-full left-0 top-0 justify-center {responsiveClasses}"
  class:dim-bg={dim}
  transition:fade={{ duration: 200 }}>
  <slot />
</div>
