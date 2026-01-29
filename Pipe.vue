<template>
  <g class="pipe" :class="{ 'selected': isSelected }">
    <!-- Selection outline (behind main pipe) -->
    <path
      v-if="isSelected"
      :d="pipePath"
      stroke="#2196F3"
      stroke-width="8"
      fill="none"
      opacity="0.3"
      class="selection-outline"
    />
    
    <!-- Main pipe path -->
    <path
      :d="pipePath"
      :stroke="pipeColor"
      :stroke-width="pipeWidth"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="pipe-path"
    />
    
    <!-- Flow animation dots -->
    <g v-if="flowing" class="flow-animation">
      <circle
        v-for="dot in flowDots"
        :key="dot.id"
        :cx="dot.x"
        :cy="dot.y"
        r="3"
        :fill="flowDotColor"
        class="flow-dot"
      >
        <animateMotion
          :path="pipePath"
          :dur="animationDuration"
          repeatCount="indefinite"
          :begin="dot.offset"
        />
      </circle>
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Position } from '@/core/types';

interface Props {
  fromPosition: Position;
  toPosition: Position;
  flowing?: boolean;
  routingType?: 'straight' | 'orthogonal' | 'curved' | 'auto';
  isSelected?: boolean;
  pipeSize?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  flowing: false,
  routingType: 'auto',
  isSelected: false,
  pipeSize: 'medium',
});

// Pipe width based on size
const pipeWidth = computed(() => {
  const sizes = {
    small: 2,
    medium: 3,
    large: 4,
  };
  return props.isSelected ? sizes[props.pipeSize] + 1 : sizes[props.pipeSize];
});

// Pipe color (blue for normal, darker when selected)
const pipeColor = computed(() => {
  return props.isSelected ? '#1976D2' : '#424242';
});

// Flow dot color
const flowDotColor = computed(() => {
  return props.flowing ? '#2196F3' : '#9E9E9E';
});

// Animation duration (faster when flowing)
const animationDuration = computed(() => {
  return props.flowing ? '2s' : '4s';
});

// Calculate pipe path
const pipePath = computed(() => {
  const from = props.fromPosition;
  const to = props.toPosition;
  
  switch (props.routingType) {
    case 'straight':
      return calculateStraightPath(from, to);
    
    case 'orthogonal':
      return calculateOrthogonalPath(from, to);
    
    case 'curved':
      return calculateCurvedPath(from, to);
    
    case 'auto':
    default:
      return calculateAutoPath(from, to);
  }
});

// Straight line path
function calculateStraightPath(from: Position, to: Position): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

// Orthogonal (L-shaped) path
function calculateOrthogonalPath(from: Position, to: Position): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Determine if horizontal-first or vertical-first based on distance
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal first
    const midX = from.x + dx / 2;
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  } else {
    // Vertical first
    const midY = from.y + dy / 2;
    return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
  }
}

// Curved (bezier) path
function calculateCurvedPath(from: Position, to: Position): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Control points for smooth curve
  const cp1x = from.x + dx * 0.5;
  const cp1y = from.y;
  const cp2x = from.x + dx * 0.5;
  const cp2y = to.y;
  
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

// Auto (smart routing)
function calculateAutoPath(from: Position, to: Position): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If close and roughly aligned, use straight
  if (distance < 100 && (Math.abs(dx) < 20 || Math.abs(dy) < 20)) {
    return calculateStraightPath(from, to);
  }
  
  // If horizontal or vertical alignment, use orthogonal
  if (Math.abs(dx) < 20 || Math.abs(dy) < 20) {
    return calculateOrthogonalPath(from, to);
  }
  
  // Otherwise use curved for smooth appearance
  return calculateCurvedPath(from, to);
}

// Flow animation dots
const flowDots = ref([
  { id: 1, x: 0, y: 0, offset: '0s' },
  { id: 2, x: 0, y: 0, offset: '0.5s' },
  { id: 3, x: 0, y: 0, offset: '1s' },
  { id: 4, x: 0, y: 0, offset: '1.5s' },
]);

// Update dot positions when path changes
watch([() => props.fromPosition, () => props.toPosition], () => {
  // Dots will be positioned by animateMotion, initial position doesn't matter much
  flowDots.value.forEach((dot, index) => {
    dot.x = props.fromPosition.x;
    dot.y = props.fromPosition.y;
  });
});
</script>

<style scoped>
.pipe {
  pointer-events: stroke;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pipe:hover .pipe-path {
  filter: brightness(1.2);
  stroke-width: 4;
}

.pipe.selected .pipe-path {
  stroke: #1976D2;
}

.selection-outline {
  pointer-events: none;
}

.pipe-path {
  transition: stroke var(--transition-fast), stroke-width var(--transition-fast);
}

.flow-animation {
  pointer-events: none;
}

.flow-dot {
  filter: drop-shadow(0 0 2px rgba(33, 150, 243, 0.8));
}
</style>
