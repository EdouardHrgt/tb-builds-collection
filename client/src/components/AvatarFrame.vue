<script setup>
import UserAvatar from './UserAvatar.vue'

// A round portrait inside a decorative frame (a ring drawn over it). The size is set by the parent with the
// CSS variable --frame-w (width of the whole frame, 90px by default); the portrait follows.
//   <AvatarFrame :id="user.avatar" style="--frame-w: 140px" />
// The frame image is described by its size and its hole: a circle of diameter `hole`, centred at (cx, cy), all in
// pixels of the image. The portrait is a little wider than the hole so its edge hides under the ring.
defineProps({
  id: { type: String, default: '' }, // avatar id sent by the API
})

const frame = { src: '/shared/frame.png', w: 119, h: 137, cx: 54.5, cy: 69.5, hole: 72 }
const vars = {
  '--fr-ratio': `${frame.w} / ${frame.h}`,
  '--fr-x': `${(frame.cx / frame.w) * 100}%`,
  '--fr-y': `${(frame.cy / frame.h) * 100}%`,
  '--fr-portrait': (frame.hole + 2) / frame.w,
}
</script>

<template>
  <span class="framed" :style="vars">
    <UserAvatar :id="id" />
    <img :src="frame.src" alt="" class="frame" :width="frame.w" :height="frame.h" />
  </span>
</template>

<style scoped>
.framed {
  --avatar-size: calc(var(--frame-w, 90px) * var(--fr-portrait));
  position: relative;
  flex: none;
  width: var(--frame-w, 90px);
  aspect-ratio: var(--fr-ratio);
}
.framed :deep(.avatar) {
  position: absolute;
  left: var(--fr-x);
  top: var(--fr-y);
  transform: translate(-50%, -50%);
}
.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
