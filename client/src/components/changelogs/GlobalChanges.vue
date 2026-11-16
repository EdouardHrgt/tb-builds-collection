<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modLabel: String,
})

// Données organisées par type de balance
const balanceData = {
  'class balance': {
    type: 'sections',
    content: [
      {
        label: 'Ultimate economy',
        details: [
          'The amount of ultimate cooldown reduction gained from damage taken has been reduced to an absolute minimum. This applies to all careers, no exceptions.',
          'The idea behind this change is to get away from intentionally trading hits for excessive amounts of cooldown reduction towards a more strategic usage of ultimates. When cooldowns can not be cut short effectively, they become more valuable as a result.',
          'In the same vein, adjustments have been made to cooldown regeneration gained from damaging enemies with AoE-based attacks. Bugs were fixed that caused clients to generate huge amounts of cooldown reduction with those attacks.',
          'Ultimate cooldown reduction gained from damaging enemies regularly is unchanged.',
        ],
      },
      {
        label: 'Temp HP talents',
        details: [
          'Every career now has access to three different talents in the first row to generate temp HP. It should now be a lot more convenient to find the talent that best matches your choice of weapon or playstyle with any career.',
          'Inevitably, the healshare talents have all been removed to give way to a third option.',
          'Temp HP on Stagger was nerfed.',
          'Temp HP on Headshot/Crit was adjusted to reward headshots more than crits.',
        ],
      },
      {
        label: 'Stagger talents',
        details: [
          'Every career should now have decent options regarding the stagger talents in the third row. Some careers saw talents being replaced with more fitting ones.',
          'Mainstay has been reworked entirely to make it a solid choice for cleaving weapons: Every additional enemy hit with one swing counts as staggered (starting from 2), with increasing damage the more enemies are being hit. Deals 20% more damage against the 2nd enemy hit, 40% more damage against the 3rd enemy hit, 60% more damage against the 4th enemy hit, and 80% more damage against every additional enemy.',
        ],
      },
      {
        label: 'Togglable actions',
        details: [
          'Class Balance introduces special actions to some careers and talents that can be toggled using a keybind. You can bind a key in the Class Balance tab in the VMF Mod Options (F4). A buff icon in your buff bar then tells you when your toggle is activated.',
          "For example, the Handmaiden dash can be toggled to never move your character forward so that you don't have to cancel the dash manually. Similarly, Warrior Priest's ultimate has two different versions from which you can choose by toggling one or the other.",
        ],
      },
    ],
  },

  'tourney balance': {
    type: 'categories',
    content: {
      'Generic Changes': [
        'Removed CDR from explosion attacks (e.g. Flaming Flail Heavy 1).',
        'Stam Tech has 120s internal cooldown.',
        'Fire bomb Super Armor Damage decreased by 50% (from 0.5 to 0.25) to be the same as the Armor Damage.',
        'All shields have had their Push strength on the inner hitbox lowered to be the same as the outer hitbox (Lower armor, super armor, and berserker modifier).',
        'All shields now gain ~67% less THP on a heavy bash.',
        'Added max stamina of 6 to Blunderbuss, Grudge Raker, Griffon-Foot and Bash requires and consumes 2 stamina.',
      ],
      'THP Talent Changes': [
        'THP from Bloodlust (Kill) gives more from the smaller rats whilst Monsters and Chaos Warriors give notably less.',
        'THP from Regrowth (Headshot/Crit) increased on headshot (from 1 to 3.5), crit (from 1 to 1.5), and headshot crit (from 2 to 4.5).',
        'Mainstay: Melee hits apply 1 count for 2s, only accounted by mainstay and only on elites. Deal 40% more melee damage to staggered enemies, increased to 60% against enemies with more than 1 stagger effect.',
        'Bulwark: Increases stagger power by 10%, Increases damage from all sources by 10% for 10s after staggering with any attack, Staggering an enemy also applies a stagger count lasting 10 seconds (Max 1 stacks).',
      ],
      'Traits and Properties': [
        'Boon of Shallya: 30% -> 40%.',
        'Natural Bond: Effectively Natural Bond pauses THP decay every regen tick (5s), No longer overwrites THP.',
        'Revive Speed also affects: Player rescue from respawn / ledge / Hook., ',
        'Healshare Talent removed (all careers have 3 THP talents) and replaces Hand of Shallya as a trait.',
      ],
    },
  },

  'linesman balance': {
    type: 'simple',
    content: [
      'Medkits can now be passed to each other using the weapon special key',
      'Players will now automatically switch to melee when being revived',
      'Speed potions now let players pass through enemies',
    ],
  },

  'core balance': {
    type: 'empty',
    content: [],
  },

  'live remastered': {
    type: 'simple',
    content: ['Removed CDR from explosion attacks.'],
  },
}

