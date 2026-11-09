<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { useGameData } from '../composables/useGameData.js'
import TalentGrid from '../components/TalentGrid.vue'
import GearSlot from '../components/GearSlot.vue'
import BreakpointBuilder from '../components/BreakpointBuilder.vue'
import TeammatePicker from '../components/TeammatePicker.vue'

const {
  heroes,
  getHero,
  getCareer,
  getCareerTalents,
  getAvailableWeapons,
  getWeaponOptions,
  WEAPON_SLOTS,
  EQUIPMENT_SLOTS,
} = useGameData()

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const emptyTalents = () => [0, 0, 0, 0, 0, 0]
const emptyGear = () => ({ traitId: '', propertyIds: ['', ''] })
const emptyWeapon = () => ({ weaponId: '', ...emptyGear() })

const editingId = route.params.id // undefined = creating
const form = ref({
  title: '',
  description: '',
  heroId: heroes[0].id,
  careerId: heroes[0].careers[0].id,
  talents: emptyTalents(),
  weapons: Object.fromEntries(WEAPON_SLOTS.map((s) => [s.key, emptyWeapon()])),
  equipment: Object.fromEntries(EQUIPMENT_SLOTS.map((s) => [s.id, emptyGear()])),
  breakpoints: [],
  teammates: [],
})
const error = ref('')
const saving = ref(false)

const careers = computed(() => getHero(form.value.heroId)?.careers ?? [])
const currentCareerName = computed(
  () => getCareer(form.value.heroId, form.value.careerId)?.name ?? '',
)
// Accent color of the picked career (heroes.json). Without it the CSS falls back to gold.
const careerStyle = computed(() => {
  const color = getCareer(form.value.heroId, form.value.careerId)?.color
  return color ? { '--career-color': color } : {}
})
const talentTiers = computed(() => getCareerTalents(form.value.heroId, form.value.careerId))
const availableWeapons = (type) => getAvailableWeapons(form.value.heroId, form.value.careerId, type)

// Hero / career changes are handled by explicit handlers (not watchers) so that
// loading an existing build never wipes its talents and weapons.
function setCareer(careerId) {
  form.value.careerId = careerId
  form.value.talents = emptyTalents() // talents belong to a career
  for (const { key } of WEAPON_SLOTS) {
    const sel = form.value.weapons[key]
    if (sel.weaponId && !availableWeapons(key).some((w) => w.id === sel.weaponId)) sel.weaponId = ''
  }
  suggestTitle()
}

function setHero(heroId) {
  form.value.heroId = heroId
  form.value.teammates = form.value.teammates.filter((t) => t.heroId !== heroId) // one of each hero per team
  setCareer(getHero(heroId).careers[0].id)
}

// New build only: the title starts as the career name and follows career changes,
// until the user writes something else (or empties the field).
let autoTitle = ''
function suggestTitle() {
  if (editingId) return
  if (form.value.title !== '' && form.value.title !== autoTitle) return // the user wrote their own
  const name = getCareer(form.value.heroId, form.value.careerId)?.name ?? ''
  form.value.title = name
  autoTitle = name
}
suggestTitle()

// --- API <-> form conversions ("" in the form, null / compact array in the API) ---
const pad = (ids = []) => [ids[0] ?? '', ids[1] ?? '']
const fromGear = (g = {}) => ({ traitId: g.traitId ?? '', propertyIds: pad(g.propertyIds) })
const fromWeapon = (w = {}) => ({ weaponId: w.weaponId ?? '', ...fromGear(w) })
const cleanGear = (g) => ({
  traitId: g.traitId || null,
  propertyIds: g.propertyIds.filter(Boolean),
})
const cleanWeapon = (w) => ({ weaponId: w.weaponId || null, ...cleanGear(w) })
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]))

onMounted(async () => {
  if (!editingId) return
  try {
    const b = await api(`/builds/${editingId}`)
    if (b.authorId !== auth.user.id) return router.replace(`/builds/${b.id}`)
    if (b.data.v !== 2) {
      error.value = 'This build uses an outdated format and cannot be edited (sorry not sorry :p).'
      return
    }
    form.value = {
      title: b.title,
      description: b.description,
      heroId: b.heroId,
      careerId: b.careerId,
      talents: [...b.data.talents],
      weapons: Object.fromEntries(
        WEAPON_SLOTS.map((s) => [s.key, fromWeapon(b.data.weapons?.[s.key])]),
      ),
      equipment: Object.fromEntries(
        EQUIPMENT_SLOTS.map((s) => [s.id, fromGear(b.data.equipment?.[s.id])]),
      ),
      breakpoints: (b.data.breakpoints ?? []).map((c) => ({ ...c, enemyIds: [...c.enemyIds] })),
      teammates: (b.data.teammates ?? []).map((t) => ({ ...t })),
    }
  } catch (e) {
    error.value = e.message
  }
})

