<script>
  export let shadow = true;
  let classNames = '';
  export { classNames as class };

  // Overall controls for showing header and footer.
  export let showHeader = true;
  export let showFooter = true;

  // Mobile/desktop switches for header and footer. This and the showHeader/showFooter
  // must be true to show the element.
  export let showHeaderOnMobile = true;
  export let showFooterOnMobile = true;
  export let showHeaderOnDesktop = true;
  export let showFooterOnDesktop = true;
  // This pretty much only controls whether or not the shadow shows up on mobile.
  export let fullScreenOnMobile = false;

  // Card binds its div on this element
  export let element = undefined;

  let windowWidth = window.innerWidth;

  let baseClasses = ['rounded-md', 'border'];
  $: responsiveClasses = (fullScreenOnMobile
    ? baseClasses.map((c) => `sm:${c}`)
    : baseClasses
  ).join(' ');

  let headerClasses = '';
  let footerClasses = '';
  $: {
    if (showHeaderOnMobile && !showHeaderOnDesktop) {
      headerClasses = 'flex sm:hidden';
    } else if (showHeaderOnDesktop && !showHeaderOnMobile) {
      headerClasses = 'hidden sm:flex';
    } else {
      headerClasses = 'flex';
    }

    if (showFooterOnMobile && !showFooterOnDesktop) {
      footerClasses = 'flex sm:hidden';
    } else if (showFooterOnDesktop && !showFooterOnMobile) {
      footerClasses = 'hidden sm:flex';
    } else {
      footerClasses = 'flex';
    }
  }
</script>

<style lang="postcss">
  .header > :global(*) {
    @apply flex flex-row flex-shrink-0 flex-grow-0 items-center
        border-b border-gray-200
        p-2 w-full bg-primary-300;
  }

  .footer > :global(*) {
    @apply flex flex-row flex-shrink-0 flex-grow-0 items-center
        border-t border-gray-200
        p-2 w-full;
  }
</style>

<svelte:window bind:innerWidth={windowWidth} />

<div
  bind:this={element}
  class="flex flex-col flex-shrink-0 flex-grow-0 border-gray-400 bg-white {responsiveClasses}
  {classNames}"
  class:shadow-md={shadow && !fullScreenOnMobile}
  class:sm:shadow-md={shadow && fullScreenOnMobile}>

  {#if showHeader}
    <div class="header {headerClasses}">
      <slot name="header" />
    </div>
  {/if}

  <div class="flex flex-grow flex-col p-2 overflow-y-auto">
    <slot />
  </div>

  {#if showFooter}
    <div class="footer {footerClasses}">
      <slot name="footer" />
    </div>
  {/if}
</div>
