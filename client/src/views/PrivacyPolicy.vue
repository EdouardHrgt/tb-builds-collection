<script setup>
const UPDATED = 'September 10, 2026'
const DISCORD = 'https://discord.gg/fm7x3bxs2c'
</script>

<template>
  <article class="legal">
    <h1>Privacy &amp; community rules</h1>
    <p class="meta">Last updated: {{ UPDATED }}</p>

    <p>
      Sigmar's Arsenal is a personal, non-commercial project made for the Vermintide 2 Modded Realm
      community. This page gives the rules everyone agrees to when creating an account, and says who
      can see your data and how it is protected.
    </p>

    <h2>Community rules</h2>
    <p>
      By creating an account you agree to the following, for your username, your build titles and
      descriptions, and your comments:
    </p>
    <ul>
      <li>
        No offensive, hateful, sexual or misleading usernames, and no impersonation of other people.
      </li>
      <li>No insults, harassment, discrimination or threats.</li>
      <li>No vulgar or obscene language.</li>
      <li>No political content, whatever the side: this is a game community.</li>
      <li>No spam or advertising, and no personal information about other people.</li>
      <li>Stay on topic: Vermintide 2 builds and the Tourney Balance mod.</li>
    </ul>
    <p>
      Content that breaks these rules can be removed, and accounts can be suspended or deleted,
      without notice. To report something, contact the administrator, <strong>@Bobely</strong>,
      through the
      <a :href="DISCORD" target="_blank" rel="noopener noreferrer">Sigmar's Arsenal Discord</a>.
    </p>

    <h2>Who can see what</h2>
    <ul>
      <li>
        <strong>Public:</strong> your username, avatar, join date, builds, comments, the number of
        likes on your builds, and your follower count (you can hide it in <em>My builds</em>).
      </li>
      <li>
        <strong>Private:</strong> your email address (never shown to other users), your bookmarks,
        the list of accounts you follow and the builds you liked. Only you see them.
      </li>
      <li>
        <strong>The site's administrator</strong> can read everything stored on the server,
        including emails, to run and moderate the site.
      </li>
    </ul>

    <h2>What is protected, and what is not</h2>
    <ul>
      <li>
        <strong>In transit:</strong> the whole site uses HTTPS, so what you send and receive is
        encrypted between your browser and the server.
      </li>
      <li>
        <strong>Your password</strong> is never stored. Only a one-way hash is: nobody, including
        the administrator, can read it. A lost password cannot be recovered, only replaced.
      </li>
      <li>
        <strong>Your session</strong> is a signed token in a cookie that scripts on the page cannot
        read, and that is only sent over HTTPS. Changing your password logs you out everywhere.
      </li>
      <li>
        <strong>Password reset links</strong> are random, valid for one hour, and only a hash of the
        link is stored.
      </li>
      <li>
        <strong>Not encrypted:</strong> your email address and your content are stored as readable
        text in the database on the server, like on most small sites. The server is protected by a
        firewall, an updated system and restricted access, but this data is not encrypted at rest.
      </li>
    </ul>

    <h2>How your email is used</h2>
    <p>
      Only to send you messages you triggered: a password reset link, and a warning to your previous
      address when your email is changed. No newsletters, no promotions.
    </p>

    <h2>Cookies and third parties</h2>
    <ul>
      <li>
        <strong>No analytics, no advertising, no tracking</strong>, and no data is sold or given to
        anyone for marketing.
      </li>
      <li>
        <strong>One cookie</strong>, to keep you logged in (7 days). It is strictly necessary, so
        there is no cookie banner.
      </li>
      <li>
        <strong>Hosting:</strong> the server is a virtual server rented from IONOS, located in the
        United Kingdom.
      </li>
    </ul>

    <h2>Keeping and deleting your data</h2>
    <p>
      You can change your email or password, or delete your account, in
      <em>My builds &gt; Account</em>. Deleting your account immediately removes your profile,
      builds, comments, likes, bookmarks and follows from the site. Copies made for safety (a
      nightly backup of the database, kept for 7 days on the server, plus occasional copies kept by
      the administrator) still contain it until they are overwritten, within days to a few weeks.
    </p>
    <p>
      Under the GDPR you also have the right to have your data corrected, or to object to its use.
      To do so, or for any question about your data, contact the administrator,
      <strong>@Bobely</strong>, through
      <a :href="DISCORD" target="_blank" rel="noopener noreferrer">Discord</a>.
    </p>
  </article>
</template>

<style scoped>
.legal {
  max-width: 46rem;
  line-height: 1.55;
}
.legal h1 {
  margin-bottom: 0.2rem;
}
.legal ul {
  padding-left: 1.2rem;
}
.legal li {
  margin-bottom: 0.45rem;
}
</style>
