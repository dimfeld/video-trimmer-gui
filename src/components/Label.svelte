<script>
  let classNames = '';
  export { classNames as class };
  let forId;
  export { forId as for };
  export let hidden = false;
  export let block = false;
  // This just lightens the label some more.
  export let disabled = false;

  $: color = disabled ? 'text-gray-400' : 'text-gray-700';
  $: classes = hidden ? 'sr-only' : `text-sm font-medium leading-5 ${color}`;

  $: blockClass = block && !hidden ? 'block' : '';
</script>

<label for={forId} class="{blockClass} {classes} {classNames}">
  <slot />
</label>
