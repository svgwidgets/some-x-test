<template>
  <g class="pid-pipe" @click="$emit('click')">
    <!-- Main pipe line -->
    <path
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      class="pipe-line"
    />
    
    <!-- Flow animation -->
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
    
    <!-- Flow arrow -->
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
  routingType?: 'straight' | 'orthogonal' | 'curved' | 'auto';
}

const props = withDefaults(defineProps<Props>(), {
  flowing: false,
  strokeWidth: 4,
  routingType: 'auto',
});

defineEmits<{
  click: [];
}>();

// Calculate path based on routing type
const pathData = computed(() => {
  const { fromPosition, toPosition } = props;
  const type = props.routingType === 'auto' 
    ? determineAutoRouting(fromPosition, toPosition)
    : props.routingType;
  
  switch (type) {
    case 'straight':
      return createStraightPath(fromPosition, toPosition);
    
    case 'orthogonal':
      return createOrthogonalPath(fromPosition, toPosition);
    
    case 'curved':
      return createCurvedPath(fromPosition, toPosition);
    
    default:
      return createStraightPath(fromPosition, toPosition);
  }
});

// Routing algorithms
function determineAutoRouting(from: Position, to: Position): 'straight' | 'orthogonal' | 'curved' {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  
  // If nearly horizontal or vertical, use orthogonal
  if (dy < 50) return 'straight';
  if (dx < 50) return 'straight';
  
  // For diagonal connections, use curved
  if (dx > 100 && dy > 100) return 'curved';
  
  // Default to orthogonal (industrial standard)
  return 'orthogonal';
}

function createStraightPath(from: Position, to: Position): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

function createOrthogonalPath(from: Position, to: Position): string {
  const midX = (from.x + to.x) / 2;
  
  // L-shaped routing
  return `
    M ${from.x} ${from.y}
    L ${midX} ${from.y}
    L ${midX} ${to.y}
    L ${to.x} ${to.y}
  `;
}

function createCurvedPath(from: Position, to: Position): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Control points for smooth curve
  const cp1x = from.x + dx * 0.5;
  const cp1y = from.y;
  const cp2x = from.x + dx * 0.5;
  const cp2y = to.y;
  
  return `
    M ${from.x} ${from.y}
    C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}
  `;
}

const strokeColor = computed(() => props.flowing ? '#2196F3' : '#666');

// Flow animation
const flowDots = ref<Array<{ x: number; y: number; opacity: number }>>([]);
let animationFrame: number | null = null;

function startFlowAnimation() {
  if (animationFrame) return;
  
  const animate = () => {
    const numDots = 5;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData.value);
    const pathLength = path.getTotalLength();
    
    flowDots.value = Array.from({ length: numDots }, (_, i) => {
      const offset = (Date.now() / 20 + i * (pathLength / numDots)) % pathLength;
      const point = path.getPointAtLength(offset);
      const progress = offset / pathLength;
      
      return {
        x: point.x,
        y: point.y,
        opacity: Math.sin(progress * Math.PI) * 0.8 + 0.2,
      };
    });
    
    animationFrame = requestAnimationFrame(animate);
  };
  
  animate();
}

function stopFlowAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  flowDots.value = [];
}

watch(() => props.flowing, (newVal) => {
  if (newVal) startFlowAnimation();
  else stopFlowAnimation();
}, { immediate: true });

onUnmounted(() => stopFlowAnimation());

// Arrow at midpoint
const arrowPath = computed(() => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData.value);
  const pathLength = path.getTotalLength();
  const midPoint = path.getPointAtLength(pathLength / 2);
  const nextPoint = path.getPointAtLength(pathLength / 2 + 10);
  
  const angle = Math.atan2(nextPoint.y - midPoint.y, nextPoint.x - midPoint.x);
  const arrowSize = 8;
  
  const x1 = midPoint.x + arrowSize * Math.cos(angle);
  const y1 = midPoint.y + arrowSize * Math.sin(angle);
  const x2 = midPoint.x + arrowSize * 0.5 * Math.cos(angle + 2.5);
  const y2 = midPoint.y + arrowSize * 0.5 * Math.sin(angle + 2.5);
  const x3 = midPoint.x + arrowSize * 0.5 * Math.cos(angle - 2.5);
  const y3 = midPoint.y + arrowSize * 0.5 * Math.sin(angle - 2.5);
  
  return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
});
</script>

<style scoped>
.pipe-line {
  transition: stroke 0.3s ease;
  cursor: pointer;
}

.pipe-line:hover {
  stroke-width: 6;
  filter: brightness(1.1);
}
</style>
