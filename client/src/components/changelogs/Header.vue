<template>
  <header>
    <RouterLink :to="to">
      <img src="/changelogs/logo.webp" alt="logo Vermintide 2" />
      <p>{{ title }}</p>
    </RouterLink>
  </header>
</template>

<script setup>
// Title written on the logo, and where the logo leads to (set per page, see the routes)
defineProps({
  title: { type: String, default: 'Balance Mods Changelogs' },
  to: { type: String, default: '/changelogs' },
})
</script>

<style scoped>
header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  position: relative;
}

a {
  display: block;
  margin: auto;
  text-decoration: none;
  position: relative;
}

img {
  width: 20rem;
  margin-inline: auto;
}

p {
  text-align: center;
  position: absolute;
  bottom: 20px;
  font-size: 20px;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  font-weight: 900;
  font-family: 'Quintessential', serif;
}

@media (max-width: 1024px) {
  img {
    width: 13rem;
  }
  p {
    position: relative;
    bottom: 32px;
  }
}
</style>
