<template>
  <div 
    class="pid-canvas-container"
    :class="{ 'dragging': isDraggingComponent }"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="pid-canvas"
      :class="{ 'show-grid': showGrid && isEditMode }"
      @click="handleCanvasClick"
    >
      <!-- Background with grid -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path 
            d="M 20 0 L 0 0 0 20" 
            fill="none" 
            stroke="#E0E0E0" 
            stroke-width="1"
            opacity="0.5"
          />
        </pattern>
      </defs>
      
      <rect 
        width="100%" 
        height="100%" 
        :fill="showGrid && isEditMode ? 'url(#grid)' : 'white'" 
      />
      
      <!-- Connection layer -->
      <g class="connections-layer">
        <Pipe
          v-for="conn in connections"
          :key="conn.id"
          :fromPosition="getPortPosition(conn.from.componentId, conn.from.portId)"
          :toPosition="getPortPosition(conn.to.componentId, conn.to.portId)"
          :flowing="conn.flow?.active || false"
        />
      </g>
      
      <!-- Component layer -->
      <g class="components-layer">
        <g
          v-for="comp in components"
          :key="comp.id"
          class="component-wrapper"
          :class="{ 
            'selected': editorStore.selectedComponentId === comp.id,
            'draggable': isEditMode 
          }"
          @mousedown="handleComponentMouseDown($event, comp.id)"
          @click="handleComponentClick(comp.id)"
        >
          <component
            :is="getComponentType(comp.type)"
            :component="comp"
            :state="getComponentState(comp.id)"
            :rpm="getComponentRPM(comp.id)"
            :level="getComponentLevel(comp.id)"
            :value="getComponentValue(comp.id)"
            :isEditMode="isEditMode"
            :showPorts="isEditMode"
            @portMouseDown="handlePortMouseDown"
          />
          
          <!-- Selection indicator -->
          <rect
            v-if="editorStore.selectedComponentId === comp.id && isEditMode"
            :x="getSelectionBounds(comp).x"
            :y="getSelectionBounds(comp).y"
            :width="getSelectionBounds(comp).width"
            :height="getSelectionBounds(comp).height"
            fill="none"
            stroke="#2196F3"
            stroke-width="2"
            stroke-dasharray="5,5"
            class="selection-indicator"
            pointer-events="none"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { useDiagramStore } from '@/stores/diagram';
import Valve from './Valve.vue';
import Pump from './Pump.vue';
import Tank from './Tank.vue';
import Sensor from './Sensor.vue';
import Pipe from './Pipe.vue';
import type { ComponentBase, Connection, Position } from '@/core/types';
import type { PaletteItem } from '@/types/palette';

interface Props {
  components: ComponentBase[];
  connections: Connection[];
  componentStates?: Record<string, string>;
  pumpRPM?: Record<string, number>;
  tankLevels?: Record<string, number>;
  sensorValues?: Record<string, number>;
  isEditMode?: boolean;
  showGrid?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  showGrid: true,
  componentStates: () => ({}),
  pumpRPM: () => ({}),
  tankLevels: () => ({}),
  sensorValues: () => ({}),
});

const emit = defineEmits<{
  componentClick: [componentId: string];
  canvasClick: [];
}>();

const editorStore = useEditorStore();
const diagramStore = useDiagramStore();

const svgRef = ref<SVGSVGElement>();

// Component type mapping
const componentTypes: Record<string, any> = {
  valve: Valve,
  pump: Pump,
  tank: Tank,
  sensor: Sensor,
};

function getComponentType(type: string) {
  return componentTypes[type] || Valve;
}

// Dragging state
const isDraggingComponent = ref(false);
const draggedComponentId = ref<string | null>(null);
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });

// Convert screen coordinates to SVG coordinates
function screenToSVG(screenX: number, screenY: number): { x: number; y: number } {
  if (!svgRef.value) return { x: screenX, y: screenY };
  
  const pt = svgRef.value.createSVGPoint();
  pt.x = screenX;
  pt.y = screenY;
  
  const svgP = pt.matrixTransform(svgRef.value.getScreenCTM()!.inverse());
  return { x: svgP.x, y: svgP.y };
}

// Component dragging
function handleComponentMouseDown(event: MouseEvent, componentId: string) {
  if (!props.isEditMode) return;
  
  // Don't start drag if clicking on a port
  const target = event.target as SVGElement;
  if (target.classList.contains('port')) return;
  
  event.stopPropagation();
  event.preventDefault();
  
  // Select component
  editorStore.selectComponent(componentId);
  
  // Get component from store (not props)
  const component = diagramStore.components.find(c => c.id === componentId);
  if (!component) return;
  
  // Get mouse position in SVG coordinates
  const mousePos = screenToSVG(event.clientX, event.clientY);
  
  // Calculate offset between mouse and component position
  dragOffset.value = {
    x: mousePos.x - component.position.x,
    y: mousePos.y - component.position.y,
  };
  
  draggedComponentId.value = componentId;
  isDraggingComponent.value = true;
  editorStore.startDragging(mousePos);
  
  // Add global listeners
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  
  console.log(`[PIDCanvas] Started dragging ${componentId}`, { mousePos, offset: dragOffset.value });
}

function handleDragMove(event: MouseEvent) {
  if (!isDraggingComponent.value || !draggedComponentId.value) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Get current mouse position in SVG coordinates
  const mousePos = screenToSVG(event.clientX, event.clientY);
  
  // Calculate new component position
  const newPosition = {
    x: Math.round(mousePos.x - dragOffset.value.x),
    y: Math.round(mousePos.y - dragOffset.value.y),
  };
  
  // Update component position via store action
  diagramStore.updateComponentPosition(draggedComponentId.value, newPosition);
}

