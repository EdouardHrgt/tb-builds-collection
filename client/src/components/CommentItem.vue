<script setup>
import { computed } from 'vue'
import { timeAgo, fullDate, parseDbDate } from '../utils/time.js'

const props = defineProps({
  comment: { type: Object, required: true }, // { id, body, author, authorId, createdAt }
  isBuildAuthor: { type: Boolean, default: false }, // this comment was written by the author of the build
  canReply: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
})
defineEmits(['reply', 'delete'])

const ago = computed(() => timeAgo(props.comment.createdAt))
const iso = computed(() => parseDbDate(props.comment.createdAt).toISOString())
</script>

<template>
  <article class="comment">
    <header class="comment-head">
      <strong>{{ comment.author }}</strong>
      <span v-if="isBuildAuthor" class="badge">Author</span>
      <time :datetime="iso" :title="fullDate(comment.createdAt)">{{ ago }}</time>
    </header>

    <!-- {{ }} escapes the text: a comment can never inject HTML -->
    <p class="comment-body">{{ comment.body }}</p>

    <div v-if="canReply || canDelete" class="comment-actions">
      <button
        v-if="canReply"
        type="button"
        class="link-btn"
        :aria-label="`Reply to ${comment.author}`"
        @click="$emit('reply')"
      >
        Reply
      </button>
      <button
        v-if="canDelete"
        type="button"
        class="link-btn danger"
        :aria-label="`Delete the comment of ${comment.author}`"
        @click="$emit('delete')"
      >
        Delete
      </button>
    </div>
  </article>
</template>

<style scoped>
.comment-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 0.6rem;
}
.comment-head time {
  font-size: 0.85rem;
  color: var(--muted);
}
.badge {
  padding: 0.05rem 0.4rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1a1405;
  background: var(--accent);
  border-radius: 4px;
}
.comment-body {
  margin: 0.3rem 0;
  white-space: pre-wrap; /* keeps the line breaks typed by the author */
  overflow-wrap: anywhere;
  color: var(--muted);
}
.comment-actions {
  display: flex;
  gap: 1rem;
}
.link-btn {
  padding: 0;
  font: inherit;
  font-size: 0.9rem;
  color: var(--accent);
  background: none;
  border: 0;
  text-decoration: underline;
  cursor: pointer;
}
.link-btn.danger {
  color: var(--danger);
}
</style>
