<template>
  <g class="pid-pipe">
    <!-- Main pipe line -->
    <path
      :d="pathData"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      class="pipe-line"
    />
    
    <!-- Flow animation (moving dots) -->
    <g v-if="connection.flow?.active" class="flow-animation">
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
      v-if="connection.flow?.active"
      :d="arrowPath"
      fill="#2196F3"
      class="flow-arrow"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Connection, Position } from '@/core/types';

interface Props {
  connection: Connection;
  fromPosition: Position;  // Computed from component + port
  toPosition: Position;
  strokeWidth?: number;
  flowing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  strokeWidth: 4,
  flowing: false,
});

// Calculate path
const pathData = computed(() => {
  const { fromPosition, toPosition, connection } = props;
  
  if (connection.points && connection.points.length > 0) {
    // Custom routing with intermediate points
    let path = `M ${fromPosition.x} ${fromPosition.y}`;
    connection.points.forEach(point => {
      path += ` L ${point.x} ${point.y}`;
    });
    path += ` L ${toPosition.x} ${toPosition.y}`;
    return path;
  } else {
    // Straight line
    return `M ${fromPosition.x} ${fromPosition.y} L ${toPosition.x} ${toPosition.y}`;
  }
});

const strokeColor = computed(() => {
  if (props.connection.flow?.active) {
    return props.connection.flow.direction === 'forward' ? '#2196F3' : '#FF9800';
  }
  return '#666';
});

// Flow animation
const flowDots = ref<Array<{ x: number; y: number; opacity: number }>>([]);
let animationFrame: number;

onMounted(() => {
  if (props.flowing || props.connection.flow?.active) {
    startFlowAnimation();
  }
});

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

function startFlowAnimation() {
  const numDots = 5;
  const speed = 2; // pixels per frame
  
  const animate = () => {
    const { fromPosition, toPosition } = props;
    const dx = toPosition.x - fromPosition.x;
    const dy = toPosition.y - fromPosition.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    flowDots.value = Array.from({ length: numDots }, (_, i) => {
      const offset = (Date.now() / 20 + i * (length / numDots)) % length;
      const progress = offset / length;
      
      return {
        x: fromPosition.x + dx * progress,
        y: fromPosition.y + dy * progress,
        opacity: Math.sin(progress * Math.PI),
      };
    });
    
    animationFrame = requestAnimationFrame(animate);
  };
  
  animate();
}

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
  const x2 = midX + arrowSize * Math.cos(angle + 2.5);
  const y2 = midY + arrowSize * Math.sin(angle + 2.5);
  const x3 = midX + arrowSize * Math.cos(angle - 2.5);
  const y3 = midY + arrowSize * Math.sin(angle - 2.5);
  
  return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
});
</script>

<style scoped>
.pipe-line {
  transition: stroke 0.3s ease;
}

.flow-arrow {
  opacity: 0.8;
}
</style>
