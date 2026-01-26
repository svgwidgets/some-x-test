<template>
  <g
    :id="component.id"
    :transform="`translate(${component.position.x}, ${component.position.y}) rotate(${component.rotation || 0})`"
    class="pid-valve"
    :class="{ 'editable': isEditMode }"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <!-- Valve body (diamond shape from FUXA) -->
    <path
      d="M 0 0 L 20 12 L 0 24 Z M 40 0 L 20 12 L 40 24 Z"
      :fill="fillColor"
      :stroke="strokeColor"
      stroke-width="2"
      class="valve-body"
    />
    
    <!-- Connection ports (visible in edit mode) -->
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
        :data-port-id="port.id"
        @mousedown.stop="handlePortMouseDown(port)"
      />
    </g>
    
    <!-- Label -->
    <text
      x="20"
      y="-5"
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
      cx="35"
      cy="2"
      r="3"
      :fill="isDataConnected ? '#4CAF50' : '#F44336'"
      class="data-indicator"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import type { ComponentBase } from '@/core/types';

interface Props {
  component: ComponentBase;
  state?: 'open' | 'closed' | 'transitioning' | 'error';
  isEditMode?: boolean;
  showPorts?: boolean;
  isDataConnected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  state: 'closed',
  isEditMode: false,
  showPorts: false,
  isDataConnected: false,
});

const emit = defineEmits<{
  click: [componentId: string];
  command: [componentId: string, action: string];
  dragStart: [componentId: string, position: { x: number; y: number }];
  dragMove: [componentId: string, position: { x: number; y: number }];
  dragEnd: [componentId: string, position: { x: number; y: number }];
  portMouseDown: [componentId: string, portId: string];
}>();

const STATE_COLORS = {
  open: '#4CAF50',
  closed: '#F44336',
  transitioning: '#FFC107',
  error: '#FF5722',
  disabled: '#9E9E9E',
};

const fillColor = computed(() => STATE_COLORS[props.state]);
const strokeColor = computed(() => props.state === 'error' ? '#D32F2F' : '#333');

function handleClick(event: MouseEvent) {
  event.stopPropagation();
  emit('click', props.component.id);
}

function handleMouseDown(event: MouseEvent) {
  if (!props.isEditMode) return;
  event.stopPropagation();
  emit('dragStart', props.component.id, props.component.position);
}

function handlePortMouseDown(port: any) {
  emit('portMouseDown', props.component.id, port.id);
}
</script>

<style scoped>
.pid-valve {
  cursor: default;
}

.editable .valve-body {
  cursor: move;
}

.editable .valve-body:hover {
  filter: brightness(1.1);
}

.port {
  cursor: crosshair;
}

.port:hover {
  r: 4;
  filter: brightness(1.2);
}

.valve-body {
  transition: fill 0.3s ease;
}

.data-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
