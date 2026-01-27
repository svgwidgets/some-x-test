<template>
  <g
    :id="component.id"
    :transform="`translate(${component.position.x}, ${component.position.y}) rotate(${component.rotation || 0})`"
    class="pid-tank"
    :class="{ 'editable': isEditMode }"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <!-- Tank body outline -->
    <path
      d="M 0 15 C 0 6.72 11.19 0 25 0 C 38.81 0 50 6.72 50 15 L 50 105 C 50 113.28 38.81 120 25 120 C 11.19 120 0 113.28 0 105 Z"
      fill="none"
      :stroke="strokeColor"
      stroke-width="2"
      class="tank-outline"
    />
    
    <!-- Liquid fill (clips to tank shape) -->
    <defs>
      <clipPath id="tank-clip">
        <path d="M 0 15 C 0 6.72 11.19 0 25 0 C 38.81 0 50 6.72 50 15 L 50 105 C 50 113.28 38.81 120 25 120 C 11.19 120 0 113.28 0 105 Z" />
      </clipPath>
    </defs>
    
    <rect
      :x="2"
      :y="liquidY"
      :width="46"
      :height="liquidHeight"
      :fill="liquidColor"
      opacity="0.7"
      clip-path="url(#tank-clip)"
      class="liquid-fill"
    />
    
    <!-- Level percentage text -->
    <text
      x="25"
      y="65"
      text-anchor="middle"
      font-size="16"
      font-family="Arial"
      font-weight="bold"
      :fill="textColor"
      class="level-text"
    >
      {{ Math.round(level) }}%
    </text>
    
    <!-- Capacity text -->
    <text
      v-if="config.showCapacity"
      x="25"
      y="135"
      text-anchor="middle"
      font-size="10"
      font-family="Arial"
      fill="#666"
    >
      {{ actualVolume }} {{ config.capacityUnit || 'L' }}
    </text>
    
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
    
    <!-- State indicator -->
    <circle
      cx="45"
      cy="5"
      r="3"
      :fill="stateIndicatorColor"
      stroke="#333"
      stroke-width="1"
      class="state-indicator"
    />
    
    <!-- Label -->
    <text
      x="25"
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
      v-if="isEditMode && component.dataBindings?.value"
      cx="5"
      cy="5"
      r="3"
      :fill="isDataConnected ? '#4CAF50' : '#F44336'"
      class="data-indicator"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ComponentBase } from '@/core/types';

interface Props {
  component: ComponentBase;
  level?: number;  // 0-100%
  state?: 'normal' | 'low' | 'high' | 'alarm-low' | 'alarm-high' | 'overflow';
  isEditMode?: boolean;
  showPorts?: boolean;
  isDataConnected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  state: 'normal',
  isEditMode: false,
  showPorts: false,
  isDataConnected: false,
});

const emit = defineEmits<{
  click: [componentId: string];
  portMouseDown: [componentId: string, portId: string];
}>();

// Config with defaults
const config = computed(() => ({
  showLevel: true,
  showCapacity: true,
  capacity: 1000,
  capacityUnit: 'L',
  alarmLow: 10,
  alarmHigh: 95,
  warningLow: 20,
  warningHigh: 90,
  ...props.component.config,
}));

// Calculate liquid fill dimensions
const tankHeight = 120;
const tankBodyStart = 15;  // Top ellipse
const tankBodyEnd = 105;   // Bottom ellipse
const fillableHeight = tankBodyEnd - tankBodyStart;

const liquidHeight = computed(() => {
  // Calculate height based on level percentage
  return (props.level / 100) * fillableHeight;
});

const liquidY = computed(() => {
  // Start from bottom and fill upward
  return tankBodyEnd - liquidHeight.value;
});

// Determine effective state based on level if not explicitly set
const effectiveState = computed(() => {
  if (props.state !== 'normal') return props.state;
  
  const cfg = config.value;
  if (props.level <= (cfg.alarmLow || 10)) return 'alarm-low';
  if (props.level >= (cfg.alarmHigh || 95)) return 'alarm-high';
  if (props.level >= 100) return 'overflow';
  if (props.level <= (cfg.warningLow || 20)) return 'low';
  if (props.level >= (cfg.warningHigh || 90)) return 'high';
  
  return 'normal';
});

// Liquid color based on state
const liquidColor = computed(() => {
  const colors = {
    'normal': '#2196F3',      // Blue
    'low': '#FFC107',         // Yellow
    'high': '#FF9800',        // Orange
    'alarm-low': '#F44336',   // Red
    'alarm-high': '#F44336',  // Red
    'overflow': '#9C27B0',    // Purple
  };
  return colors[effectiveState.value];
});

const strokeColor = computed(() => {
  return effectiveState.value.includes('alarm') || effectiveState.value === 'overflow' 
    ? '#D32F2F' 
    : '#333';
});

const textColor = computed(() => {
  // Dark text on light liquid, light text on dark liquid
  return props.level > 50 ? '#FFFFFF' : '#333333';
});

const stateIndicatorColor = computed(() => {
  const colors = {
    'normal': '#4CAF50',
    'low': '#FFC107',
    'high': '#FF9800',
    'alarm-low': '#F44336',
    'alarm-high': '#F44336',
    'overflow': '#9C27B0',
  };
  return colors[effectiveState.value];
});

// Calculate actual volume
const actualVolume = computed(() => {
  const capacity = config.value.capacity || 1000;
  return Math.round((props.level / 100) * capacity);
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
.pid-tank {
  cursor: default;
}

.editable .tank-outline {
  cursor: move;
}

.editable .tank-outline:hover {
  filter: brightness(1.1);
}

.tank-outline {
  transition: stroke 0.3s ease;
}

.liquid-fill {
  transition: y 0.5s ease, height 0.5s ease, fill 0.3s ease;
}

.level-text {
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
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
