<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import TalentGrid from '../components/TalentGrid.vue'
import CareerAbilities from '../components/CareerAbilities.vue'
import SectionIcon from '../components/SectionIcon.vue'
import GearSlot from '../components/GearSlot.vue'
import LikeButton from '../components/LikeButton.vue'
import BookmarkButton from '../components/BookmarkButton.vue'
import BreakpointCard from '../components/BreakpointCard.vue'
import UserAvatar from '../components/UserAvatar.vue'
import CommentSection from '../components/CommentSection.vue'
import { buildToText } from '../utils/buildText.js'
import { copyText } from '../utils/clipboard.js'
import { BALANCE } from '../utils/balance.js'

const gameData = useGameData()
const {
  getCareer,
  heroName,
  careerName,
  getCareerTalents,
  getHeroWeapons,
  getSlotOptions,
  getWeaponSlots,
  EQUIPMENT_SLOTS,
} = gameData

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
const career = computed(() => build.value && getCareer(build.value.heroId, build.value.careerId))
const talentTiers = computed(() => getCareerTalents(build.value.heroId, build.value.careerId))
// melee + ranged, or a second melee weapon for Grail Knight / Slayer / Warrior Priest
const weaponSlots = computed(() => getWeaponSlots(build.value.heroId, build.value.careerId))
// Read only: every weapon of the hero that fits the slot, so a saved weapon is always found
const slotWeapons = (slot) => slot.types.flatMap((type) => getHeroWeapons(build.value.heroId, type))
const slotOptions = (slot) => getSlotOptions(build.value.heroId, slot, weaponSel(slot.key).weaponId)

// "Share" copies the address of the page, "Export" a text version of the build.
// The button shows a short confirmation (or the failure) for 2 seconds.
const shareNotice = ref('') // empty = the normal label
const exportNotice = ref('')
function flash(notice, text) {
  notice.value = text
  setTimeout(() => (notice.value = ''), 2000)
}
async function share() {
  const ok = await copyText(window.location.origin + route.path)
  flash(shareNotice, ok ? 'Link copied!' : 'Copy failed')
}
async function exportBuild() {
  const ok = await copyText(buildToText(build.value, gameData))
  flash(exportNotice, ok ? 'Build copied!' : 'Copy failed')
}

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
      <!-- Left: title, who / what, description -->
      <div class="head-main">
        <div class="title-row">
          <h1>{{ build.title }}</h1>
          <div class="reactions">
            <LikeButton :build="build" @changed="onLikeChanged" />
            <BookmarkButton :build="build" />
          </div>
        </div>
        <p class="meta">
          {{ heroName(build.heroId) }} | {{ careerName(build.heroId, build.careerId) }}
          <span
            v-if="build.data.balance"
            class="tb-tag"
            :class="{ old: build.data.balance !== BALANCE.version }"
            :title="
              build.data.balance === BALANCE.version
                ? `Made for ${BALANCE.name} ${build.data.balance}`
                : `Made for ${BALANCE.name} ${build.data.balance} (current: ${BALANCE.version}). Edit and save the build to update it.`
            "
            >{{ BALANCE.short }} {{ build.data.balance }}</span
          >
        </p>
        <RouterLink :to="`/u/${build.author}`" class="author-row" title="See profile">
          <UserAvatar :id="build.authorAvatar" />
          <span class="meta">by <span class="author">{{ build.author }}</span></span>
        </RouterLink>
        <!-- Owner only: Edit / Delete, right under the title -->
        <div v-if="isOwner" class="owner-actions">
          <RouterLink :to="`/builds/${build.id}/edit`" class="btn">Edit</RouterLink>
          <button type="button" class="btn danger" @click="remove">Delete</button>
        </div>
        <p v-if="build.description" class="desc">{{ build.description }}</p>
      </div>

      <!-- Right: career portrait, with the buttons next to it -->
      <aside class="head-side">
        <img
          v-if="career?.icon"
          :src="career.icon"
          :alt="career.name"
          class="head-portrait"
          width="120"
          height="147" />
        <div class="share-actions">
          <button type="button" class="btn" @click="share">{{ shareNotice || 'Share' }}</button>
          <button v-if="isCurrentFormat" type="button" class="btn" @click="exportBuild">
            {{ exportNotice || 'Export' }}
          </button>
          <!-- Opens the editor with a copy of this build (anyone can copy a build; it is saved as a new build of yours) -->
          <RouterLink v-if="isCurrentFormat" :to="`/builds/new?from=${build.id}`" class="btn">
            Duplicate
          </RouterLink>
        </div>
      </aside>
    </header>

    <p v-if="!isCurrentFormat" class="error">
      This build uses an outdated format and cannot be displayed.
    </p>
    <template v-else>
      <CareerAbilities :career="career" />

      <!-- Golden line with a diamond (global .ornament): sets the talents apart from perks and passive -->
      <div class="ornament" aria-hidden="true">◆</div>

      <h2 class="with-icon"><SectionIcon name="talents" />Talents</h2>
      <TalentGrid :model-value="build.data.talents" :tiers="talentTiers" readonly />

      <!-- Equipment on the left, breakpoints in the middle, synergies on the far right -->
      <div
        class="gear-layout"
        :class="{ 'no-bp': !build.data.breakpoints?.length }"
        :style="{ '--bp-n': build.data.breakpoints?.length || 0 }">
        <section class="area-gear">
          <h2 class="with-icon"><SectionIcon name="equipment" />Equipment</h2>
          <div class="gear-column">
            <GearSlot
              v-for="slot in weaponSlots"
              :key="slot.key"
              :model-value="weaponSel(slot.key)"
              :label="slot.label"
              :weapons="slotWeapons(slot)"
              :traits="slotOptions(slot).traits"
              :properties="slotOptions(slot).properties"
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
        </section>

        <section v-if="build.data.breakpoints?.length" class="area-bp">
          <h2 class="with-icon"><SectionIcon name="breakpoints" />Breakpoints</h2>
          <div class="bp-list">
            <BreakpointCard
              v-for="c in build.data.breakpoints"
              :key="`${c.type}-${c.attack}`"
              :card="c" />
          </div>
        </section>

        <section v-if="build.data.teammates?.length" class="area-team">
          <h2 class="with-icon"><SectionIcon name="team" />Ideal team</h2>
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
        </section>
      </div>
    </template>
    <CommentSection :build-id="build.id" :build-author-id="build.authorId" />
  </article>
