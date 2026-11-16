<script setup>
import { ref } from 'vue'
const difficulties = {
  c3: {
    name: 'CATACLYSM 3',
    details: [
      'Increases mass and health of regular enemies, specials and elites (between 37% and 67% more HP), including lords and monsters (60% more HP)',
      'Increases the maximum amount of specials to 6 (max of same: 3)',
      'Increases the damage of certain specials: Leech damage while grabbed, Assassin stabs while downed, Flamer warpfire, ground fire, and explosion',
      'Increases damage of Chaos Spawn attacks: Bites and slams while grabbed',
    ],
  },
  dw: {
    name: 'DEATHWISH',
    details: [
      'Increases enemy stagger resistances: Values individually determined to make staggering enemies with weapons, bombs, and ultimates more difficult',
      'Reduces the stagger bonus coefficient of Cata 3 (0.5) down to that of Cata 1 (0.2). This reduces melee damage output but mostly affects the breakpoints of ranged weapons that all have a built-in Smiter coefficient',
      'Scales Burblepse’s and Rasknitt’s magic attack damage, and Globadier’s gas cloud and suicide explosion damage (up to Cata 3)',
    ],
  },
  ons: {
    name: 'ONSLAUGHT',
    details: [
      'Specials: max of 5 (Cata 1) or 6 (Cata 3); spawn in 30–70s intervals',
      'Hordes: slightly more elites; approx. 60s intervals',
      'Enemies: slightly increased ambient enemy density',
    ],
  },
  plus: {
    name: 'ONSLAUGHT PLUS',
    details: [
      'Specials: max of 6 (max of same: 3); spawn in 30–70s intervals',
      'Hordes: moderately more elites, including CWs; approx. 50s intervals',
      'Enemies: chance to spawn two monsters (with 50% health each) in map triggers; massively increased patrol size; more varied in compositions; moderately increased ambient enemy density',
      'Events: adds (multiple) monsters to several map events',
    ],
  },
  square: {
    name: 'ONSLAUGHT SQUARE',
    details: [
      'The map pacing, hordes, specials, basically every enemy outcome outside of events is the same as on OnslaughtPlus.',
      'Combination of the Chaos Wastes System and the old one, specifically the ability to have multiple possible terror event variations for the same event which guarantees infinite expandability and more replayability.',
      'Terror events are still scripted and adjusted to every event individually. Sometimes just parts of events are randomized, sometimes the whole event',
      'A system that can dynamically adjust boss stagger to prevent ledging on specific maps/single events (Grain barn event, Fort, Bell end event so far) - Bosses are still stunned for the same duration, they will just not move anymore',
      'New Elite Enemy: Skaven Champion',
      'No more double bosses on triggers, therfore every trigger boss now has two grudge marks. All grudge marks are adjusted, some are completely reworked to make them all fair and compatible with each other',
      'Some events have special bosses - basically they have their own terror event while they are alive which is often based on current hp and or time (basically very advanced grudge marks)',
    ],
  },
  dutch: {
    name: 'DUTCH SPICE',
    details: [
      'Specials: max of 8 (max of same: 4), 25-50s intervals; buffs to Flamers (hits debuff attack speed, almost unstaggerable), Globadiers (throw twice as fast), Gunners (double fire rate, almost unstaggerable), and Leeches (almost unstaggerable, faster suck damage, lower teleport cooldown)',
      'Hordes: 30-45s intervals; considerably more elites, including CWs',
      'Enemies: adds super-armored Stormvermin variants, armored Savage-Marauders, and high-health enemy variants for Chaos/Beastmen factions; considerably increased ambient enemy density',
      'Beastmen: roster expanded with specific non-Beastmen units; banners no longer grant more max health and health regen, more damage instead',
      'Triggers: slightly changed patrol compositions; adds shield patrols',
      'Events: adds specific grudge-marked monsters and aura-enhanced enemies to map events (auras only active with TB or CBR enabled)',
      'Nurgle Aura: Reduces players Movement Speed by 50%. Increases enemy Mass by 100%',
      'Khorne Aura: Increases players Melee Damage by 15%. Reduces players Ranged Damage by 50%. Increases enemy damage by 50%',
      'Slaanesh Aura: Reduces players BCR by 100%. Increases enemy Stagger Resistance by 100%',
      'Tzeentch Aura: Reduces players Crit Chance by 15%. The enemy carries the Tzeentch aura takes NO Ranged Damage',
    ],
  },
  man: {
    name: 'LINESMAN',
    details: [
      'Complete rehaul of the Horde, Intensity, Specials and Trigger system',
      'Scaled down version equivalent to Plus-Dutch',
      'Mixed faction hordes',
      'Mixed elite hordes (Berserkers + SV/Mauler)',
      'Dynamic Difficulty Scaling',
      'Bob the Builder',
    ],
    link: 'https://docs.google.com/document/d/1STNYQOmjq81idkTAn0I7iH8iuuy6qMBOQy4mguTrxkI/edit?tab=t.0#heading=h.y48pxms0rma',
  },
  dense: {
    name: 'DENSE',
    details: [
      'Dense Onslaught includes 4 difficulties Dense 0, 1, 2, and 3.',
      'Wave compositions have been largely reworked to include a higher ratio of elites to trash enemies.',
      'Dense has 7 special slots, with minimum and maximum timers of 24 and 60 seconds',
      'New patrols unseen in any other mods. All patrols are the same length which should prevent them being unavoidable on some maps or getting stuck.',
      'Beastmen have been thoroughly reworked. Archers now do not spawn anywhere but in pre scripted places such as events.',
      'Reworked ambient spawning compared to other Onslaught mods. The objective being the same as for the wave composition, which is the have more elites and fewer trash enemies',
    ],
  },
}

