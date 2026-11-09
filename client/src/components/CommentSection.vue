<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../stores/auth.js'
import CommentForm from './CommentForm.vue'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  buildId: { type: Number, required: true },
  buildAuthorId: { type: Number, required: true },
})

const auth = useAuth()
const route = useRoute()

const root = ref(null)
const data = ref(null) // last answer of GET /builds/:id/comments
const loading = ref(true)
const error = ref('')
const expanded = reactive({}) // thread id -> its replies are shown
const replyTo = ref(null) // { threadId, commentId, author, isReply } while a reply form is open

const loginLink = computed(() => ({ path: '/login', query: { redirect: route.fullPath } }))

async function load(page = data.value?.page ?? 1) {
  error.value = ''
  try {
    data.value = await api(`/builds/${props.buildId}/comments?page=${page}`)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
onMounted(() => load(1))

// Pager buttons: also bring the top of the comments back into view
async function goTo(page) {
  await load(page)
  root.value?.scrollIntoView?.({ block: 'start' })
}

const canDelete = (comment) =>
  !!auth.user && (auth.user.id === comment.authorId || auth.user.id === props.buildAuthorId)

async function postComment(body) {
  await api(`/builds/${props.buildId}/comments`, { method: 'POST', body: { body } })
  await load(1) // newest first: the new comment is on page 1
}

function startReply(thread, comment) {
  replyTo.value = {
    threadId: thread.id,
    commentId: comment.id,
    author: comment.author,
    isReply: comment.id !== thread.id,
  }
  expanded[thread.id] = true
}

async function postReply(body) {
  const { threadId, commentId } = replyTo.value
  await api(`/builds/${props.buildId}/comments`, { method: 'POST', body: { body, parentId: commentId } })
  replyTo.value = null
  expanded[threadId] = true
  await load()
}

async function remove(comment) {
  const replies = comment.replies?.length ?? 0
  const message = replies
    ? `Delete this comment and its ${replies} ${replies === 1 ? 'reply' : 'replies'}?`
    : 'Delete this comment?'
  if (!confirm(message)) return
  try {
    await api(`/comments/${comment.id}`, { method: 'DELETE' })
    if (replyTo.value && [replyTo.value.commentId, replyTo.value.threadId].includes(comment.id)) {
      replyTo.value = null
    }
    await load() // stays on the current page (the server brings us back if it no longer exists)
  } catch (e) {
    error.value = e.message
  }
}

const repliesLabel = (n) => `${n} ${n === 1 ? 'reply' : 'replies'}`
</script>

<template>
  <section ref="root" class="comments" aria-labelledby="comments-title">
    <h2 id="comments-title">
      Comments <span v-if="data" class="count">({{ data.commentCount }})</span>
    </h2>

    <CommentForm v-if="auth.user" :submit="postComment" />
    <p v-else class="meta">
      <RouterLink :to="loginLink">Log in</RouterLink> to write a comment.
    </p>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="loading">Loading comments…</p>

    <template v-else-if="data">
      <p v-if="!data.items.length" class="meta">No comments yet.</p>

      <ul v-else class="threads">
        <li v-for="thread in data.items" :key="thread.id" class="thread">
          <CommentItem
            :comment="thread"
            :is-build-author="thread.authorId === buildAuthorId"
            :can-reply="!!auth.user"
            :can-delete="canDelete(thread)"
            @reply="startReply(thread, thread)"
            @delete="remove(thread)"
          />

          <div v-if="thread.replies.length || replyTo?.threadId === thread.id" class="replies">
            <button
              v-if="thread.replies.length"
              type="button"
              class="link-btn"
              :aria-expanded="!!expanded[thread.id]"
              @click="expanded[thread.id] = !expanded[thread.id]"
            >
              {{ expanded[thread.id] ? 'Hide' : 'Show' }} {{ repliesLabel(thread.replies.length) }}
            </button>

            <ul v-if="expanded[thread.id] && thread.replies.length" class="reply-list">
              <li v-for="reply in thread.replies" :key="reply.id">
                <CommentItem
                  :comment="reply"
                  :is-build-author="reply.authorId === buildAuthorId"
                  :can-reply="!!auth.user"
                  :can-delete="canDelete(reply)"
                  @reply="startReply(thread, reply)"
                  @delete="remove(reply)"
                />
              </li>
            </ul>

            <CommentForm
              v-if="replyTo?.threadId === thread.id"
              :key="replyTo.commentId"
              :submit="postReply"
              :label="`Reply to ${replyTo.author}`"
              submit-label="Post reply"
              :initial="replyTo.isReply ? `@${replyTo.author} ` : ''"
              autofocus
              cancellable
              @cancel="replyTo = null"
            />
          </div>
        </li>
      </ul>

      <nav v-if="data.pages > 1" class="pager" aria-label="Comment pages">
        <button type="button" class="btn ghost" :disabled="data.page <= 1" @click="goTo(data.page - 1)">
          Previous
        </button>
        <span>Page {{ data.page }} of {{ data.pages }}</span>
        <button type="button" class="btn ghost" :disabled="data.page >= data.pages" @click="goTo(data.page + 1)">
          Next
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.comments {
  margin-top: 2.5rem;
}
.comments .count {
  font-size: 1rem;
  color: var(--muted);
}
.threads,
.reply-list {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}
.thread {
  padding: 1rem 0;
  border-top: 1px solid var(--line);
}
.replies {
  display: grid;
  gap: 0.7rem;
  margin: 0.7rem 0 0 0.8rem;
  padding-left: 1rem;
  border-left: 2px solid var(--line);
}
.reply-list {
  display: grid;
  gap: 0.9rem;
  margin: 0;
}
.link-btn {
  justify-self: start;
  padding: 0;
  font: inherit;
  font-size: 0.9rem;
  color: var(--accent);
  background: none;
  border: 0;
  text-decoration: underline;
  cursor: pointer;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
.ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--line);
}
.ghost:disabled {
  opacity: 0.4;
}
</style>
