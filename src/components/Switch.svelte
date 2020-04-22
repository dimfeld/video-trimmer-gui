<script>
  import { createEventDispatcher } from 'svelte';
  import SwitchIcon from './_SwitchIcon.svelte';
  const dispatch = createEventDispatcher();

  let classNames = '';
  export let id = undefined;
  export { classNames as class };
  export let value = false;
  export let size = 'md';
  export let icon = false;

  let focused = false;

  function toggle() {
    value = !value;
    dispatch('change', value);
  }

  function handleKeydown(evt) {
    if (evt.key === 'Space') {
      evt.preventDefault();
      toggle();
    }
  }
</script>

{#if size === 'md'}
  <span
    {id}
    class:bg-gray-200={!value}
    class:bg-primary-600={value}
    class="relative inline-block flex-shrink-0 h-6 w-11 border-2
    border-transparent rounded-full cursor-pointer transition-colors ease-in-out
    duration-200 focus:outline-none focus:shadow-outline {classNames}"
    role="checkbox"
    tabindex="0"
    on:click={toggle}
    on:keydown={handleKeydown}
    aria-checked={value.toString()}>
    <span
      aria-hidden="true"
      class:translate-x-5={value}
      class:translate-x-0={!value}
      class="inline-block h-5 w-5 rounded-full bg-white shadow transform
      transition ease-in-out duration-200">
      {#if icon}
        <SwitchIcon {value} />
      {/if}
    </span>
  </span>
{:else if size === 'sm'}
  <span
    {id}
    on:click={toggle}
    on:keydown={handleKeydown}
    aria-checked={value.toString()}
    on:focus={() => (focused = true)}
    on:blur={() => (focused = false)}
    class="relative inline-flex items-center justify-center flex-shrink-0 h-5
    w-10 cursor-pointer focus:outline-none {classNames}"
    role="checkbox"
    tabindex="0">
    <span
      aria-hidden="true"
      class:bg-gray-200={!value}
      class:bg-primary-600={value}
      class="absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out
      duration-200" />
    <span
      aria-hidden="true"
      class:translate-x-5={value}
      class:translate-x-0={!value}
      class:shadow-outline={focused}
      class:border-blue-300={focused}
      class="absolute left-0 inline-block h-5 w-5 border border-gray-200
      rounded-full bg-white shadow transform transition-transform ease-in-out
      duration-200">
      {#if icon}
        <SwitchIcon {value} />
      {/if}
    </span>
  </span>
{/if}
