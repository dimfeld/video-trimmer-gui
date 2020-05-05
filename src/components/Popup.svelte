<script>
  import Button from './Button.svelte';
  import { scale } from 'svelte/transition';
  import { cubicIn, cubicOut } from 'svelte/easing';
  export let title = undefined;

  let classNames = '';
  export { classNames as class };

  export let open = false;

  function clickOutside(node, initialOpen) {
    const handleOutsideClick = ({ target }) => {
      if (open && !node.contains(target)) {
        open = false;
        console.log('closing');
      }
    };

    function update(isOpen) {
      if (isOpen) {
        window.addEventListener('click', handleOutsideClick);
      } else {
        window.removeEventListener('click', handleOutsideClick);
      }
    }

    update(initialOpen);
    return {
      update,
      destroy: () => window.removeEventListener('click', handleOutsideClick),
    };
  }
</script>

<div style="display:inherit" use:clickOutside={open}>
  <Button {title} class={classNames} on:click={(evt) => open = !open }>
    <slot name="label" />
  </Button>
  {#if open}
    <div
      in:scale={{ duration: 100, start: 0.95, easing: cubicOut }}
      out:scale={{ duration: 75, start: 0.95, easing: cubicIn }}
      class="absolute left-0 top-0 bg-gray-300 rounded-lg shadow-lg p-4" style="transform:translateX(calc(-100% - 1rem)) translateY(-90%)">
      <slot name="popup"/>
    </div>
  {/if}
</div>
