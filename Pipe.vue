<template>
  <g class="pid-pipe">
    <!-- Main pipe line -->
    <line
      :x1="fromPosition.x"
      :y1="fromPosition.y"
      :x2="toPosition.x"
      :y2="toPosition.y"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      class="pipe-line"
    />
    
    <!-- Flow animation (moving dots) -->
    <g v-if="flowing" class="flow-animation">
      <circle
        v-for="(dot, i) in flowDots"
        :key="i"
        :cx="dot.x"
        :cy="dot.y"
        r="2"
        fill="#2196F3"
        :opacity="dot.opacity"
      />
    </g>
    
    <!-- Arrow indicating flow direction -->
    <path
      v-if="flowing"
      :d="arrowPath"
      fill="#2196F3"
      class="flow-arrow"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import type { Position } from '@/core/types';

interface Props {
  fromPosition: Position;
  toPosition: Position;
  flowing?: boolean;
  strokeWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  flowing: false,
  strokeWidth: 4,
});

const strokeColor = computed(() => {
  return props.flowing ? '#2196F3' : '#666';
});

// Flow animation
const flowDots = ref<Array<{ x: number; y: number; opacity: number }>>([]);
let animationFrame: number | null = null;

function startFlowAnimation() {
  if (animationFrame) return; // Already running
  
  const numDots = 5;
  
  const animate = () => {
    const { fromPosition, toPosition } = props;
    const dx = toPosition.x - fromPosition.x;
    const dy = toPosition.y - fromPosition.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      animationFrame = requestAnimationFrame(animate);
      return;
    }
    
    flowDots.value = Array.from({ length: numDots }, (_, i) => {
      const offset = (Date.now() / 20 + i * (length / numDots)) % length;
      const progress = offset / length;
      
      return {
        x: fromPosition.x + dx * progress,
        y: fromPosition.y + dy * progress,
        opacity: Math.sin(progress * Math.PI) * 0.8 + 0.2,
      };
    });
    
    animationFrame = requestAnimationFrame(animate);
  };
  
  animate();
}

function stopFlowAnimation() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  flowDots.value = [];
}

watch(() => props.flowing, (newVal) => {
  if (newVal) {
    startFlowAnimation();
  } else {
    stopFlowAnimation();
  }
}, { immediate: true });

onUnmounted(() => {
  stopFlowAnimation();
});

// Arrow for flow direction
const arrowPath = computed(() => {
  const { fromPosition, toPosition } = props;
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;
  
  const dx = toPosition.x - fromPosition.x;
  const dy = toPosition.y - fromPosition.y;
  const angle = Math.atan2(dy, dx);
  
  const arrowSize = 8;
  const x1 = midX + arrowSize * Math.cos(angle);
  const y1 = midY + arrowSize * Math.sin(angle);
  const x2 = midX + arrowSize * 0.5 * Math.cos(angle + 2.5);
  const y2 = midY + arrowSize * 0.5 * Math.sin(angle + 2.5);
  const x3 = midX + arrowSize * 0.5 * Math.cos(angle - 2.5);
  const y3 = midY + arrowSize * 0.5 * Math.sin(angle - 2.5);
  
  return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
});
</script>

<style scoped>
.pipe-line {
  transition: stroke 0.3s ease;
}

.pipe-line:hover {
  stroke-width: 6;
  filter: brightness(1.1);
}

.flow-arrow {
  opacity: 0.8;
}
</style>
