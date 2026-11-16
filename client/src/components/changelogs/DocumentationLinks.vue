<script setup>
const mods = [
  {
    label: 'Tourney Balance',
    link: 'https://vt2-tourney-balance.github.io/Tourney-Balance-Open-Beta/patch-notes/v38-0/',
  },
  {
    label: 'Class Balance',
    link: 'https://docs.google.com/document/d/1f86vISpIZu7y_Zr3-hJxQKkOWd7Q7YwcUWL4wT59W8E/edit?tab=t.0',
  },
  {
    label: 'Core Big Rebalance ',
    extra: '(talents)',
    link: 'https://docs.google.com/document/d/1_X8E9Kz1He26HeJ5SFHQKF1caUTvFOcXVTCNann_k14/edit?tab=t.0#heading=h.x9a19rz0176u',
  },
  {
    label: 'Core Big Rebalance ',
    extra: '(weapons)',
    link: 'https://docs.google.com/document/d/1NTgcDVgWbCkofuKzJGdsbauyUDt_cVKds2bzNdY7HHY/edit?tab=t.0#heading=h.siw0ntbhc1es',
  },
  {
    label: 'Linesman Balance',
    link: 'https://docs.google.com/document/d/1Eo65Rrb7K6oxMVpRYt8EMkqzqc_uI9c1RVSIxhMdXYs/edit?tab=t.0#heading=h.i0nyhofz21so',
  },
]
</script>

<template>
  <footer>
    <h2>Official Documentation</h2>
    <ul>
      <li v-for="mod in mods" :key="mod.label">
        <a :href="mod.link" target="_blank" rel="noopener noreferrer">
          {{ mod.label }} <span v-if="mod.extra" class="extra">{{ mod.extra }}</span>
        </a>
      </li>
    </ul>
  </footer>
</template>

<style scoped>
footer {
  /* The background of the site header, a bit darker */
  background: linear-gradient(rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.5)), var(--panel);
  padding-block: 1.2rem;
  padding-inline: 2rem;
  width: 100%;
  position: absolute;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

ul {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

li:nth-child(odd) {
  text-align: right;
}

li:nth-child(even) {
  text-align: left;
}

li:last-child {
  grid-column: span 2;
  text-align: center;
}

h2 {
  color: var(--grey-400);
  font-size: var(--fs-3);
  text-transform: uppercase;
  font-family: 'Quintessential', serif;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0;
}

a {
  font-weight: 900;
  letter-spacing: 0.5px;
  background: linear-gradient(to left, #fdd90c, #ff5e00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  font-size: var(--fs-body);
  transition: all 0.4s ease;
}

.extra {
  background: none;
  color: var(--grey-400);
  -webkit-text-fill-color: var(--grey-400);
  font-size: 12px;
}

@media (hover: hover) {
  a:hover {
    background: var(--red-900);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

@media (max-width: 768px) {
  ul {
    display: block;
  }

  li {
    margin-bottom: 0.5rem;
  }

  li:nth-child(odd),
  li:nth-child(even),
  li:last-child {
    text-align: center;
  }
}
</style>
