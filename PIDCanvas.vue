<template>
  <div 
    class="pid-canvas-container"
    @drop="handleDrop"
    @dragover.prevent="handleDragOver"
  >
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="pid-canvas"
      @mousedown="handleCanvasMouseDown"
    >
      <!-- Background -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E0E0E0" stroke-width="1" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" :fill="showGrid && isEditMode ? 'url(#grid)' : 'white'" />
      
      <!-- Connections -->
      <g class="connections-layer">
        <Pipe
          v-for="conn in connections"
          :key="conn.id"
          :fromPosition="getPortPosition(conn.from.componentId, conn.from.portId)"
          :toPosition="getPortPosition(conn.to.componentId, conn.to.portId)"
          :flowing="conn.flow?.active || false"
        />
      </g>
      
      <!-- Components -->
      <g class="components-layer">
        <g
          v-for="comp in components"
          :key="comp.id"
          class="component-wrapper"
          :class="{ 
            'selected': editorStore.selectedComponentId === comp.id,
            'draggable': isEditMode 
          }"
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
            @click="handleComponentClick(comp.id)"
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
            pointer-events="none"
            class="selection-indicator"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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
}>();

const editorStore = useEditorStore();
const diagramStore = useDiagramStore();
const svgRef = ref<SVGSVGElement>();

// Component mapping
const componentTypes: Record<string, any> = {
  valve: Valve,
  pump: Pump,
  tank: Tank,
  sensor: Sensor,
};

function getComponentType(type: string) {
  return componentTypes[type] || Valve;
}

// Drag state
const isDragging = ref(false);
const draggedComponentId = ref<string | null>(null);
const dragStart = ref<{ x: number; y: number } | null>(null);
const componentStartPos = ref<{ x: number; y: number } | null>(null);

// SVG coordinate conversion
function screenToSVG(clientX: number, clientY: number): Position {
  if (!svgRef.value) return { x: clientX, y: clientY };
  const pt = svgRef.value.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svgRef.value.getScreenCTM()!.inverse());
}

// Find component at position
function getComponentAtPosition(svgPos: Position): ComponentBase | null {
  // Check in reverse order (top components first)
  for (let i = props.components.length - 1; i >= 0; i--) {
    const comp = props.components[i];
    const bounds = getSelectionBounds(comp);
    
    if (
      svgPos.x >= bounds.x &&
      svgPos.x <= bounds.x + bounds.width &&
      svgPos.y >= bounds.y &&
      svgPos.y <= bounds.y + bounds.height
    ) {
      return comp;
    }
  }
  return null;
}

// Canvas mouse down
function handleCanvasMouseDown(event: MouseEvent) {
  if (!props.isEditMode) return;
  
  const svgPos = screenToSVG(event.clientX, event.clientY);
  const component = getComponentAtPosition(svgPos);
  
  if (component) {
    // Start potential drag
    draggedComponentId.value = component.id;
    dragStart.value = { x: event.clientX, y: event.clientY };
    componentStartPos.value = { ...component.position };
    
    // Select component
    editorStore.selectComponent(component.id);
    emit('componentClick', component.id);
    
    console.log('[PIDCanvas] Mouse down on component:', component.id);
  } else {
    // Clicked on empty canvas
    editorStore.clearSelection();
    draggedComponentId.value = null;
  }
}

// Global mouse move
function handleGlobalMouseMove(event: MouseEvent) {
  if (!draggedComponentId.value || !dragStart.value || !componentStartPos.value) return;
  
  // Calculate distance moved
  const dx = event.clientX - dragStart.value.x;
  const dy = event.clientY - dragStart.value.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Start dragging if moved more than 5 pixels
  if (!isDragging.value && distance > 5) {
    isDragging.value = true;
    console.log('[PIDCanvas] Started dragging:', draggedComponentId.value);
  }
  
  if (isDragging.value) {
    // Convert delta to SVG coordinates
    const startSVG = screenToSVG(dragStart.value.x, dragStart.value.y);
    const currentSVG = screenToSVG(event.clientX, event.clientY);
    
    const newPosition = {
      x: Math.round(componentStartPos.value.x + (currentSVG.x - startSVG.x)),
      y: Math.round(componentStartPos.value.y + (currentSVG.y - startSVG.y)),
    };
    
    // Update position in store
    diagramStore.updateComponentPosition(draggedComponentId.value, newPosition);
  }
}

// Global mouse up
function handleGlobalMouseUp() {
  if (isDragging.value) {
    console.log('[PIDCanvas] Stopped dragging:', draggedComponentId.value);
  }
  
  isDragging.value = false;
  draggedComponentId.value = null;
  dragStart.value = null;
  componentStartPos.value = null;
}

// Component click (from child component)
function handleComponentClick(componentId: string) {
  if (!isDragging.value) {
    editorStore.selectComponent(componentId);
    emit('componentClick', componentId);
    console.log('[PIDCanvas] Component clicked:', componentId);
  }
}

// Setup global listeners
onMounted(() => {
  document.addEventListener('mousemove', handleGlobalMouseMove);
  document.addEventListener('mouseup', handleGlobalMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('mouseup', handleGlobalMouseUp);
});

// Port position calculation
function getPortPosition(componentId: string, portId: string): Position {
  const component = props.components.find(c => c.id === componentId);
  if (!component) return { x: 0, y: 0 };
  
  const port = component.ports?.find(p => p.id === portId);
  if (!port) return component.position;
  
  const angle = (component.rotation || 0) * Math.PI / 180;
  return {
    x: component.position.x + port.position.x * Math.cos(angle) - port.position.y * Math.sin(angle),
    y: component.position.y + port.position.x * Math.sin(angle) + port.position.y * Math.cos(angle),
  };
}

// Component data getters
function getComponentState(id: string) { return props.componentStates?.[id]; }
function getComponentRPM(id: string) { return props.pumpRPM?.[id]; }
function getComponentLevel(id: string) { return props.tankLevels?.[id]; }
function getComponentValue(id: string) { return props.sensorValues?.[id]; }

// Selection bounds
function getSelectionBounds(component: ComponentBase) {
  const bounds: Record<string, any> = {
    valve: { width: 50, height: 34, offsetX: -5, offsetY: -5 },
    pump: { width: 50, height: 50, offsetX: -5, offsetY: -5 },
    tank: { width: 60, height: 130, offsetX: -5, offsetY: -5 },
    sensor: { width: 90, height: 70, offsetX: -5, offsetY: -5 },
  };
  const b = bounds[component.type] || { width: 60, height: 60, offsetX: -5, offsetY: -5 };
  return {
    x: component.position.x + b.offsetX,
    y: component.position.y + b.offsetY,
    width: b.width,
    height: b.height,
  };
}

// Palette drop handling
function handleDragOver(event: DragEvent) {
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (!props.isEditMode || !event.dataTransfer) return;
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'));
    const position = screenToSVG(event.clientX, event.clientY);
    
    const ports: Record<string, any[]> = {
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
    
    diagramStore.addComponent({
      id: '',
      type: data.type,
      position,
      rotation: 0,
      ports: ports[data.type] || [],
      config: data.defaultConfig || {},
      dataBindings: {},
    });
  } catch (error) {
    console.error('[PIDCanvas] Drop error:', error);
  }
}
</script>

<style scoped>
.pid-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: white;
}

.pid-canvas {
  display: block;
  cursor: default;
}

.component-wrapper.draggable {
  cursor: move;
}

.component-wrapper.selected {
  filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.6));
}

.selection-indicator {
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to { stroke-dashoffset: -10; }
}
</style>
