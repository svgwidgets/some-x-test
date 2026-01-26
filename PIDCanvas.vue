<template>
  <div class="pid-canvas-container">
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="pid-canvas"
      @click="handleCanvasClick"
    >
      <!-- Background grid -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Connection layer -->
      <g class="connections-layer">
        <Pipe
          v-for="conn in connections"
          :key="conn.id"
          :connection="conn"
          :fromPosition="getPortPosition(conn.from.componentId, conn.from.portId)"
          :toPosition="getPortPosition(conn.to.componentId, conn.to.portId)"
          :flowing="conn.flow?.active"
        />
      </g>
      
      <!-- Component layer -->
      <g class="components-layer">
        <component
          v-for="comp in components"
          :key="comp.id"
          :is="getComponentType(comp.type)"
          :component="comp"
          :state="getComponentState(comp.id)"
          :isEditMode="isEditMode"
          :showPorts="isEditMode"
          :isDataConnected="isDataConnected(comp.id)"
          @click="handleComponentClick"
          @command="handleComponentCommand"
          @portMouseDown="handlePortMouseDown"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Valve from './Valve.vue';
import Pipe from './Pipe.vue';
import type { ComponentBase, Connection, Position } from '@/core/types';

interface Props {
  components: ComponentBase[];
  connections: Connection[];
  isEditMode?: boolean;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  width: 1200,
  height: 800,
});

const emit = defineEmits<{
  componentClick: [componentId: string];
  componentCommand: [componentId: string, action: string];
  portMouseDown: [componentId: string, portId: string];
  canvasClick: [];
}>();

const svgRef = ref<SVGSVGElement>();

// Component type mapping
const componentTypes: Record<string, any> = {
  valve: Valve,
  // pump: Pump,
  // tank: Tank,
  // sensor: Sensor,
};

function getComponentType(type: string) {
  return componentTypes[type] || Valve;
}

// Get absolute port position
function getPortPosition(componentId: string, portId: string): Position {
  const component = props.components.find(c => c.id === componentId);
  if (!component) return { x: 0, y: 0 };
  
  const port = component.ports.find(p => p.id === portId);
  if (!port) return component.position;
  
  // Transform port position by component position and rotation
  const angle = (component.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return {
    x: component.position.x + port.position.x * cos - port.position.y * sin,
    y: component.position.y + port.position.x * sin + port.position.y * cos,
  };
}

// Get component state (from data layer)
function getComponentState(componentId: string): any {
  // TODO: Get from data service
  return 'closed';
}

function isDataConnected(componentId: string): boolean {
  // TODO: Check data service connection
  return false;
}

function handleCanvasClick() {
  emit('canvasClick');
}

function handleComponentClick(componentId: string) {
  emit('componentClick', componentId);
}

function handleComponentCommand(componentId: string, action: string) {
  emit('componentCommand', componentId, action);
}

function handlePortMouseDown(componentId: string, portId: string) {
  emit('portMouseDown', componentId, portId);
}
</script>

<style scoped>
.pid-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
}

.pid-canvas {
  display: block;
}
</style>
