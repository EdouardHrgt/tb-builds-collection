import { db } from './db.js'
import { getHeroCareer } from './gameData.js'

// Link previews (Discord, Slack...): the crawlers do not run the Vue app, they only read the HTML.
// So for the page of a build the server rewrites the title and the Open Graph tags of index.html.
// Production only (in dev Vite serves index.html).

const SITE = "Sigmar's Arsenal"
const DESC_MAX = 200
const OG_BLOCK = /<!-- og:start -->[\s\S]*?<!-- og:end -->/
const TITLE_TAG = /<title>[\s\S]*?<\/title>/
const DESCRIPTION_TAG = /<meta\s+name="description"\s+content="[^"]*"\s*\/>/

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c])

// `indexHtml`: the page, __APP_URL__ already replaced. Unknown build -> the page unchanged.
export function buildPageHtml(indexHtml, appUrl, buildId) {
  const row = db
    .prepare(
      `SELECT b.id, b.title, b.description, b.hero_id, b.career_id, u.username,
              (SELECT COUNT(*) FROM likes l WHERE l.build_id = b.id) AS like_count
       FROM builds b JOIN users u ON u.id = b.user_id WHERE b.id = ?`,
    )
    .get(buildId)
  if (!row) return indexHtml
  const names = getHeroCareer(row.hero_id, row.career_id)

  // "Markus Kruber | Mercenary build by alice · 3 likes", then the start of the description
  const lines = [
    `${names ? `${names.heroName} | ${names.careerName} build` : 'Build'} by ${row.username}` +
      (row.like_count ? ` · ${row.like_count} like${row.like_count === 1 ? '' : 's'}` : ''),
  ]
  const text = row.description.replace(/\s+/g, ' ').trim()
  if (text) lines.push(text.length > DESC_MAX ? text.slice(0, DESC_MAX - 1) + '…' : text)
  const description = lines.join('\n')

  // The career portrait (small: the card is the compact one); without a portrait, the site picture
  const image = names?.icon ? `${appUrl}${names.icon}` : `${appUrl}/shared/og-image.jpg`
  const card = names?.icon ? 'summary' : 'summary_large_image'

  const tags = `<!-- og:start -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${esc(SITE)}" />
    <meta property="og:title" content="${esc(row.title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(`${appUrl}/builds/${row.id}`)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta name="twitter:card" content="${card}" />
    <!-- og:end -->`

  // Function replacers: the texts come from users and may contain "$&"-like patterns
  return indexHtml
    .replace(OG_BLOCK, () => tags)
    .replace(TITLE_TAG, () => `<title>${esc(row.title)} — ${esc(SITE)}</title>`)
    .replace(DESCRIPTION_TAG, () => `<meta name="description" content="${esc(description)}" />`)
}