</template>

<style scoped>
.build-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 1rem 2rem;
}
.title-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}
.reactions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.2rem;
}
.build-head h1 {
  margin: 0 0 0.5rem;
  overflow-wrap: anywhere;
  letter-spacing: 0.7px;
}
.head-side {
  display: grid;
  gap: 0.6rem;
  min-width: 12rem;
}
.head-portrait {
  display: block;
  justify-self: center;
  width: 120px;
  height: auto; /* the height comes from aspect-ratio (source images are 154x189) */
  aspect-ratio: 154 / 189;
  object-fit: cover;
  border-radius: 8px;
}
/* Edit + Delete side by side, under the title (owner only) */
.owner-actions {
  display: flex;
  gap: 0.5rem;
  margin: 0 0 0.8rem;
}
/* Share, and Export below it: gold text, no background, thin border */
.share-actions {
  display: grid;
  gap: 0.5rem;
}
.share-actions .btn {
  text-align: center;
  color: #fff;
  background: transparent;
  border: 1px solid var(--line);
}
.share-actions .btn:hover {
  border-color: var(--accent);
}
@media (max-width: 700px) {
  .build-head {
    grid-template-columns: 1fr;
  }
  .head-portrait {
    justify-self: start;
  }
}
.author {
  color: var(--accent);
}
.author-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: fit-content;
  margin: 0.5rem 0 0.8rem;
  text-decoration: none;
}
.author-row .meta {
  margin: 0;
}
/* Balance version the build was saved with; dimmed when it is not the current one */
.tb-tag {
  display: inline-block;
  margin-left: 0.4rem;
  padding: 0.05rem 0.5rem;
  font-size: 0.78rem;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 999px;
  vertical-align: 1px;
}
.tb-tag.old {
  color: var(--muted);
  border-color: var(--line);
}
/* Three columns from 1280px: equipment | breakpoints | ideal team (right next to the breakpoint cards).
   1024-1279px: equipment | breakpoints, ideal team below. Under 1024px: one column.
   Without breakpoints (.no-bp), from 1024px: equipment | ideal team, side by side. */
.gear-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0 2rem;
  align-items: start;
}
.area-gear,
.area-bp,
.area-team {
  min-width: 0;
}
.gear-column {
  display: grid;
  gap: 0.8rem;
}
@media (min-width: 1024px) {
  .gear-layout {
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    grid-template-areas:
      'gear bp'
      'gear team';
  }
  .gear-layout.no-bp {
    grid-template-columns: minmax(300px, 380px) auto;
    grid-template-areas: 'gear team';
  }
  .area-gear { grid-area: gear; }
  .area-bp { grid-area: bp; }
  .area-team { grid-area: team; }
}
@media (min-width: 1280px) {
  /* The middle column is only as wide as its cards need (up to 320px each, within the free width): with
     1 or 2 breakpoints the ideal team stays next to them instead of drifting to the far right. */
  .gear-layout {
    grid-template-columns:
      minmax(300px, 380px)
      minmax(0, max(0px, calc(var(--bp-n, 1) * 320px + (var(--bp-n, 1) - 1) * 0.8rem)))
      auto;
    grid-template-areas: 'gear bp team';
  }
  .gear-layout.no-bp {
    grid-template-columns: minmax(300px, 380px) auto;
    grid-template-areas: 'gear team';
  }
  .bp-list {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* few cards: no empty column */
  }
}
.bp-list {
  display: grid;
  gap: 0.8rem;
  align-items: start; /* an opened card does not stretch its neighbours */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}
.teammates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: fit-content;
  padding: 0.7rem;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  margin: 0;
  list-style: none;
}
.teammates img {
  display: block;
  width: 64px;
  height: auto; /* the height comes from aspect-ratio (source images are 154x189) */
  aspect-ratio: 154 / 189;
  object-fit: cover;
  border-radius: 8px;
  background: transparent; /* same background as the section frame */
}
</style>
