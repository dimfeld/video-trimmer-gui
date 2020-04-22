<script>
  // Copied from https://github.com/RobBrazier/svelte-awesome
  export let id = '';
  export let data = {};
</script>

<polygon key="polygon-{id}" {...data} />