const isModalOpen = ref(false)
const currentData = computed(() => balanceData[props.modLabel] || null)

const openModal = () => {
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = ''
}
</script>

<template>
  <section>
    <button class="trigger-btn" @click="openModal">
      See The Global Changes for <span>{{ modLabel }}</span>
    </button>

    <Teleport to=".vt2cl" defer>
      <Transition name="modal">
        <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeModal">
              <span>&times;</span>
            </button>

            <div v-if="currentData" class="modal-body">
              <div class="modal-header">
                <h2 class="modal-title">Global Changes</h2>
                <strong>{{ modLabel }}</strong>
              </div>

              <template v-if="currentData.type === 'sections'">
                <div v-for="(section, index) in currentData.content" :key="index" class="section">
                  <h3 class="section-title">{{ section.label }}</h3>
                  <ul class="modal-list">
                    <li v-for="(detail, idx) in section.details" :key="idx">
                      {{ detail }}
                    </li>
                  </ul>
                </div>
              </template>

              <template v-else-if="currentData.type === 'categories'">
                <div
                  v-for="(items, category) in currentData.content"
                  :key="category"
                  class="section">
                  <h3 class="section-title">{{ category }}</h3>
                  <ul class="modal-list">
                    <li v-for="(item, idx) in items" :key="idx">
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </template>

              <template v-else-if="currentData.type === 'simple'">
                <ul class="modal-list modal-list-simple">
                  <li v-for="(item, idx) in currentData.content" :key="idx">
                    {{ item }}
                  </li>
                </ul>
              </template>

              <template v-else-if="currentData.type === 'empty'">
                <ul class="modal-list modal-list-simple">
                  <h2 class="empty">No data provided...</h2>
                </ul>
              </template>
            </div>

            <div v-else class="modal-body">
              <p class="no-data">No data available for {{ modLabel }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
/* Bouton déclencheur */
.trigger-btn {
  padding: 0.55rem 1.5rem;
  background-color: var(--grey-400);
  color: var(--black-900);
  border: none;
  border-radius: 6px;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-4);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-inline: auto;
  display: block;
}

.trigger-btn span {
  font-weight: 700;
}

@media (hover: hover) {
  .trigger-btn:hover {
    background-color: var(--black-100);
    color: var(--white-900);
  }
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

/* Modal Content */
.modal-content {
  position: relative;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

/* Bouton fermer */
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.modal-close span {
  color: var(--white-100);
  font-size: 32px;
  line-height: 1;
}

@media (hover: hover) {
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

/* Modal Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Modal Header */
.modal-header {
  border-bottom: 2px solid var(--yellow-400);
  padding-bottom: 1rem;
  display: flex;
  align-items: baseline;
  gap: 1rem;
  justify-content: space-between;
}

.modal-title {
  font-family: 'Quintessential', serif;
  font-size: var(--fs-1);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--white-900);
  margin: 0;
}

.modal-header strong,
.empty {
  font-size: var(--fs-body);
  text-transform: uppercase;
  font-family: 'Rubik Marker Hatch', system-ui;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 1px;
  background: linear-gradient(to right, #fdd90c, #ff5e00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Sections */
.section {
  margin-bottom: 1.5rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--yellow-400);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(253, 217, 12, 0.3);
}

/* Modal List */
.modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.modal-list li {
  position: relative;
  padding-left: 2rem;
  margin-bottom: 1.5rem;
  line-height: 1.8;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-body);
  overflow-wrap: break-word;
}

.modal-list li::before {
  content: '▸';
  position: absolute;
  left: 0;
  font-size: 20px;
}

.modal-list li:nth-child(odd) {
  color: var(--grey-400);
}

.modal-list li:nth-child(odd)::before {
  color: var(--grey-400);
}

.modal-list li:nth-child(even) {
  color: var(--yellow-400);
}

.modal-list li:nth-child(even)::before {
  color: var(--yellow-400);
}

/* Liste simple sans section */
.modal-list-simple {
  margin-top: 1rem;
}

/* No data */
.no-data {
  text-align: center;
  color: var(--grey-400);
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-3);
  padding: 2rem;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

@media (hover: hover) {
  .modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-header {
    display: block;
  }

  .modal-header strong {
    display: block;
    margin-top: 0.5rem;
  }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }

  .modal-close {
    top: 0.5rem;
    right: 0.5rem;
    width: 25px;
    height: 25px;
  }

  .modal-close span {
    font-size: 20px;
  }
}

@media (max-width: 450px) {
  .modal-content {
    padding: 2rem 0.5rem;
  }

  .modal-title,
  .modal-header strong {
    font-size: 15px;
  }

  .section-title {
    font-size: 16px;
  }

  .modal-list li {
    padding-left: 1.3rem;
    font-size: 14px;
  }
}
</style>
