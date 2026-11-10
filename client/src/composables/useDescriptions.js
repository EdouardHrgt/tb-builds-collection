import { ref } from 'vue'

// "Show descriptions" is ONE switch for the whole page: the talents, the perks and the passive / skill all
// follow it. It lives here (module level) so every component that reads it shares the same value.
export const showDescriptions = ref(false)
