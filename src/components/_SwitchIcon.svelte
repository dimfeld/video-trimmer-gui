<script>
  import { fade } from 'svelte/transition';
  export let value = false;
</script>

{#if value}
  <span
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 100 }}
    class="absolute inset-0 h-full w-full flex items-center justify-center
    transition-opacity">

    <svg
      class="h-3 w-3 text-primary-600"
      fill="currentColor"
      viewBox="0 0 12 12">
      <path
        d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0
        001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2
        2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
    </svg>
  </span>
{:else}
  <span
    in:fade={{ duration: 100 }}
    out:fade={{ duration: 200 }}
    class="absolute inset-0 h-full w-full flex items-center justify-center
    transition-opacity">
    <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
      <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
        <path
          d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </svg>
  </span>
{/if}
