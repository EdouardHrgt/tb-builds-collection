<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import { heroName, careerName, ITEM_SLOTS } from '../data/index.js'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const build = ref(null)
const error = ref('')
const isOwner = computed(() => build.value && auth.user?.id === build.value.authorId)

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

    <h2>Talents</h2>
    <ol class="talents">
      <li v-for="(t, i) in build.data.talents" :key="i">
        Tier {{ i + 1 }} : <strong>{{ t ? `choice ${t}` : '—' }}</strong>
      </li>
    </ol>

    <h2>Equipment</h2>
    <dl class="items">
      <template v-for="s in ITEM_SLOTS" :key="s.key">
        <dt>{{ s.label }}</dt>
        <dd>{{ build.data.items[s.key] || '—' }}</dd>
      </template>
    </dl>
  </article>
</template>
