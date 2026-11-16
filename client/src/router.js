import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './stores/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/BuildsList.vue') },
    {
      path: '/builds/new',
      component: () => import('./views/BuildEditor.vue'),
      meta: { auth: true },
    },
    { path: '/builds/:id(\\d+)', component: () => import('./views/BuildDetail.vue') },
    {
      path: '/builds/:id(\\d+)/edit',
      component: () => import('./views/BuildEditor.vue'),
      meta: { auth: true },
    },
    { path: '/u/:username', component: () => import('./views/UserProfile.vue') },
    { path: '/me', component: () => import('./views/MyBuilds.vue'), meta: { auth: true } },
    { path: '/login', component: () => import('./views/AuthForm.vue'), props: { mode: 'login' } },
    {
      path: '/register',
      component: () => import('./views/AuthForm.vue'),
      props: { mode: 'register' },
    },
    {
      // The former VT2 changelogs app: own look (wide page, own background), see views/changelogs/
      path: '/changelogs',
      component: () => import('./views/changelogs/ChangelogsLayout.vue'),
      meta: { wide: true },
      children: [
        { path: '', component: () => import('./views/changelogs/ChangelogsHome.vue') },
        { path: ':career', component: () => import('./views/changelogs/ChangelogsCareer.vue') },
      ],
    },
    { path: '/privacy', component: () => import('./views/PrivacyPolicy.vue') },
    { path: '/forgot-password', component: () => import('./views/ForgotPassword.vue') },
    { path: '/reset-password', component: () => import('./views/ResetPassword.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.init() // checks the session once
  if (to.meta.auth && !auth.user) return { path: '/login', query: { redirect: to.fullPath } }
})

export default router
