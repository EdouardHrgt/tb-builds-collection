<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import TalentGrid from '../components/TalentGrid.vue'
import GearSlot from '../components/GearSlot.vue'

const {
  heroName,
  careerName,
  getCareerTalents,
  getHeroWeapons,
  getWeaponOptions,
  WEAPON_SLOTS,
  EQUIPMENT_SLOTS,
} = useGameData()

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const build = ref(null)
const error = ref('')
const isOwner = computed(() => build.value && auth.user?.id === build.value.authorId)
const isCurrentFormat = computed(() => build.value?.data?.v === 2)
const talentTiers = computed(() => getCareerTalents(build.value.heroId, build.value.careerId))

// Missing slots (older builds, new slots added later) fall back to "nothing picked"
const weaponSel = (key) => build.value.data.weapons?.[key] ?? {}
const equipmentSel = (key) => build.value.data.equipment?.[key] ?? {}

onMounted(async () => {
  try {
    build.value = await api(`/builds/${route.params.id}`)
  } catch (e) {
    error.value = e.message
  }
})

async function remove() {
  if (!confirm('Permanently delete this build?')) return
  try {
    await api(`/builds/${build.value.id}`, { method: 'DELETE' })
    router.push('/me')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="!build">Loading…</p>
  <article v-else>
    <h1>{{ build.title }}</h1>
    <p class="meta">
      {{ heroName(build.heroId) }} — {{ careerName(build.heroId, build.careerId) }} · by
      {{ build.author }}<span v-if="!build.isPublic"> · private</span>
    </p>

    <div v-if="isOwner" class="actions">
      <RouterLink :to="`/builds/${build.id}/edit`" class="btn">Edit</RouterLink>
      <button class="btn danger" @click="remove">Delete</button>
    </div>

    <p v-if="build.description" class="desc">{{ build.description }}</p>

    <p v-if="!isCurrentFormat" class="error">This build uses an outdated format and cannot be displayed.</p>
    <template v-else>
      <h2>Talents</h2>
      <TalentGrid :model-value="build.data.talents" :tiers="talentTiers" readonly />

      <h2>Equipment</h2>
      <div class="gear-grid">
        <GearSlot
          v-for="slot in WEAPON_SLOTS"
          :key="slot.key"
          :model-value="weaponSel(slot.key)"
          :label="slot.label"
          :weapons="getHeroWeapons(build.heroId, slot.key)"
          :traits="getWeaponOptions(slot.key).traits"
          :properties="getWeaponOptions(slot.key).properties"
          readonly
        />
        <GearSlot
          v-for="slot in EQUIPMENT_SLOTS"
          :key="slot.id"
          :model-value="equipmentSel(slot.id)"
          :label="slot.name"
          :slot-icon="slot.icon"
          :traits="slot.traits"
          :properties="slot.properties"
          readonly
        />
      </div>
    </template>
  </article>
</template>

<style scoped>
.gear-grid {
  display: grid;
  gap: 0.8rem;
  align-items: start;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
</style>