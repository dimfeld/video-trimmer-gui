<script>
  import VwCenter from './VwCentered.svelte';
  import Card from './Card.svelte';
  import Button from './Button.svelte';
  import { createEventDispatcher } from 'svelte';

  export let width = undefined;
  export let height = undefined;
  export let dim = true;
  export let showHeader = true;
  export let showFooter = true;
  export let fullScreenOnMobile = true;
  export let showHeaderOnMobile = true;
  export let showFooterOnMobile = true;
  export let showHeaderOnDesktop = true;
  export let showFooterOnDesktop = true;
  // True to automatically add a close button. Mostly useful when there is no other button to add
  export let closeButton = false;
  let classNames = '';
  export { classNames as class };

  const dispatch = createEventDispatcher();

  let cardDiv;

  function cancel() {
    dispatch('cancel');
  }

  function handleKey({ key }) {
    if (key === 'Escape') {
      event.stopPropagation();
      dispatch('escPressed');
      dispatch('cancel');
    }
  }

  let cardClasses = '';
  let headerClasses = '';
  let footerClasses = '';
  $: {
    let computedSizeClasses = [
      ...(width || '').split(' '),
      ...(height || '').split(' '),
    ].filter(Boolean);

    let fullScreenClasses = '';

    if (fullScreenOnMobile) {
      fullScreenClasses = `w-full h-full ${width ? '' : 'sm:w-auto'} ${
        height ? '' : 'sm:h-auto'
      }`;

      computedSizeClasses = computedSizeClasses.map((c) =>
        c.indexOf(':') === -1 ? `sm:${c}` : c
      );
    }

    cardClasses = [...computedSizeClasses, fullScreenClasses, classNames].join(
      ' '
    );
  }
</script>

<svelte:window on:keyup={handleKey} />

<VwCenter
  on:click={(evt) => evt.stopPropagation()}
  {dim}>
  <Card
    bind:element={cardDiv}
    class={cardClasses}
    showHeader={showHeader || closeButton}
    showFooter={showFooter || closeButton}
    showHeaderOnMobile={showHeaderOnMobile || closeButton}
    showFooterOnMobile={showFooter ? showFooterOnMobile : false}
    showHeaderOnDesktop={showHeader ? showHeaderOnDesktop : false}
    showFooterOnDesktop={showFooterOnDesktop || closeButton}>
    <slot />

    <div
      slot="header"
      class="flex flex-row w-full font-bold text-md sm:text-xl">
      {#if closeButton}
        <!-- Mobile close button -->
        <div class="inline sm:hidden mr-auto">
          <Button class="mr-2" on:click={cancel}>Back</Button>
        </div>
      {/if}
      <slot name="header" />
    </div>

    <div slot="footer" class="flex flex-row w-full">
      <slot name="footer" />
      {#if closeButton}
        <!-- Non-mobile close button -->
        <Button class="hidden sm:inline ml-auto" on:click={cancel}>
          Close
        </Button>
      {/if}
    </div>
  </Card>
</VwCenter>
