<script setup>
import { ref, useId } from 'vue'

defineProps({
  label: { type: String, required: true },
  autocomplete: { type: String, default: 'off' },
  hint: { type: String, default: '' },
})
const model = defineModel({ type: String, default: '' })

const id = useId()
const visible = ref(false)
</script>

<template>
  <div class="pw-field">
    <label :for="id">{{ label }}</label>
    <div class="pw-wrap">
      <input
        :id="id"
        v-model="model"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        maxlength="72" />
      <button
        type="button"
        class="pw-toggle"
        :aria-pressed="visible"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible">
        {{ visible ? 'Hide' : 'Show' }}
      </button>
    </div>
    <small v-if="hint" class="meta">{{ hint }}</small>
  </div>
</template>
