<template>
  <g
    :id="component.id"
    :transform="`translate(${component.position.x}, ${component.position.y})`"
    class="pid-sensor"
    :class="{ 'editable': isEditMode }"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <!-- Sensor box/outline -->
    <rect
      x="0"
      y="0"
      width="80"
      height="60"
      :fill="backgroundColor"
      :stroke="strokeColor"
      stroke-width="2"
      rx="4"
      class="sensor-box"
    />
    
    <!-- Label (sensor ID) -->
    <text
      x="40"
      y="18"
      text-anchor="middle"
      font-size="11"
      font-family="Arial"
      font-weight="bold"
      fill="#333"
    >
      {{ component.id }}
    </text>
    
    <!-- Value -->
    <text
      x="40"
      y="38"
      text-anchor="middle"
      font-size="18"
      font-family="Arial"
      font-weight="bold"
      :fill="valueColor"
      class="sensor-value"
    >
      {{ formattedValue }}
    </text>
    
    <!-- Unit -->
    <text
      v-if="config.showUnit"
      x="40"
      y="52"
      text-anchor="middle"
      font-size="9"
      font-family="Arial"
      fill="#666"
    >
      {{ config.unit || '' }}
    </text>
    
    <!-- Connection port (optional - sensors usually just one port) -->
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
      cx="75"
      cy="5"
      r="3"
      :fill="stateIndicatorColor"
      stroke="#333"
      stroke-width="1"
      class="state-indicator"
    />
    
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
  value?: number;
  state?: 'normal' | 'warning-low' | 'warning-high' | 'alarm-low' | 'alarm-high' | 'fault';
  isEditMode?: boolean;
  showPorts?: boolean;
  isDataConnected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
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
  sensorType: 'pressure',
  unit: 'bar',
  minValue: 0,
  maxValue: 200,
  warningLow: 20,
  warningHigh: 180,
  alarmLow: 10,
  alarmHigh: 190,
  precision: 1,
  showLabel: true,
  showUnit: true,
  ...props.component.config,
}));

// Format value with precision
const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return '--';
  return props.value.toFixed(config.value.precision || 1);
});

// Auto-calculate state based on value if not explicitly set
const effectiveState = computed(() => {
  if (props.state !== 'normal') return props.state;
  
  const cfg = config.value;
  const val = props.value;
  
  if (val === undefined || val === null) return 'fault';
  
  if (val <= (cfg.alarmLow || 10)) return 'alarm-low';
  if (val >= (cfg.alarmHigh || 190)) return 'alarm-high';
  if (val <= (cfg.warningLow || 20)) return 'warning-low';
  if (val >= (cfg.warningHigh || 180)) return 'warning-high';
  
  return 'normal';
});

// Background color based on state
const backgroundColor = computed(() => {
  const colors = {
    'normal': '#E8F5E9',        // Light green
    'warning-low': '#FFF3E0',   // Light orange
    'warning-high': '#FFF3E0',  // Light orange
    'alarm-low': '#FFEBEE',     // Light red
    'alarm-high': '#FFEBEE',    // Light red
    'fault': '#F5F5F5',         // Gray
  };
  return colors[effectiveState.value];
});

// Value color based on state
const valueColor = computed(() => {
  const colors = {
    'normal': '#2E7D32',        // Dark green
    'warning-low': '#F57C00',   // Dark orange
    'warning-high': '#F57C00',  // Dark orange
    'alarm-low': '#C62828',     // Dark red
    'alarm-high': '#C62828',    // Dark red
    'fault': '#757575',         // Gray
  };
  return colors[effectiveState.value];
});

const strokeColor = computed(() => {
  return effectiveState.value.includes('alarm') || effectiveState.value === 'fault'
    ? '#D32F2F'
    : '#333';
});

const stateIndicatorColor = computed(() => {
  const colors = {
    'normal': '#4CAF50',
    'warning-low': '#FF9800',
    'warning-high': '#FF9800',
    'alarm-low': '#F44336',
    'alarm-high': '#F44336',
    'fault': '#9E9E9E',
  };
  return colors[effectiveState.value];
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
.pid-sensor {
  cursor: default;
}

.editable .sensor-box {
  cursor: move;
}

.editable .sensor-box:hover {
  filter: brightness(1.05);
}

.sensor-box {
  transition: fill 0.3s ease, stroke 0.3s ease;
}

.sensor-value {
  transition: fill 0.3s ease;
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