function handleDragEnd(event: MouseEvent) {
  if (!draggedComponentId.value) return;
  
  console.log(`[PIDCanvas] Stopped dragging ${draggedComponentId.value}`);
  
  isDraggingComponent.value = false;
  draggedComponentId.value = null;
  editorStore.stopDragging();
  
  // Remove global listeners
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
}

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
});

// Component click
function handleComponentClick(componentId: string) {
  emit('componentClick', componentId);
}

// Canvas click
function handleCanvasClick(event: MouseEvent) {
  const target = event.target as SVGElement;
  // Only clear selection if clicking on background
  if (target.tagName === 'rect' || target === svgRef.value) {
    editorStore.clearSelection();
  }
  emit('canvasClick');
}

// Port mouse down (for future connection drawing)
function handlePortMouseDown(componentId: string, portId: string) {
  console.log('[PIDCanvas] Port clicked:', componentId, portId);
  // Phase 4 will implement connection drawing
}

// Get port absolute position
function getPortPosition(componentId: string, portId: string): Position {
  const component = props.components.find(c => c.id === componentId);
  
  if (!component) {
    console.warn(`[PIDCanvas] Component not found: ${componentId}`);
    return { x: 0, y: 0 };
  }
  
  const port = component.ports?.find(p => p.id === portId);
  
  if (!port) {
    console.warn(`[PIDCanvas] Port not found: ${portId} on ${componentId}`);
    return component.position;
  }
  
  // Calculate absolute position with rotation
  const angle = (component.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const absX = component.position.x + port.position.x * cos - port.position.y * sin;
  const absY = component.position.y + port.position.x * sin + port.position.y * cos;
  
  return { x: absX, y: absY };
}

// Get component state
function getComponentState(componentId: string): string | undefined {
  return props.componentStates?.[componentId];
}

function getComponentRPM(componentId: string): number | undefined {
  return props.pumpRPM?.[componentId];
}

function getComponentLevel(componentId: string): number | undefined {
  return props.tankLevels?.[componentId];
}

function getComponentValue(componentId: string): number | undefined {
  return props.sensorValues?.[componentId];
}

// Get selection bounds for different component types
function getSelectionBounds(component: ComponentBase): { x: number; y: number; width: number; height: number } {
  const bounds: Record<string, { width: number; height: number; offsetX: number; offsetY: number }> = {
    valve: { width: 50, height: 34, offsetX: -5, offsetY: -5 },
    pump: { width: 50, height: 50, offsetX: -5, offsetY: -5 },
    tank: { width: 60, height: 130, offsetX: -5, offsetY: -5 },
    sensor: { width: 90, height: 70, offsetX: -5, offsetY: -5 },
  };
  
  const bound = bounds[component.type] || { width: 60, height: 60, offsetX: -5, offsetY: -5 };
  
  return {
    x: component.position.x + bound.offsetX,
    y: component.position.y + bound.offsetY,
    width: bound.width,
    height: bound.height,
  };
}

// Drop handling for palette
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  
  if (!props.isEditMode) {
    console.warn('[PIDCanvas] Drop ignored - not in edit mode');
    return;
  }
  
  if (!event.dataTransfer) return;
  
  try {
    const data = event.dataTransfer.getData('application/json');
    const paletteItem: PaletteItem = JSON.parse(data);
    
    // Get drop position in SVG coordinates
    const position = screenToSVG(event.clientX, event.clientY);
    
    // Create component via store
    createComponentFromPalette(paletteItem, position);
    
    console.log('[PIDCanvas] Component dropped:', paletteItem.label, 'at', position);
  } catch (error) {
    console.error('[PIDCanvas] Drop error:', error);
  }
}

function createComponentFromPalette(item: PaletteItem, position: { x: number; y: number }) {
  const newComponent: ComponentBase = {
    id: '',
    type: item.type,
    position: position,
    rotation: 0,
    ports: getDefaultPorts(item.type),
    config: item.defaultConfig || {},
    dataBindings: {},
  };
  
  diagramStore.addComponent(newComponent);
}

function getDefaultPorts(type: string): any[] {
  const portDefs: Record<string, any[]> = {
    valve: [
      { id: 'inlet', type: 'inlet', position: { x: 0, y: 12 } },
      { id: 'outlet', type: 'outlet', position: { x: 40, y: 12 } },
    ],
    pump: [
      { id: 'inlet', type: 'inlet', position: { x: 0, y: 20 } },
      { id: 'outlet', type: 'outlet', position: { x: 40, y: 20 } },
    ],
    tank: [
      { id: 'inlet', type: 'inlet', position: { x: 25, y: 0 } },
      { id: 'outlet', type: 'outlet', position: { x: 25, y: 120 } },
    ],
    sensor: [],
  };
  
  return portDefs[type] || [];
}
</script>

<style scoped>
.pid-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: white;
  position: relative;
}

.pid-canvas-container.dragging {
  cursor: grabbing !important;
}

.pid-canvas {
  display: block;
  transition: background var(--transition-normal);
}

.connections-layer {
  pointer-events: none;
}

.components-layer {
  pointer-events: all;
}

.component-wrapper {
  transition: filter var(--transition-fast);
}

.component-wrapper.draggable {
  cursor: move;
}

.component-wrapper.draggable:hover {
  filter: brightness(1.05);
}

.component-wrapper.draggable:active {
  cursor: grabbing;
}

.component-wrapper.selected {
  filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.6));
}

.selection-indicator {
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}
</style>
