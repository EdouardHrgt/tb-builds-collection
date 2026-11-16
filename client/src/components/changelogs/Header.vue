<template>
  <header>
  <Difficulties class="diff"/>
    <RouterLink to="/changelogs">
      <img src="/changelogs/logo.webp" alt="logo Vermintide 2" />
      <p>Balance Mods Changelogs</p>
    </RouterLink>
  </header>
</template>

<script setup>
import Difficulties from './Difficulties.vue'
</script>

<style scoped>
header {
  display: flex;
  align-items: center;
  padding-top: 1rem;
  position: relative;
}

.diff {
  position: absolute;
  left: 2rem;
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
  background: linear-gradient(to right, #fdd90c, #ff5e00);
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
  header {
    flex-direction: column-reverse;

  }
  img {
    width: 13rem;
  }
  p {
    position: relative;
    bottom: 32px;
  }
  .diff {
  position: relative;
  left: auto;
  margin-top: -1rem;
}

}
</style>
