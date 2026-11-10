<script setup>
import { BALANCE } from '../utils/balance.js'
</script>

<template>
  <footer>
    <h3>Usefull links</h3>
    <section class="links">
      <div class="wrap">
        <a
          href="https://vermintide-2-balance-changelogs.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          >changelogs app</a
        >
      </div>
      <div class="wrap">
        <a href="https://discord.gg/C5HST8upJC" target="_blank" rel="noopener noreferrer"
          >Sigmar's Arsenal discord</a
        >
      </div>
      <div class="wrap">
        <RouterLink to="/privacy">Privacy &amp; rules</RouterLink>
      </div>
    </section>

    <div class="disclaimer">
      <p>
        Talents, weapons and gear follow the <strong>{{ BALANCE.name }}</strong> mod ({{
          BALANCE.version
        }}), not the official game balance.
      </p>
      <p>
        This is a personal project made for the Vermintide 2 Modded Realm community. It has no
        connection with
        <strong>Fatshark</strong>.
      </p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  margin-top: var(
    --gap-footer
  ); /* gap between the page content (main) and the footer (style.css) */
  text-align: center;
  padding: 1rem 0;
  border-top: 1px solid var(--line);
  padding-inline: var(--side-padding);
  background: var(--bg); /* full width, like the header (the page behind is textured) */
}

.links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.disclaimer {
  max-width: var(--mx-width);
  margin-inline: auto;
  font-size: 0.8rem;
  color: var(--muted);
}

a {
  text-decoration: none;
}

@media (max-width: 600px) {
  .links {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
