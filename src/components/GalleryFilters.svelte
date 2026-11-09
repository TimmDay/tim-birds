<script lang="ts">
  import { onMount } from 'svelte';
  import {
    EMPTY_FILTERS,
    filterPhotos,
    filtersFromSearch,
    filtersToSearch,
    type Filters,
    type GalleryPhoto,
  } from '../lib/filters.ts';
  import type { PlumageColor } from '../lib/types.ts';

  type Option = { value: string; label: string };
  type Props = {
    photos: GalleryPhoto[];
    species: Option[];
    countries: Option[];
    states: (Option & { country: string })[];
    years: number[];
    colors: PlumageColor[];
  };
  let { photos, species, countries, states, years, colors }: Props = $props();

  // Start empty so the server render and hydration agree; apply the URL on mount.
  let filters: Filters = $state({ ...EMPTY_FILTERS });
  let open = $state(false);
  let ready = $state(false);

  const visible = $derived(filterPhotos(photos, filters));
  const activeCount = $derived(
    filters.species.length +
      filters.country.length +
      filters.state.length +
      filters.year.length +
      filters.color.length,
  );
  const shownStates = $derived(
    filters.country.length
      ? states.filter((s) => filters.country.includes(s.country))
      : states,
  );

  onMount(() => {
    filters = filtersFromSearch(location.search);
    ready = true;
  });

  // Show and order the server-rendered tiles; keep the URL in step.
  $effect(() => {
    if (!ready) return;
    const order = new Map(visible.map((p, i) => [p.id, i]));
    for (const tile of document.querySelectorAll<HTMLElement>(
      '[data-photo-id]',
    )) {
      const i = order.get(tile.dataset.photoId ?? '');
      tile.hidden = i === undefined;
      tile.style.order = String(i ?? 0);
    }
    const search = filtersToSearch(filters);
    if (search !== location.search)
      history.replaceState(history.state, '', `${location.pathname}${search}`);
    document.dispatchEvent(new CustomEvent('gallery:filtered'));
  });

  function toggle<K extends 'species' | 'country' | 'state' | 'color'>(
    key: K,
    value: Filters[K][number],
  ) {
    const list = filters[key] as string[];
    filters = {
      ...filters,
      [key]: list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    };
  }
  function toggleYear(y: number) {
    filters = {
      ...filters,
      year: filters.year.includes(y)
        ? filters.year.filter((v) => v !== y)
        : [...filters.year, y],
    };
  }
  const clear = () => (filters = { ...EMPTY_FILTERS, sort: filters.sort });
</script>

<div class="filters">
  <div class="summary">
    <button
      class="toggle"
      type="button"
      aria-expanded={open}
      onclick={() => (open = !open)}
    >
      Filters{activeCount ? ` (${activeCount})` : ''}
    </button>
    <p class="count" aria-live="polite">
      {visible.length} of {photos.length} photos
    </p>
    <label class="sort">
      <span>Sort</span>
      <select bind:value={filters.sort}>
        <option value="newest">Newest first</option>
        <option value="taxonomic">Taxonomic</option>
      </select>
    </label>
  </div>

  <div class:open class="panel" role="group" aria-label="Photo filters">
    <div class="sheet-head">
      <strong>Filters</strong>
      <button type="button" onclick={() => (open = false)}>Done</button>
    </div>

    <fieldset>
      <legend>Plumage Color</legend>
      <div class="swatches">
        {#each colors as c (c)}
          <button
            type="button"
            class="swatch"
            style={`--swatch: var(--plumage-${c})`}
            aria-pressed={filters.color.includes(c)}
            onclick={() => toggle('color', c)}
          >
            <span class="dot" aria-hidden="true"></span>{c}
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Year</legend>
      <div class="chips">
        {#each years as y (y)}
          <button
            type="button"
            aria-pressed={filters.year.includes(y)}
            onclick={() => toggleYear(y)}>{y}</button
          >
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Country</legend>
      <div class="chips">
        {#each countries as c (c.value)}
          <button
            type="button"
            aria-pressed={filters.country.includes(c.value)}
            onclick={() => toggle('country', c.value)}
          >
            {c.label}
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>State</legend>
      <div class="chips">
        {#each shownStates as s (s.value)}
          <button
            type="button"
            aria-pressed={filters.state.includes(s.value)}
            onclick={() => toggle('state', s.value)}
          >
            {s.label}
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset class="species">
      <legend>Species</legend>
      <ul>
        {#each species as s (s.value)}
          <li>
            <label>
              <input
                type="checkbox"
                checked={filters.species.includes(s.value)}
                onchange={() => toggle('species', s.value)}
              />
              {s.label}
            </label>
          </li>
        {/each}
      </ul>
    </fieldset>

    {#if activeCount}
      <button class="clear" type="button" onclick={clear}>Clear all</button>
    {/if}
  </div>
  {#if open}
    <button
      class="scrim"
      type="button"
      aria-label="Close filters"
      onclick={() => (open = false)}
    ></button>
  {/if}
</div>

<style>
  .filters {
    margin-bottom: var(--space-5);
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
  }
  .count {
    margin: 0;
    color: var(--color-ink-muted);
    font-size: var(--text-sm);
    flex: 1;
  }
  button,
  select {
    font: inherit;
    color: inherit;
  }
  .toggle,
  .chips button,
  .swatch,
  .clear,
  select,
  .sheet-head button {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-line);
    border-radius: 999px;
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    cursor: pointer;
    min-height: 36px;
  }
  .toggle {
    font-weight: 600;
  }
  .sort {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-ink-muted);
  }
  [aria-pressed='true'] {
    border-color: var(--color-first-light);
    color: var(--color-first-light);
    background: color-mix(
      in srgb,
      var(--color-first-light) 12%,
      var(--color-surface-raised)
    );
  }

  .panel {
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-4);
    padding: var(--space-4);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
  }
  .sheet-head {
    display: none;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  legend {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    margin-bottom: var(--space-2);
  }
  .chips,
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .swatch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    text-transform: capitalize;
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--swatch);
    box-shadow: 0 0 0 1px rgb(255 255 255 / 0.25);
  }
  .species ul {
    list-style: none;
    margin: 0;
    padding: 0;
    columns: 14rem;
    max-height: 14rem;
    overflow: auto;
  }
  .species label {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    font-size: var(--text-sm);
    padding: 2px 0;
  }
  input[type='checkbox'] {
    accent-color: var(--color-first-light);
  }
  .clear {
    justify-self: start;
  }
  .scrim {
    display: none;
  }

  /* Desktop: the panel shows inline when toggled. Mobile: a bottom sheet. */
  .panel:not(.open) {
    display: none;
  }
  @media (max-width: 719px) {
    .panel {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      max-height: 82dvh;
      overflow: auto;
      margin: 0;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      background: var(--color-surface-raised);
      padding-bottom: calc(var(--space-5) + env(safe-area-inset-bottom));
    }
    .sheet-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: calc(-1 * var(--space-4));
      background: var(--color-surface-raised);
      padding: var(--space-2) 0;
    }
    .scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 19;
      border: 0;
      background: rgb(0 0 0 / 0.5);
    }
    .sort span {
      display: none;
    }
  }
</style>
