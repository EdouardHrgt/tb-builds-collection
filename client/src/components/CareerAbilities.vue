<script setup>
import { ref, computed } from 'vue'
import { showDescriptions } from '../composables/useDescriptions.js'
import DescriptionsToggle from './DescriptionsToggle.vue'
import SectionIcon from './SectionIcon.vue'

// What a career brings on its own (nothing to pick): its perks, its passive ability and its career skill.
// career: an entry of heroes.json ({ perks: [{ name, description }], passive / skill: { name, description, icon } }).
// form: inside a <form> of the editor (fieldset + legend) instead of a page section (section + h2).
const props = defineProps({
  career: { type: Object, default: null },
  form: { type: Boolean, default: false },
})

// Passive ability and career skill: one line, two elements
const pair = computed(() =>
  [
    { key: 'passive', kind: 'Passive ability', a: props.career?.passive },
    { key: 'skill', kind: 'Career skill', a: props.career?.skill },
  ].filter((x) => x.a),
)

const box = props.form ? 'fieldset' : 'section'

// The description of an element opens in a box right under it, on hover. Touch screens have no hover:
// a tap pins the box (a second tap closes it). Nothing opens while "Show descriptions" is on.
const hovered = ref('')
const pinned = ref('')
const isOpen = (id) => !showDescriptions.value && (hovered.value === id || pinned.value === id)
const togglePin = (id) => (pinned.value = pinned.value === id ? '' : id)
</script>

<template>
  <template v-if="career && (career.perks?.length || career.passive || career.skill)">
    <component :is="box" v-if="career.perks?.length" class="abilities">
      <!-- Page: the title and the "Show descriptions" button share one line. Editor: the button sits on the
           frame line, opposite the legend. -->
      <legend v-if="form">Perks</legend>
      <DescriptionsToggle v-if="form" class="form-toggle" />
      <div v-else class="title-row">
        <h2 class="with-icon"><SectionIcon name="perks" />Perks</h2>
        <DescriptionsToggle />
      </div>
      <div class="perks">
        <div
          v-for="(p, i) in career.perks"
          :key="p.name"
          class="item"
          :class="{ open: isOpen('perk' + i) }"
          @mouseenter="hovered = 'perk' + i"
          @mouseleave="hovered = ''">
          <button
            type="button"
            class="card perk"
            :aria-expanded="isOpen('perk' + i)"
            @click="togglePin('perk' + i)">
            <span class="main">
              <svg class="diamond" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="none" stroke="currentColor" stroke-width="1.6" />
              </svg>
              <span class="name">{{ p.name }}</span>
            </span>
            <span v-if="showDescriptions" class="desc">{{ p.description }}</span>
          </button>
          <p v-if="isOpen('perk' + i)" class="info" role="note">{{ p.description }}</p>
        </div>
      </div>
    </component>

    <component :is="box" v-if="pair.length" class="abilities">
      <legend v-if="form">Passive &amp; career skill</legend>
      <h2 v-else class="with-icon"><SectionIcon name="passive" />Passive &amp; career skill</h2>
      <div class="pair">
        <div
          v-for="{ key, kind, a } in pair"
          :key="key"
          class="item"
          :class="{ open: isOpen(key) }"
          @mouseenter="hovered = key"
          @mouseleave="hovered = ''">
          <button type="button" class="card" :aria-expanded="isOpen(key)" @click="togglePin(key)">
            <span class="main">
              <img :src="a.icon" alt="" width="44" height="44" class="icon" loading="lazy" />
              <span class="text">
                <span class="kind">{{ kind }}</span>
                <span class="name">{{ a.name }}</span>
              </span>
            </span>
            <span v-if="showDescriptions" class="desc">{{ a.description }}</span>
          </button>
          <p v-if="isOpen(key)" class="info" role="note">{{ a.description }}</p>
        </div>
      </div>
    </component>
  </template>
</template>

<style scoped>
/* On a page: a plain section under an h2. In the editor: a fieldset, with the look of the other
   fieldsets of the form (global border / padding in style.css) and the same legend font as BuildEditor. */
section.abilities {
  margin: 0 0 1.4rem;
}
fieldset.abilities {
  min-width: 0;
}
legend {
  font-weight: 600;
  font-family: 'New Rocker', system-ui;
  letter-spacing: 1px;
  font-size: 1.5rem;
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.8rem 0 0.6rem; /* same as a plain h2 (style.css) */
}
.title-row h2 {
  margin: 0;
}
fieldset.abilities {
  position: relative;
}
.form-toggle {
  position: absolute;
  top: -1.2rem;
  right: 1rem;
  background: var(--bg); /* hides the frame line behind the button */
}

.perks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.2rem 0.6rem;
  align-items: stretch;
}
.pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  align-items: stretch; /* the cards of a row all get the same height */
}

/* One element + the box that opens under it, glued to it and exactly as wide */
.item {
  position: relative;
  display: flex;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: stretch;
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 0.35rem 0.2rem;
  font: inherit;
  color: var(--text);
  background: none; /* plain text, not a card */
  border: 0;
  cursor: help;
}
.item:hover .name,
.item.open .name {
  color: var(--career-color, var(--accent));
}
.main {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.perk .main {
  gap: 0.5rem;
}
.diamond {
  flex: none;
  color: var(--career-color, var(--accent));
}
.icon {
  flex: none;
  width: var(--icon-size);
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 4px;
  background: var(--bg);
}
.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.kind {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.name {
  font-weight: 600;
  transition: color 0.15s;
}
.desc {
  font-size: 0.9rem;
  color: var(--muted);
}
.info {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 5;
  margin: 0;
  padding: 0.6rem;
  font-size: 0.9rem;
  color: var(--text);
  background: color-mix(in srgb, var(--panel) 80%, #000);
  border: 2px solid var(--career-color, var(--accent));
  border-radius: 6px;
  box-shadow: 0 8px 18px rgb(0 0 0 / 0.45);
}

@media (max-width: 700px) {
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>
