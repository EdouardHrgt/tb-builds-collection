<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import TalentGrid from '../components/TalentGrid.vue'
import GearSlot from '../components/GearSlot.vue'
import LikeButton from '../components/LikeButton.vue'
import BreakpointCard from '../components/BreakpointCard.vue'
import CommentSection from '../components/CommentSection.vue'

const {
  getCareer,
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
// career color (heroes.json) exposed as a CSS variable; the CSS falls back to gold without it
const careerStyle = computed(() => {
  const color = build.value && getCareer(build.value.heroId, build.value.careerId)?.color
  return color ? { '--career-color': color } : {}
})
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

function onLikeChanged(res) {
  build.value.likeCount = res.likeCount
  build.value.likedByMe = res.liked
}

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
  <article v-else :style="careerStyle">
    <header class="build-head">
      <h1>{{ build.title }}</h1>
      <LikeButton :build="build" @changed="onLikeChanged" />
    </header>
    <p class="meta">
      {{ heroName(build.heroId) }} | {{ careerName(build.heroId, build.careerId) }} ·
      <span class="author">by {{ build.author }}</span>
    </p>

    <div v-if="isOwner" class="actions">
      <RouterLink :to="`/builds/${build.id}/edit`" class="btn">Edit</RouterLink>
      <button class="btn danger" @click="remove">Delete</button>
    </div>

    <p v-if="build.description" class="desc">{{ build.description }}</p>

    <p v-if="!isCurrentFormat" class="error">
      This build uses an outdated format and cannot be displayed.
    </p>
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
          readonly />
        <GearSlot
          v-for="slot in EQUIPMENT_SLOTS"
          :key="slot.id"
          :model-value="equipmentSel(slot.id)"
          :label="slot.name"
          :slot-icon="slot.icon"
          :traits="slot.traits"
          :properties="slot.properties"
          readonly />
      </div>
      <template v-if="build.data.breakpoints?.length">
        <h2>Fast breakpoints</h2>
        <div class="bp-list">
          <BreakpointCard
            v-for="c in build.data.breakpoints"
            :key="`${c.type}-${c.attack}`"
            :card="c" />
        </div>
      </template>
      <template v-if="build.data.teammates?.length">
        <h2>Recommended teammates</h2>
        <ul class="teammates">
          <li
            v-for="t in build.data.teammates"
            :key="`${t.heroId}-${t.careerId}`"
            :title="`${careerName(t.heroId, t.careerId)} (${heroName(t.heroId)})`">
            <img
              v-if="getCareer(t.heroId, t.careerId)?.icon"
              :src="getCareer(t.heroId, t.careerId).icon"
              :alt="`${careerName(t.heroId, t.careerId)} (${heroName(t.heroId)})`"
              width="64"
              height="79" />
          </li>
        </ul>
      </template>
    </template>
    <CommentSection :build-id="build.id" :build-author-id="build.authorId" />
  </article>
</template>

<style scoped>
.build-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.build-head h1 {
  margin: 0 0 0.5rem;
  overflow-wrap: anywhere;
}
.author {
  color: var(--accent);
}
.gear-grid {
  display: grid;
  gap: 0.8rem;
  align-items: start;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
.bp-list {
  display: grid;
  gap: 0.8rem;
  align-items: start;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
.teammates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.teammates img {
  display: block;
  width: 64px;
  height: auto; /* the height comes from aspect-ratio (source images are 154x189) */
  aspect-ratio: 154 / 189;
  object-fit: cover;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
}
</style>
