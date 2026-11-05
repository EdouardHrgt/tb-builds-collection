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
        <a
          href="https://vt2-tourney-balance.github.io/Tourney-Balance-Open-Beta/patch-notes/"
          target="_blank"
          rel="noopener noreferrer"
          >official Documentation</a
        >
      </div>
      <div class="wrap">
        <a href="https://discord.gg/BepCgkBJqW" target="_blank" rel="noopener noreferrer"
          >Modded discord</a
        >
      </div>
      <div class="wrap">
        <a href="https://www.ranalds.gift/" target="_blank" rel="noopener noreferrer"
          >ranalds.gift</a
        >
      </div>
    </section>

    <div class="disclaimer">
      <p>|| This project is not affiliated with <strong>Fatshark</strong> ||</p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  /* position: fixed;
  bottom: 0;
  left: 0;
  right: 0; */
  text-align: center;
  padding: 1rem 0;
  border-top: 1px solid var(--line);
  padding-inline: var(--side-padding);
  margin-top: 5rem;
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
