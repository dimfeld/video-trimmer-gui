<script>
  export let duration;

  export let start;
  export let end;

  function dragElement(node) {
    let x;
    let y;

    function dispatchDrag(name, evt) {
      node.dispatchEvent(new CustomEvent(name, { detail: { x: evt.clientX, y: evt.clientY, dx: evt.clientX - x, dy: evt.clientY - y }}));
      x = evt.clientX;
      y = evt.clientY;
    }

    function handleMouseMove(evt) {
      dispatchDrag('dragMove', evt);
    }

    function handleMouseUp(evt) {
      node.removeEventListener('mousemove', handleMouseMove);
      node.removeEventListener('mouseup', handleMouseUp);
      dispatchDrag('dragEnd', evt);
    }

    function handleMouseDown(evt) {
      x = evt.clientX;
      y = evt.clientY;

      node.addEventListener('mousemove', handleMouseMove);
      node.addEventListener('mouseup', handleMouseUp);
      dispatchDrag('dragStart', evt);
    }

    node.addEventListener('mousedown', handleMouseDown);

    return {
      destroy() {
        node.removeEventListener('mousedown', handleMouseDown);
        node.removeEventListener('mousemove', handleMouseMove);
        node.removeEventListener('mouseup', handleMouseUp);
      }
    }
  }

  let container;
  let dragData = {
    start: {
      dragging: false,
      time: 0
    },
    end: {
      dragging: false,
      time: duration,
    }
  }

  function handleDragStart(type) {
    dragData[type].dragging = true;
  }

  function handleDragEnd(type, { dx }) {
    dragData[type].time += dx / container.width;
    dragData[type].dragging = false;
  }

  function handleDrag(type, { dx }) {
    dragData[type].time += dx / container.width;
  }

</script>

<div class="w-full h-8" bind:this={container}>
  <div class="absolute w-2 h-8 bg-black shadow cursor-pointer"
    class:bg-gray-500={dragData.start.dragging}
    on:dragStart={() => handleDragStart('start')}
    on:dragMove={(evt) => handleDrag('start', evt.detail)}
    on:dragEnd={(evt) => handleDragEnd('start', evt.detail)}
    use:dragElement />
  <div class="absolute w-2 h-8 bg-black shadow cursor-pointer"
    style="transform:translateX("
    class:bg-gray-500={dragData.end.dragging}
    on:dragStart={() => handleDragStart('start')}
    on:dragMove={(evt) => handleDrag('end', evt.detail)}
    on:dragEnd={(evt) => handleDragEnd('end', evt.detail)}
    use:dragElement />
</div>