const TITLE_MIN = 5
const TITLE_MAX = 30

async function save() {
  error.value = ''

  const titleLength = form.value.title.trim().length
  if (titleLength < TITLE_MIN || titleLength > TITLE_MAX) {
    error.value = `Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`
    return
  }

  saving.value = true
  const f = form.value
  const body = {
    title: f.title,
    description: f.description,
    heroId: f.heroId,
    careerId: f.careerId,
    data: {
      v: 2,
      talents: f.talents,
      weapons: mapValues(f.weapons, cleanWeapon),
      equipment: mapValues(f.equipment, cleanGear),
      breakpoints: f.breakpoints,
      teammates: f.teammates,
    },
  }
  try {
    const saved = editingId
      ? await api(`/builds/${editingId}`, { method: 'PUT', body })
      : await api('/builds', { method: 'POST', body })
    router.push(`/builds/${saved.id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="align-section">
    <h1>{{ editingId ? 'Edit build' : 'New build' }}</h1>
    <form class="form wide" :style="careerStyle" novalidate @submit.prevent="save">
      <div class="measure">
        <label>
          Title
          <input v-model="form.title" :maxlength="TITLE_MAX" required />
        </label>

        <label>
          Hero
          <select :value="form.heroId" @change="setHero($event.target.value)">
            <option v-for="h in heroes" :key="h.id" :value="h.id">{{ h.name }}</option>
          </select>
        </label>

        <fieldset>
          <legend>Career</legend>
          <div class="career-list">
            <label
              v-for="c in careers"
              :key="c.id"
              class="career"
              :title="c.name"
              :style="{ '--career-color': c.color || 'initial' }">
              <input
                type="radio"
                name="career"
                class="sr-only"
                :value="c.id"
                :checked="form.careerId === c.id"
                @change="setCareer(c.id)" />
              <img :src="c.icon" :alt="c.name" class="career_img" />
            </label>
          </div>
          <small class="meta">{{ currentCareerName }}</small>
        </fieldset>
      </div>

      <fieldset>
        <legend>Talents</legend>
        <TalentGrid v-model="form.talents" :tiers="talentTiers" />
      </fieldset>

      <fieldset>
        <legend>Equipment</legend>
        <div class="gear-grid">
          <GearSlot
            v-for="slot in WEAPON_SLOTS"
            :key="slot.key"
            v-model="form.weapons[slot.key]"
            :label="slot.label"
            :weapons="availableWeapons(slot.key)"
            :traits="getWeaponOptions(slot.key).traits"
            :properties="getWeaponOptions(slot.key).properties" />
          <GearSlot
            v-for="slot in EQUIPMENT_SLOTS"
            :key="slot.id"
            v-model="form.equipment[slot.id]"
            :label="slot.name"
            :slot-icon="slot.icon"
            :traits="slot.traits"
            :properties="slot.properties" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Breakpoints</legend>
        <BreakpointBuilder v-model="form.breakpoints" />
      </fieldset>

      <fieldset>
        <legend>Recommended teammates</legend>
        <TeammatePicker v-model="form.teammates" :hero-id="form.heroId" />
      </fieldset>

      <div class="measure">
        <label class="description-label">
          Description
          <textarea v-model="form.description" rows="5" maxlength="2000" />
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div>
          <button class="btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </form>
  </section>
</template>

<style scoped>
section {
  padding-right: var(--side-padding);
}
.form.wide {
  max-width: none;
}
.measure {
  display: grid;
  gap: 1rem;
  max-width: 640px;
}
.career-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.career {
  position: relative;
  display: block;
  cursor: pointer;
}

.career img {
  display: block;
  object-fit: cover;
  font-size: 0.7rem;
  overflow: hidden;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 8px;
  height: auto;
  aspect-ratio: 1 / 1;
  width: var(--icon-size);
}
.career:hover img {
  border-color: var(--career-color, var(--accent));
}
.career input:checked + img {
  border-color: var(--career-color, #ffd75e);
  box-shadow:
    0 0 0 1px var(--career-color, #ffd75e),
    0 0 12px color-mix(in srgb, var(--career-color, #ffd75e) 55%, transparent);
}
.career input:focus-visible + img {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.gear-grid {
  display: grid;
  gap: 0.8rem;
  align-items: start;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
legend,
.description-label {
  font-weight: 600;
  font-family: 'New Rocker', system-ui;
  letter-spacing: 1px;
  font-size: 1.5rem;
}
</style>
