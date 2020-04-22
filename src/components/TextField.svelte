<script context="module">
  var noIdCounter = 0;
</script>

<script>
  import Icon from './Icon.svelte';
  import Label from './Label.svelte';
  import { createEventDispatcher } from 'svelte';

  export let id;
  export let label = undefined;
  export let labelHidden = false;
  export let hint = undefined;
  export let placeholder = '';
  export let helpText = undefined;
  export let value = '';
  export let error = undefined;
  export let rightIcon = undefined;
  export let rightIconClasses = '';
  /** A function of the form (value:string) => string|null that returns an error message or a falsy value. */
  export let valid = undefined;
  /** Validate on input or change. */
  export let validateOn = 'change';

  let classNames = '';
  export { classNames as class };

  export let textFieldClass = '';

  let textFieldNode = undefined;
  export { textFieldNode as element };
  export let inputContainer = undefined;

  const dispatch = createEventDispatcher();

  export function focus() {
    textFieldNode && textFieldNode.focus();
  }

  export function blur() {
    textFieldNode && textFieldNode.blur();
  }

  export function select() {
    textFieldNode && textFieldNode.select();
  }

  if (value === undefined || value === null) {
    value = '';
  }

  if (valid && error === undefined) {
    error = '';
  }

  if (!id) {
    id = `textfield-${noIdCounter++}`;
  }

  let labelJustify = '';
  $: {
    let labelVisible = label && !labelHidden;
    if (labelVisible && hint) {
      labelJustify = 'justify-between';
    } else if (labelVisible) {
      labelJustify = 'justify-start';
    } else if (hint) {
      labelJustify = 'justify-end';
    }
  }

  function validate({ target: { value } }) {
    if (valid) {
      error = valid(value) || '';
    }
  }

  // TODO Support the leading and trailing icons from Tailwind UI once Svelte supports
  // programmatic $$slots access, so that we can adjust the input appropriately.
</script>

<style>
  input.error {
    @apply pr-10 border-red-300 text-red-900;
  }

  input:invalid {
    @apply pr-10 border-red-300 text-red-900;
  }

  input.error::placeholder {
    @apply text-red-300;
  }

  input:invalid::placeholder {
    @apply text-red-300;
  }

  input.error:focus {
    @apply shadow-outline-red;
  }

  input:focus:invalid {
    @apply shadow-outline-red;
  }
</style>

<svelte:options accessors />
<div class={classNames}>
  <div class="flex {labelJustify}">
    {#if label}
      <Label for={id} block={true} hidden={labelHidden}>{label}</Label>
    {/if}
    {#if hint}
      <span class="text-sm leading-5 text-gray-500">{hint}</span>
    {/if}
  </div>
  <div
    class:mt-1={hint || (label && !labelHidden)}
    class:error
    class="relative rounded-md shadow-sm"
    bind:this={inputContainer}>
    <input
      {id}
      bind:value
      bind:this={textFieldNode}
      class:error
      class="form-input block w-full sm:text-sm sm:leading-5
      disabled:text-gray-700 {textFieldClass}"
      on:input
      on:input={valid && validateOn === 'input' ? validate : undefined}
      on:blur
      on:focus
      on:click
      on:keydown
      on:keyup
      on:change
      on:change={valid && validateOn === 'change' ? validate : undefined}
      {...$$restProps}
      {placeholder} />
    {#if error}
      <div
        class="absolute inset-y-0 right-0 pr-3 flex items-center
        pointer-events-none">
        <svg
          class="h-5 w-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012
            0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd" />
        </svg>
      </div>
    {:else if rightIcon}
      <div
        class="bg-white absolute inset-y-1 right-1 pr-2 pl-1 flex items-center {rightIconClasses}"
        on:click={() => dispatch('click-right')}>
        <Icon class="h-5 w-5" data={rightIcon} />
      </div>
    {/if}
  </div>
  {#if helpText}
    <div class="mt-2 text-sm text-gray-500">{helpText}</div>
  {/if}
  {#if error !== undefined && error !== null}
    <div class="mt-2 text-sm text-red-600">
      {@html error || '&nbsp;'}
    </div>
  {/if}
</div>