const isModalOpen = ref(false)

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
  <section class="main">
    <button @click="openModal">
      See Difficulties Details <br />(<span class="de">C3, DW, ONS...</span>)
    </button>

    <Teleport to=".vt2cl" defer>
      <Transition name="modal">
        <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeModal">
              <span>&times;</span>
            </button>

            <div class="modal-body">
              <div class="modal-header">
                <h2 class="modal-title">Difficulties</h2>
              </div>

              <template v-if="difficulties">
                <div v-for="(difficulty, key) in difficulties" :key="key" class="section">
                  <h3 class="section-title">{{ difficulty.name }}</h3>
                  <ul class="modal-list">
                    <li v-for="(detail, idx) in difficulty.details" :key="idx">
                      {{ detail }}
                    </li>
                  </ul>
                  <a
                    v-if="difficulty.link"
                    :href="difficulty.link"
                    class="documentation-link"
                    target="blank"
                    >See The Official Documentation For {{ difficulty.name }} Here</a
                  >
                </div>
              </template>

              <template v-else>
                <p class="no-data">No data available.</p>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
button {
  padding: 0.55rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--white-900);
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

button .de {
  font-weight: 700;
  color: var(--yellow-400);
}

@media (hover: hover) {
  button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  .documentation-link:hover {
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

/* Close button */
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
  padding: 0;
  margin: 0;
  letter-spacing: 0;
  text-transform: none;
  color: var(--white-100);
  font-size: 32px;
}

.modal-close span {
  line-height: 1;
  font-weight: 400;
  position: relative;
  top: -2px;
}

.documentation-link {
  color: rgb(138, 203, 255);
  line-height: 1.8;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-body);
  overflow-wrap: break-word;
  transition: all 0.3s ease;
}

@media (hover: hover) {
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--white-100);
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
}

.modal-title {
  font-family: 'Quintessential', serif;
  font-size: var(--fs-1);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--white-900);
  margin: 0;
}

/* Sections */
.section {
  margin-bottom: 1.5rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-family: 'Rubik Marker Hatch', system-ui;
  font-size: var(--fs-3);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 400;
  background: linear-gradient(to top, #fdd90c, #ff5e00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
    font-size: 20px;
  }
}

@media (max-width: 450px) {
  .modal-content {
    padding: 2rem 0.5rem;
  }

  .modal-title {
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
