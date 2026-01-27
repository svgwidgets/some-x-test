<template>
  <g
    :id="component.id"
    :transform="`translate(${component.position.x}, ${component.position.y}) rotate(${component.rotation || 0})`"
    class="pid-pump"
    :class="{ 'editable': isEditMode, 'running': state === 'running' }"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <!-- Pump casing (circle) -->
    <path
      d="M 40,20 A 20,20 0 0 1 20,40 20,20 0 0 1 0,20 20,20 0 0 1 20,0 20,20 0 0 1 40,20"
      :fill="casingColor"
      :stroke="strokeColor"
      stroke-width="2"
      class="pump-casing"
    />
    
    <!-- Impeller (rotates when running) -->
    <g
      ref="impellerRef"
      :transform="`rotate(${impellerRotation} 20 20)`"
      class="pump-impeller"
    >
      <!-- Vertical line -->
      <path
        d="M 20 0 L 20 40"
        stroke="#666"
        stroke-width="2"
        fill="none"
      />
      <!-- Triangle -->
      <path
        d="M 0 20 L 20 0 L 40 20"
        fill="none"
        stroke="#666"
        stroke-width="2"
      />
    </g>
    
    <!-- Connection ports -->
    <g v-if="showPorts" class="ports">
      <circle
        v-for="port in component.ports"
        :key="port.id"
        :cx="port.position.x"
        :cy="port.position.y"
        r="3"
        :fill="port.connected ? '#4CAF50' : '#FFC107'"
        stroke="#333"
        stroke-width="1"
        class="port"
        @mousedown.stop="handlePortMouseDown(port)"
      />
    </g>
    
    <!-- RPM display -->
    <text
      v-if="rpm > 0"
      x="45"
      y="15"
      font-size="10"
      font-family="Arial"
      fill="#333"
      font-weight="bold"
    >
      {{ rpm }} RPM
    </text>
    
    <!-- State indicator -->
    <circle
      cx="35"
      cy="5"
      r="3"
      :fill="stateIndicatorColor"
      stroke="#333"
      stroke-width="1"
      class="state-indicator"
    />
    
    <!-- Label -->
    <text
      x="20"
      y="-8"
      text-anchor="middle"
      font-size="10"
      font-weight="bold"
      fill="#333"
    >
      {{ component.id }}
    </text>
    
    <!-- Data binding indicator -->
    <circle
      v-if="component.dataBindings?.state"
      cx="5"
      cy="5"
      r="3"
      :fill="isDataConnected ? '#4CAF50' : '#F44336'"
      class="data-indicator"
    />
  </g>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { ComponentBase } from '@/core/types';

interface Props {
  component: ComponentBase;
  state?: 'stopped' | 'starting' | 'running' | 'stopping' | 'alarm';
  rpm?: number;
  isEditMode?: boolean;
  showPorts?: boolean;
  isDataConnected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  state: 'stopped',
  rpm: 0,
  isEditMode: false,
  showPorts: false,
  isDataConnected: false,
});

const emit = defineEmits<{
  click: [componentId: string];
  command: [componentId: string, action: string];
  portMouseDown: [componentId: string, portId: string];
}>();

const impellerRotation = ref(0);
let animationFrame: number | null = null;

const STATE_COLORS = {
  stopped: '#E0E0E0',
  starting: '#FFC107',
  running: '#4CAF50',
  stopping: '#FF9800',
  alarm: '#F44336',
};

const casingColor = computed(() => STATE_COLORS[props.state]);
const strokeColor = computed(() => props.state === 'alarm' ? '#D32F2F' : '#333');

const stateIndicatorColor = computed(() => {
  const colors = {
    stopped: '#9E9E9E',
    starting: '#FFC107',
    running: '#4CAF50',
    stopping: '#FF9800',
    alarm: '#F44336',
  };
  return colors[props.state];
});

// Rotation animation
watch(() => props.state, (newState) => {
  if (newState === 'running' || newState === 'starting') {
    startRotation();
  } else {
    stopRotation();
  }
}, { immediate: true });

function startRotation() {
  if (animationFrame !== null) return;
  
  const animate = () => {
    const speed = props.rpm > 0 ? props.rpm / 50 : 2;
    impellerRotation.value = (impellerRotation.value + speed) % 360;
    animationFrame = requestAnimationFrame(animate);
  };
  
  animate();
}

function stopRotation() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

onMounted(() => {
  if (props.state === 'running') {
    startRotation();
  }
});

onUnmounted(() => {
  stopRotation();
});

function handleClick(event: MouseEvent) {
  event.stopPropagation();
  emit('click', props.component.id);
}

function handleMouseDown(event: MouseEvent) {
  if (!props.isEditMode) return;
  event.stopPropagation();
}

function handlePortMouseDown(port: any) {
  emit('portMouseDown', props.component.id, port.id);
}
</script>

<style scoped>
.pid-pump {
  cursor: default;
}

.editable .pump-casing {
  cursor: move;
}

.editable .pump-casing:hover {
  filter: brightness(1.1);
}

.pump-casing {
  transition: fill 0.3s ease, stroke 0.3s ease;
}

.port {
  cursor: crosshair;
}

.port:hover {
  r: 4;
  filter: brightness(1.2);
}

.state-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.data-indicator {
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
