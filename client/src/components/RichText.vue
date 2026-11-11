<script>
import { defineComponent, h } from 'vue'
import { parseRich } from '../utils/richText.js'

// Shows a build description with the light formatting of utils/richText.js. Built with h() (no v-html).
//   <RichText :text="build.description" />
const inline = (parts) =>
  parts.map((p, i) =>
    p.bold ? h('strong', { key: i }, p.text) : p.underline ? h('u', { key: i }, p.text) : p.text,
  )

export default defineComponent({
  name: 'RichText',
  props: { text: { type: String, default: '' } },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'rich' },
        parseRich(props.text).map((b, i) => {
          if (b.type === 'h') return h('h3', { key: i }, inline(b.parts))
          if (b.type === 'ul') return h('ul', { key: i }, b.items.map((it, j) => h('li', { key: j }, inline(it))))
          return h(
            'p',
            { key: i },
            b.lines.flatMap((l, j) => (j ? [h('br'), ...inline(l)] : inline(l))),
          )
        }),
      )
  },
})
</script>

<style>
.rich {
  box-sizing: border-box;
  max-width: 70ch;
  padding: 0.8rem 1rem;
  overflow-wrap: anywhere;
  background: var(--panel); /* same background and border as the other frames of the page */
  border: 1px solid var(--line);
  border-radius: 6px;
}
.rich > :first-child {
  margin-top: 0;
}
.rich > :last-child {
  margin-bottom: 0;
}
.rich p,
.rich ul {
  margin: 0.6rem 0;
}
.rich ul {
  padding-left: 1.3rem;
}
.rich h3 {
  margin: 1rem 0 0.4rem;
  font-family: inherit; /* same font as the text of the description, not the title font of the site */
  font-weight: 600;
  letter-spacing: normal;
  font-size: 1.25rem; /* bigger than the text, in the career color */
  color: var(--career-color, var(--accent)); /* the color of the build's career */
}
</style>
