<script setup>
import { BALANCE } from '../utils/balance.js'

defineProps({
  // On the Changelogs pages the footer sits right under the page, without the usual gap
  flush: { type: Boolean, default: false },
})

// Official documentation of the balance mods (shown in the Changelogs section too)
const docs = [
  {
    label: 'Tourney Balance',
    url: 'https://vt2-tourney-balance.github.io/Tourney-Balance-Open-Beta/patch-notes/v38-0/',
  },
  {
    label: 'Class Balance',
    url: 'https://docs.google.com/document/d/1f86vISpIZu7y_Zr3-hJxQKkOWd7Q7YwcUWL4wT59W8E/edit?tab=t.0',
  },
  {
    label: 'Core Big Rebalance (talents)',
    url: 'https://docs.google.com/document/d/1_X8E9Kz1He26HeJ5SFHQKF1caUTvFOcXVTCNann_k14/edit?tab=t.0#heading=h.x9a19rz0176u',
  },
  {
    label: 'Core Big Rebalance (weapons)',
    url: 'https://docs.google.com/document/d/1NTgcDVgWbCkofuKzJGdsbauyUDt_cVKds2bzNdY7HHY/edit?tab=t.0#heading=h.siw0ntbhc1es',
  },
  {
    label: 'Linesman Balance',
    url: 'https://docs.google.com/document/d/1Eo65Rrb7K6oxMVpRYt8EMkqzqc_uI9c1RVSIxhMdXYs/edit?tab=t.0#heading=h.i0nyhofz21so',
  },
]
</script>

<template>
  <footer :class="{ flush }">
    <div class="columns">
      <section class="col">
        <h3>Sigmar's Arsenal</h3>
        <RouterLink to="/privacy">Privacy &amp; rules</RouterLink>
        <div class="disclaimer">
          <p>
            Talents, weapons and gear follow the
            <strong>{{ BALANCE.name }} mod ({{ BALANCE.version }})</strong>, not the official game
            balance.
          </p>
          <p>
            This is a personal project made for the Vermintide 2 Modded Realm community. It has no
            connection with
            <strong>Fatshark</strong>.
          </p>
        </div>
      </section>

      <section class="col">
        <h3>Changelogs</h3>
        <ul>
          <li v-for="doc in docs" :key="doc.url">
            <a :href="doc.url" target="_blank" rel="noopener noreferrer">{{ doc.label }}</a>
          </li>
        </ul>
      </section>
    </div>
  </footer>
</template>

<style scoped>
footer {
  margin-top: var(
    --gap-footer
  ); /* gap between the page content (main) and the footer (style.css) */
  padding: 1.5rem var(--side-padding);
  border-top: 1px solid var(--line);
  background: var(--bg); /* full width, like the header (the page behind is textured) */
}

.flush {
  margin-top: 0;
}

/* Two columns: the site (left) and the changelogs documentation (right) */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem 3rem;
  max-width: var(--mx-width);
  margin-inline: auto;
}

.col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

/* On wide screens the site column is right-aligned, so both columns lean toward the middle */
.col:first-child {
  align-items: flex-end;
  text-align: right;
}

h3 {
  margin: 0 0 0.3rem;
}

.sub {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.disclaimer {
  max-width: 25rem;
  margin-top: 0.8rem;
  font-size: 0.8rem;
  color: var(--muted);
}

.disclaimer p {
  margin: 0 0 0.5rem;
}

a {
  text-decoration: none;
}

strong {
  color: rgb(201, 201, 201);
}

@media (max-width: 600px) {
  .columns {
    grid-template-columns: 1fr;
  }
  /* Everything centred on mobile */
  .col,
  .col:first-child {
    align-items: center;
    text-align: center;
  }
}
</style>
