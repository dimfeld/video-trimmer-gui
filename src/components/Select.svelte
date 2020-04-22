<script context="module">
  var noIdCounter = 0;
</script>

<script>
  import { createEventDispatcher, tick } from 'svelte';
  import { find, findIndex, some, isArray } from 'lodash-es';
  import Checkbox from './Checkbox.svelte';
  import TextField from './TextField.svelte';
  import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
  const dispatch = createEventDispatcher();

  export let id;
  export let value = undefined;
  /**
   * Array of:
   * {
   *   id: string;
   *   label: string;
   *   group? : string;
   *   onClick? : (closeCb) => boolean;
   *   // Hide the checkbox, for multiselect items
   *   hideCheckbox?: boolean;
   * }
   *
   * When group is supplied, adjacent items with the same group will be under the same visual heading.
   * If items with a group are noncontiguous, the group header will appear multiple times, so try to
   * avoid that.
   *
   * If onClick returns `false` the value clicked on will not be selected. This can be useful
   * for creating action items within the list. Calling the closeCb callback will force the
   * list to close if it otherwise wouldn't (i.e. in a multiselect).
   */
  export let options = [];
  let classNames = '';
  export { classNames as class };
  export let label = undefined;
  export let labelHidden = false;
  export let placeholder = undefined;
  // TODO
  // If true, the user can type any value. Otherwise, the value must be in the list.
  /* export */ let allowAnyValue = false;
  export let multi = false;
  // Enable autocomplete (only if multi is false)
  export let autocomplete = true;
  export let hint = undefined;
  export let helpText = undefined;

  $: autocompleteEnabled = autocomplete && !multi;

  if (!id) {
    id = `select-${noIdCounter++}`;
  }

  let filteredOptions = options;
  $: {
    filteredOptions = options;

    let trimmed = (textFieldValue || '').trim();
    if (!multi && trimmed.length > 0) {
      let filterValue = trimmed.toLowerCase();
      let foundExact = false;
      let newFilteredOptions = filteredOptions.filter((v) => {
        let l = v.label.toLowerCase();
        if (filterValue === l) {
          foundExact = true;
          return true;
        }

        return v.label.toLowerCase().indexOf(filterValue) > -1;
      });

      if (!newFilteredOptions.length) {
        filteredOptions = [
          {
            id: '_______nomatcheslabel_______',
            label: 'No matches for this filter',
            onClick: (closeCb) => {
              closeCb();
              return false;
            },
            hideCheckbox: true,
          },
        ];
      } else if (!foundExact) {
        // Don't do the filter if we have an exact match.
        filteredOptions = newFilteredOptions;
      }
    }
  }

  $: groupsEnabled = some(options, (o) => o.group);

  // Bound to elements
  export let menuElement = undefined;
  export let textField = undefined;
  export let textFieldContainer = undefined;
  let textFieldValue;

  let optionLookup;
  $: {
    optionLookup = new Map(options.map((o) => [o.id, o]));
    updateTextFieldValue();
  }

  if (multi && value && !isArray(value)) {
    value = [value];
  }
  let activeOption = multi ? null : value;
  let activeOptions = multi ? new Set(value || []) : null;

  let menuVisible = false;
  function onTyping(e) {
    if (textField.value.trim().length > 0) {
      openMenu(false);

      // Reset the highlight index since the filter changed.
      highlightIndex = 0;
    }
  }

  async function scrollToItem(option, middle = false, focusItem = false) {
    if (!option) {
      return;
    }

    await tick();
    if (!menuElement) {
      return;
    }

    let highlighted = menuElement.querySelector(
      `li[data-option-id="${option.id}"`
    );
    if (!highlighted) {
      return;
    }

    let highlightedBottom = highlighted.offsetTop + highlighted.offsetHeight;
    let menuBottom = menuElement.scrollTop + menuElement.offsetHeight;
    if (option === filteredOptions[0]) {
      // Special case for the first item so that we show the group header, if there is one.
      menuElement.scrollTo(0, 0);
    } else if (middle) {
      // Scroll the item to the middle of the select box.
      // Since this is only done on list open we cheat and don't bother checking if the item is visible
      // or not. A more general solution would usually check that before scrolling.

      // This is the top of where we want the item to show up in the visible part of the list box.
      let desiredItemOffset =
        (menuElement.offsetHeight - highlighted.offsetHeight) / 2;
      let desiredTop = highlighted.offsetTop - desiredItemOffset;
      menuElement.scrollTo(0, Math.max(0, desiredTop));
    } else if (highlightedBottom > menuBottom) {
      // Scroll down to make the item visible.
      let desiredTop = highlightedBottom - menuElement.offsetHeight;
      menuElement.scrollTo(0, Math.max(desiredTop, 0));
    } else if (highlighted.offsetTop < menuElement.scrollTop) {
      // Scroll up to make the item visible.
      menuElement.scrollTo(0, highlighted.offsetTop);
    }

    if (focusItem) {
      highlighted.focus();
    }
  }

  function openMenu(focusItem = false) {
    if (menuVisible) {
      return;
    }

    menuVisible = true;
    if (multi) {
      highlightAndScrollToIndex(0);
    } else {
      highlightIndex = findIndex(options, (o) => o.id === activeOption);
      if (highlightIndex === -1) {
        highlightAndScrollToIndex(0, focusItem);
      } else {
        scrollToItem(optionLookup.get(activeOption), true, focusItem);
      }
    }

    if (autocompleteEnabled && !focusItem) {
      textField.focus();
    }
  }

  function toggleMenu() {
    if (menuVisible) {
      closeMenu();
    } else {
      openMenu(!autocompleteEnabled);
    }
  }

  function onDownArrow(e) {
    e.preventDefault();
    if (menuVisible) {
      highlightAndScrollToIndex(highlightIndex + 1);
    } else {
      openMenu(true);
    }
  }

  function onUpArrow(e) {
    if (menuVisible) {
      e.preventDefault();
      if (highlightIndex === 0) {
        highlightIndex = -1;
        textField.focus();
        textField.select();
      } else {
        highlightIndex = Math.max(highlightIndex - 1, 0);
      }
      scrollToItem(filteredOptions[highlightIndex], false, true);
    }
  }

  /*
   * When open in single mode: select item and close
   * When open in multi mode: select item
   */
  function onMenuSpace(e) {
    if (filteredOptions[highlightIndex]) {
      selectItem(filteredOptions[highlightIndex]);
    }

    if (multi) {
      e.preventDefault();
    } else if (!multi) {
      closeMenu();
    }
  }

  /*
   * When closed: open menu
   * When open in single mode: select highlighted if any. Close menu
   * When open in multi mode: close menu
   */
  function onEnter(e) {
    if (menuVisible && highlightIndex > -1) {
      e.preventDefault();

      if (!multi && filteredOptions[highlightIndex]) {
        selectItem(filteredOptions[highlightIndex]);
        if (!menuVisible) {
          // Skip the toggle if the item's click handler closed it.
          return;
        }
      }
    }

    toggleMenu();

    if (!menuVisible) {
      textField.focus();
    }
  }

  /*
   * Tab just closes the menu.
   */
  function onTab() {
    closeMenu();
  }

  function onMenuLeftArrow(e) {
    highlightAndScrollToIndex(0);
  }

  // Scroll to the end
  function onMenuRightArrow(e) {
    highlightAndScrollToIndex(filteredOptions.length - 1);
  }

  function onMenuPageDown(e) {
    e.preventDefault();
    highlightAndScrollToIndex(highlightIndex + 5);
  }

  function onMenuPageUp(e) {
    e.preventDefault();
    highlightAndScrollToIndex(highlightIndex - 5);
  }

  function highlightAndScrollToIndex(newHighlightIndex, focusItem = true) {
    if (newHighlightIndex < 0) {
      highlightIndex = 0;
    } else if (newHighlightIndex > filteredOptions.length - 1) {
      highlightIndex = filteredOptions.length - 1;
    } else {
      highlightIndex = newHighlightIndex;
    }

    scrollToItem(filteredOptions[highlightIndex], false, focusItem);
  }

  function handleTextBoxKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Shift':
      case 'Meta':
      case 'Option':
      case 'Control':
      case 'Escape':
      case 'Tab':
      case 'Enter':
      case 'ArrowUp':
      case 'ArrowDown':
      case ' ':
        break;
      default:
        onTyping(e);
    }
  }

  function handleTextBoxKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Shift':
      case 'Meta':
      case 'Option':
      case 'Control':
        break;
      case ' ':
        e.preventDefault();
        openMenu(!autocompleteEnabled);
        break;
      case 'PageDown':
        onMenuPageDown(e);
        break;
      case 'PageUp':
        onMenuPageUp(e);
        break;
      case 'Escape': {
        if (menuVisible) {
          e.stopPropagation();
          closeMenu();
        }
        break;
      }
      case 'Tab':
        onTab();
        break;
      case 'Enter':
        onEnter(e);
        break;
      case 'ArrowUp':
        onUpArrow(e);
        break;
      case 'ArrowDown':
        onDownArrow(e);
        break;
    }
  }

  function handleMenuKey(e) {
    switch (e.key) {
      case 'ArrowLeft':
        onMenuLeftArrow(e);
        break;
      case 'ArrowRight':
        onMenuRightArrow(e);
        break;
      case 'ArrowUp':
        onUpArrow(e);
        break;
      case 'ArrowDown':
        onDownArrow(e);
        break;
      case 'Tab':
        closeMenu();
        break;
      case 'Enter':
        onEnter(e);
        break;
      case ' ':
        onMenuSpace(e);
        break;
      case 'Escape':
        textField && textField.focus();
        closeMenu();
        break;
      case 'PageDown':
        onMenuPageDown(e);
        break;
      case 'PageUp':
        onMenuPageUp(e);
        break;
      default:
        textField && textField.focus();
        onTyping(e);
    }
  }

  function clickTextField(e) {
    let selectText = autocompleteEnabled && !menuVisible;
    if (multi) {
      toggleMenu();
    } else {
      openMenu(false);
    }

    if (selectText) {
      e.preventDefault();
      textField.select();
    }
  }

  function selectItem(option) {
    if (option.onClick) {
      let clickHandlerResult = option.onClick(closeMenu);
      if (clickHandlerResult === false) {
        return;
      }
    }

    setValue(option.id);
  }

  function clickItem(e, option, index) {
    e.stopPropagation();
    selectItem(option);

    if (multi) {
      highlightIndex = index;
    } else if (!multi && menuVisible) {
      closeMenu();
    }
  }

  function setValue(id) {
    let oldValue = value;
    if (multi) {
      if (activeOptions.has(id)) {
        activeOptions.delete(id);
      } else {
        activeOptions.add(id);
      }
      value = activeOptions ? Array.from(activeOptions) : [];
    } else {
      activeOption = id;
      value = optionLookup.get(activeOption) ? activeOption : null;
    }

    if (value !== oldValue) {
      dispatch('change', value);
    }
    updateTextFieldValue();
  }

  $: {
    // Handle external programmatic updates.
    if (multi) {
      if (!value) {
        value = [];
      }

      if (activeOptions.size !== value.length) {
        activeOptions = new Set(value);
        updateTextFieldValue();
      } else {
        for (let v of [].concat(value || [])) {
          if (!activeOptions.has(v)) {
            activeOptions = new Set(value);
            updateTextFieldValue();
            break;
          }
        }
      }
    } else if (activeOption !== value) {
      activeOption = value;
      updateTextFieldValue();
    }
  }

  function arrowClick(e) {
    e.stopPropagation();
    toggleMenu();
  }

  function handleWindowClick({ target }) {
    if (
      !(
        (textFieldContainer && textFieldContainer.contains(target)) ||
        (menuElement && menuElement.contains(target))
      )
    ) {
      closeMenu();
    }
  }

  function updateTextFieldValue() {
    if (multi) {
      textFieldValue = options
        .filter((o) => activeOptions.has(o.id))
        .map((o) => o.label)
        .join(', ');
    } else {
      let o = optionLookup.get(activeOption);
      textFieldValue = o ? o.label : '';
    }
  }

  function closeMenu() {
    menuVisible = false;
    updateTextFieldValue();
  }

  let highlightIndex = -1;
