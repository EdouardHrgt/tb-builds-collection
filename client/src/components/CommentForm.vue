<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  submit: { type: Function, required: true }, // async (body) => void ; throws an Error with a message on failure
  label: { type: String, default: 'Write a comment' },
  submitLabel: { type: String, default: 'Post comment' },
  initial: { type: String, default: '' },
  autofocus: { type: Boolean, default: false },
  cancellable: { type: Boolean, default: false },
})
const emit = defineEmits(['cancel'])

// Keep in sync with BODY_MAX in the server (routes/comments.js)
const MAX_LENGTH = 200

const text = ref(props.initial)
const busy = ref(false)
const error = ref('')
const field = ref(null)

const remaining = computed(() => MAX_LENGTH - text.value.length)

onMounted(() => {
  if (!props.autofocus) return
  field.value?.focus()
  const end = text.value.length
  field.value?.setSelectionRange(end, end) // cursor after a pre-filled "@name "
})

async function send() {
  const body = text.value.trim()
  if (!body || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await props.submit(body)
    text.value = ''
  } catch (e) {
    error.value = e.message // the text stays, nothing is lost
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="comment-form" novalidate @submit.prevent="send">
    <textarea
      ref="field"
      v-model="text"
      rows="3"
      :maxlength="MAX_LENGTH"
      :aria-label="label"
      :placeholder="label + '…'"
      @keydown.ctrl.enter.prevent="send"
      @keydown.meta.enter.prevent="send"
    ></textarea>
    <div class="form-row">
      <small class="meta">{{ remaining }} characters left</small>
      <span class="spacer"></span>
      <button v-if="cancellable" type="button" class="btn ghost" @click="emit('cancel')">Cancel</button>
      <button class="btn" :disabled="busy || !text.trim()">{{ busy ? 'Posting…' : submitLabel }}</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </form>
</template>

<style scoped>
.comment-form {
  display: grid;
  gap: 0.5rem;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.spacer {
  flex: 1;
}
.ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--line);
}
.error {
  margin: 0;
}
</style>
