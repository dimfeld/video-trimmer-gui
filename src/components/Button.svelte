<script>
  export let size = 'md';
  export let disabled = undefined;
  export let color = 'normal';
  export let justify = 'center';
  let classNames = '';
  export { classNames as class };

  export let element = undefined;

  export function focus() {
    element && element.focus();
  }
  export function blur() {
    element && element.blur();
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    around: 'justify-around',
    betweem: 'justify-between',
  };
  $: justifyClass = justifyClasses[justify];

  let sizes = {
    xxs: 'px-2 py-1 text-xs leading-3 rounded',
    xs: 'px-2.5 py-1.5 text-xs leading-4 rounded',
    sm: 'px-3 py-2 text-sm leading-4 rounded-md',
    md: 'px-4 py-2 text-sm leading-5 rounded-md',
    lg: 'px-4 py-2 text-base leading-6 rounded-md',
    xl: 'px-6 py-3 text-base leading-6 rounded-md',
  };
  $: sizeClasses = sizes[size];

  let colors = {
    primary:
      'focus:border-primary-700 focus:shadow-outline-primary active:bg-primary-700 border-transparent',
    secondary:
      'focus:border-primary-300 focus:shadow-outline-primary active:bg-primary-200 border-transparent',
    normal:
      'border-gray-300 bg-white focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50',
    danger:
      'border-transparent focus:border-red-100 focus:shadow-outline-red active:text-gray-800 active:bg-red-100',
  };
  $: colorClasses = colors[color];

  let enabledClasses = {
    primary: 'text-white hover:bg-primary-500 bg-primary-600',
    secondary: 'text-primary-700 hover:bg-primary-50 bg-primary-100 ',
    normal: 'text-gray-700 hover:text-gray-500',
    danger: 'text-gray-700 hover:text-gray-500 bg-red-400',
  };

  let disabledClasses = {
    primary: 'text-gray-200 cursor-default bg-primary-400',
    secondary: 'text-primary-400 cursor-default bg-primary-50',
    normal: 'text-gray-500 cursor-default',
    danger: 'text-gray-500 cursor-default bg-red-300',
  };

  $: stateClasses = disabled ? disabledClasses[color] : enabledClasses[color];
</script>

<svelte:options accessors />
<button
  type="button"
  bind:this={element}
  class="shadow-sm inline-flex items-center border font-medium
  focus:outline-none transition ease-in-out duration-150 {sizeClasses}
  {colorClasses}
  {stateClasses}
  {justifyClass}
  {classNames}"
  {disabled}
  on:click>
  <slot />
</button>
