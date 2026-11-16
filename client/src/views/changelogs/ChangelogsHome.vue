<script setup>
import CareersList from '../../components/changelogs/CareersList.vue'
</script>

<template>
  <div class="home">
    <CareersList />
    <h1>Pick a career to see the <strong class="title-str">Changelogs</strong></h1>
  </div>
</template>

<style scoped>
.home {
  position: relative;
}

h1 {
  text-align: center;
  font-size: var(--fs-1);
  margin-block: 2rem;
  text-transform: uppercase;
  font-family: 'Rubik Marker Hatch', system-ui;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 1px;
  color: var(--grey-400);
}

.title-str {
  background: linear-gradient(to right, #fdd90c, #ff5e00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 768px) {
  h1 {
    margin-block: 1rem;
  }
}
</style>
