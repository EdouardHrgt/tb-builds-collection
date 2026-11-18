<script setup>
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

</script>

<template>
  <section class="page">
    <h2 class="page-title">Difficulty Mods</h2>
    <div v-for="(difficulty, key) in difficulties" :key="key" class="section">
      <h3 class="section-title">{{ difficulty.name }}</h3>
      <ul class="modal-list">
        <li v-for="(detail, idx) in difficulty.details" :key="idx">
          {{ detail }}
        </li>
      </ul>
      <a v-if="difficulty.link" :href="difficulty.link" class="documentation-link" target="_blank" rel="noopener noreferrer"
        >See The Official Documentation For {{ difficulty.name }} Here</a
      >
    </div>
  </section>
</template>

<style scoped>
/* The page is a dark blue card, like the former window */
.page {
  box-sizing: border-box;
  max-width: 900px;
  margin: 1.5rem auto 2rem;
  padding: 3rem;
  background: linear-gradient(135deg, rgb(34 37 46 / 0.97) 0%, rgb(24 26 32 / 0.97) 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.page-title {
  margin: 0 0 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--yellow-400);
  font-family: 'Quintessential', serif;
  font-size: var(--fs-1);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--white-900);
}

.intro {
  margin: 0 0 2rem;
  color: var(--grey-400);
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-body);
  line-height: 1.6;
}

.documentation-link {
  color: rgb(138, 203, 255);
  line-height: 1.8;
  font-family: 'Lexend Deca', sans-serif;
  font-size: var(--fs-body);
  overflow-wrap: break-word;
}

.section {
  margin-bottom: 2.5rem;
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
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgb(201 162 74 / 0.3);
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

@media (max-width: 768px) {
  .page {
    margin-inline: 1rem;
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 450px) {
  .page {
    padding: 2rem 0.8rem;
  }

  .page-title {
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
