<template>
  <section>
    <div
      v-for="mod in mods"
      :key="mod.id"
      @click="selectMod(mod)"
      :class="{ 'mod-selected': selectedModId === mod.id }">
      <p>{{ mod.label }}</p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  selectedModId: {
    type: Number,
    default: null,
  },
})
const emit = defineEmits(['modSelected'])

const mods = {
  tb: { label: 'tourney balance', id: 1, short: 'tb' },
  clb: { label: 'class balance', id: 2, short: 'cb' },
  cB: { label: 'core balance', id: 3, short: 'cbr' },
  lb: { label: 'linesman balance', id: 4, short: 'lb' },
  lr: { label: 'Live remastered', id: 5, short: 'lr' },
}

const selectMod = (mod) => {
  emit('modSelected', { label: mod.label, id: mod.id })
}
</script>

<style scoped>
section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

div {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: background 0.3s ease;
}

p {
  text-transform: capitalize;
  font-size: var(--fs-body);
}

.mod-selected {
  background: linear-gradient(to right, rgb(203 155 81 / 0.3), rgb(246 226 122 / 0.25)) !important;
  border: 2px solid #dcac5c;
  transform: scale(1.05);
  box-shadow: 0 6px 40px rgb(201 162 74 / 0.4);
}

@media (hover: hover) {
  div:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

@media (max-width: 1024px) {
  p {
    text-align: center;
  }

  section {
    flex-wrap: wrap;
    gap: 1rem;
  }
}

@media (max-width: 550px) {
  div {
    padding: 0 0.5rem;
  }
  section {
    gap: 0.5rem;
    margin-bottom: 0rem;
  }
}
</style>
