<template>
  <div 
    class="pid-canvas-container"
    @drop="handleDrop"
    @dragover.prevent
  >
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="pid-canvas"
      @click="handleCanvasClick"
      @mousemove="handleMouseMove"
    >
      <!-- Background grid -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Temporary connection line (while drawing) -->
      <line
        v-if="isDrawingConnection && tempConnectionEnd"
        :x1="tempConnectionStart.x"
        :y1="tempConnectionStart.y"
        :x2="tempConnectionEnd.x"
        :y2="tempConnectionEnd.y"
        stroke="#2196F3"
        stroke-width="3"
        stroke-dasharray="5,5"
        opacity="0.6"
        class="temp-connection"
      />
      
      <!-- Connection layer -->
      <g class="connections-layer">
        <g
          v-for="conn in connections"
          :key="conn.id"
          @click.stop="handleConnectionClick(conn.id)"
          class="connection-group"
          :class="{ 'selected': selectedConnection === conn.id }"
        >
          <Pipe
            :fromPosition="getPortPosition(conn.from.componentId, conn.from.portId)"
            :toPosition="getPortPosition(conn.to.componentId, conn.to.portId)"
            :flowing="conn.flow?.active || false"
          />
        </g>
      </g>
      
      <!-- Component layer -->
      <g class="components-layer">
        <g
          v-for="comp in components"
          :key="comp.id"
          @mousedown.stop="handleComponentMouseDown($event, comp.id)"
          class="component-group"
          :class="{ 'selected': selectedComponent === comp.id }"
        >
          <component
            :is="getComponentType(comp.type)"
            :component="comp"
            :state="getComponentState(comp.id)"
            :isEditMode="isEditMode"
            :showPorts="isEditMode"
            @click="handleComponentClick"
            @portMouseDown="handlePortMouseDown"
          />
        </g>
      </g>
      
      <!-- Selection indicator -->
      <rect
        v-if="selectedComponent"
        :x="getSelectedComponentPosition().x - 10"
        :y="getSelectedComponentPosition().y - 10"
        :width="60"
        :height="44"
        fill="none"
        stroke="#2196F3"
        stroke-width="2"
        stroke-dasharray="5,5"
        pointer-events="none"
      />
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
  componentStates?: Record<string, string>;
  isEditMode?: boolean;
  isDrawingConnection?: boolean;
  selectedComponent?: string | null;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  isDrawingConnection: false,
  selectedComponent: null,
  width: 1200,
  height: 800,
  componentStates: () => ({}),
});

const emit = defineEmits<{
  componentClick: [componentId: string];
  componentMouseDown: [componentId: string, event: MouseEvent];
  componentCommand: [componentId: string, action: string];
  portMouseDown: [componentId: string, portId: string];
  connectionClick: [connectionId: string];
  canvasClick: [position: Position];
  componentDrop: [type: string, position: Position];
}>();

const svgRef = ref<SVGSVGElement>();
const selectedConnection = ref<string | null>(null);
const tempConnectionEnd = ref<Position | null>(null);

const componentTypes: Record<string, any> = {
  valve: Valve,
};

function getComponentType(type: string) {
  return componentTypes[type] || Valve;
}

// Get SVG coordinates from mouse event
function getSVGCoordinates(event: MouseEvent): Position {
  if (!svgRef.value) return { x: 0, y: 0 };
  
  const pt = svgRef.value.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  
  const svgP = pt.matrixTransform(svgRef.value.getScreenCTM()!.inverse());
  return { x: svgP.x, y: svgP.y };
}

// Get absolute port position
function getPortPosition(componentId: string, portId: string): Position {
  const component = props.components.find(c => c.id === componentId);
  if (!component) return { x: 0, y: 0 };
  
  const port = component.ports.find(p => p.id === portId);
  if (!port) return component.position;
  
  const angle = (component.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return {
    x: component.position.x + port.position.x * cos - port.position.y * sin,
    y: component.position.y + port.position.x * sin + port.position.y * cos,
  };
}

function getComponentState(componentId: string): string {
  return props.componentStates[componentId] || 'closed';
}

function getSelectedComponentPosition(): Position {
  const comp = props.components.find(c => c.id === props.selectedComponent);
  return comp?.position || { x: 0, y: 0 };
}

// Temporary connection visualization
const tempConnectionStart = computed(() => {
  if (!props.isDrawingConnection) return { x: 0, y: 0 };
  // Get from parent or calculate
  return { x: 0, y: 0 }; // TODO: Get actual start position
});

function handleCanvasClick(event: MouseEvent) {
  const pos = getSVGCoordinates(event);
  emit('canvasClick', pos);
  selectedConnection.value = null;
}

function handleComponentClick(componentId: string) {
  emit('componentClick', componentId);
}

function handleComponentMouseDown(event: MouseEvent, componentId: string) {
  if (props.isEditMode) {
    emit('componentMouseDown', componentId, event);
  }
}

function handlePortMouseDown(componentId: string, portId: string) {
  emit('portMouseDown', componentId, portId);
}

function handleConnectionClick(connectionId: string) {
  selectedConnection.value = connectionId;
  emit('connectionClick', connectionId);
}

function handleMouseMove(event: MouseEvent) {
  if (props.isDrawingConnection) {
    tempConnectionEnd.value = getSVGCoordinates(event);
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const componentType = event.dataTransfer!.getData('componentType');
  const pos = getSVGCoordinates(event as any);
  emit('componentDrop', componentType, pos);
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

.component-group.selected {
  filter: drop-shadow(0 0 5px #2196F3);
}

.connection-group {
  cursor: pointer;
}

.connection-group:hover {
  filter: drop-shadow(0 0 3px #666);
}

.connection-group.selected {
  filter: drop-shadow(0 0 5px #F44336);
}

.temp-connection {
  pointer-events: none;
}
</style>
