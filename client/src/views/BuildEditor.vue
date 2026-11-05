<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { heroes, ITEM_SLOTS } from '../data/index.js'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const editingId = route.params.id // undefined = creating
const form = ref({
  title: '',
  description: '',
  heroId: heroes[0].id,
  careerId: heroes[0].careers[0].id,
  isPublic: true,
  talents: [0, 0, 0, 0, 0, 0],
  items: Object.fromEntries(ITEM_SLOTS.map((s) => [s.key, ''])),
})
const error = ref('')
const saving = ref(false)

const careers = computed(() => heroes.find((h) => h.id === form.value.heroId)?.careers ?? [])

function onHeroChange() {
  form.value.careerId = careers.value[0].id
}

onMounted(async () => {
  if (!editingId) return
  try {
    const b = await api(`/builds/${editingId}`)
    if (b.authorId !== auth.user.id) return router.replace(`/builds/${b.id}`)
    form.value = {
      title: b.title,
      description: b.description,
      heroId: b.heroId,
      careerId: b.careerId,
      isPublic: b.isPublic,
      talents: [...b.data.talents],
      items: { ...form.value.items, ...b.data.items },
    }
  } catch (e) {
    error.value = e.message
  }
})

async function save() {
  error.value = ''
  saving.value = true
  const f = form.value
  const body = {
    title: f.title,
    description: f.description,
    heroId: f.heroId,
    careerId: f.careerId,
    isPublic: f.isPublic,
    data: { talents: f.talents, items: f.items },
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
  <h1>{{ editingId ? 'Edit build' : 'New build' }}</h1>
  <form class="form" novalidate @submit.prevent="save">
    <label
      >Title
      <input v-model="form.title" maxlength="80" required />
    </label>

    <div class="row">
      <label
        >Hero
        <select v-model="form.heroId" @change="onHeroChange">
          <option v-for="h in heroes" :key="h.id" :value="h.id">{{ h.name }}</option>
        </select>
      </label>
      <label
        >Career
        <select v-model="form.careerId">
          <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
    </div>

    <fieldset>
      <legend>Talents</legend>
      <div v-for="(_, i) in form.talents" :key="i" class="tier">
        <span>Tier {{ i + 1 }}</span>
        <label v-for="n in [0, 1, 2, 3]" :key="n">
          <input type="radio" :name="`tier${i}`" :value="n" v-model="form.talents[i]" />
          {{ n === 0 ? 'none' : n }}
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Equipment</legend>
      <label v-for="s in ITEM_SLOTS" :key="s.key"
        >{{ s.label }}
        <input v-model="form.items[s.key]" maxlength="120" />
      </label>
    </fieldset>

    <label
      >Description
      <textarea v-model="form.description" rows="5" maxlength="2000" />
    </label>

    <label class="check"> <input type="checkbox" v-model="form.isPublic" /> Public build </label>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
  </form>
</template>