</script>

<style>
  .highlight {
    @apply bg-gray-200;
  }
</style>

<svelte:window on:click={menuVisible ? handleWindowClick : undefined} />
<div class="relative {classNames}">
  <select aria-hidden="true" tabindex="-1" class="sr-only" name={id} {id}>
    {#each options as option (option.id)}
      <option value={option.id}>{option.label}</option>
    {/each}
  </select>
  <TextField
    id="{id}-tf"
    {label}
    {labelHidden}
    {hint}
    {helpText}
    {placeholder}
    bind:element={textField}
    bind:inputContainer={textFieldContainer}
    bind:value={textFieldValue}
    on:keyup={handleTextBoxKeyUp}
    on:keydown={handleTextBoxKeyDown}
    textFieldClass={autocompleteEnabled ? '' : 'cursor-pointer'}
    readonly={!autocompleteEnabled ? 'true' : undefined}
    autocomplete={autocompleteEnabled ? 'true' : undefined}
    autocapitalize="none"
    spellcheck="false"
    role={autocompleteEnabled ? 'combobox' : 'select'}
    aria-owns="{id}--options"
    aria-autocomplete={autocompleteEnabled ? 'list' : undefined}
    rightIcon={faChevronDown}
    rightIconClasses="cursor-pointer"
    on:click={clickTextField}
    on:click-right={arrowClick} />
  {#if menuVisible}
    <ul
      id="{id}--options"
      on:keydown={handleMenuKey}
      bind:this={menuElement}
      class="flex flex-col shadow-md rounded-b absolute left-0 bg-white w-full
      max-h-48 overflow-y-auto z-10">
      {#each filteredOptions as option, index (option.id)}
        {#if option.group && (index === 0 || option.group !== filteredOptions[index - 1].group)}
          <li
            on:click|preventDefault={() => {
              textField.focus();
            }}
            class="px-3 py-2 sm:text-sm sm:leading-5 text-gray-500 font-bold">
            {option.group}
          </li>
        {/if}

        <li
          tabindex="-1"
          role="option"
          data-option-id={option.id}
          aria-selected={highlightIndex === index ? 'true' : 'false'}
          class:bg-gray-100={option.id === activeOption}
          class:highlight={highlightIndex === index}
          class:pl-6={groupsEnabled && option.group}
          class="cursor-pointer px-3 py-2 sm:text-sm sm:leading-5
          hover:bg-gray-50 focus:outline-none"
          on:click={(e) => clickItem(e, option, index)}>

          <span class="w-full truncate">
            {#if multi && !option.hideCheckbox}
              <Checkbox
                label={option.label}
                labelOnRight={true}
                value={activeOptions.has(option.id)}
                id="{id}-{option.id}" />
            {:else}{option.label}{/if}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
