<template>
  <div class="careers-nav">
    <ul>
      <li v-for="career in careers" :key="career.name" class="tooltip" :data-tooltip="career.name">
        <RouterLink :to="`/changelogs/${career.name}`">
          <img :src="career.icon" :alt="'icon of ' + career.name" />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { careers } from '../../data/changelogs-careers.js'
</script>

<style scoped>
ul {
  display: flex;
  align-items: center;
  gap: 3rem;
  justify-content: center;
  margin-top: 2rem;
}

li img {
  transition: all 0.3s ease;
}

.tooltip {
  position: relative;
  cursor: pointer;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 5px 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

@media (hover: hover) {
  li:hover img {
    filter: grayscale(100%);
    transform: scale(1.08);
  }

  .tooltip:hover::after {
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  ul {
    gap: 0;
    margin-top: 2rem;
    justify-content: space-evenly;
  }
}

@media (max-width: 750px) {
  li img {
    width: 5.5rem;
  }
}

@media (max-width: 550px) {
  ul {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  li img {
    width: 4rem;
  }
}
</style>
