<script setup lang="ts">
import { ref } from 'vue';
import Valve from './Valve.vue';
import Pump from './Pump.vue';  // ADD THIS
import Pipe from './Pipe.vue';
import type { ComponentBase, Connection, Position } from '@/core/types';

interface Props {
  components: ComponentBase[];
  connections: Connection[];
  componentStates?: Record<string, string>;
  pumpRPM?: Record<string, number>;  // ADD THIS
  isEditMode?: boolean;
  width?: number;
  height?: number;
  debug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  width: 1200,
  height: 800,
  debug: false,
  componentStates: () => ({}),
  pumpRPM: () => ({}),  // ADD THIS
});

// Component type mapping
const componentTypes: Record<string, any> = {
  valve: Valve,
  pump: Pump,  // ADD THIS
};

function getComponentType(type: string) {
  return componentTypes[type] || Valve;
}

// ADD THIS FUNCTION
function getPumpRPM(componentId: string): number {
  return props.pumpRPM?.[componentId] || 0;
}

// ... rest stays the same
</script>

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
      
      <!-- Debug -->
      <g v-if="debug">
        <circle
          v-for="(comp, i) in components"
          :key="`debug-${i}`"
          :cx="comp.position.x"
          :cy="comp.position.y"
          r="5"
          fill="red"
          opacity="0.5"
        />
      </g>
      
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
        <component
          v-for="comp in components"
          :key="comp.id"
          :is="getComponentType(comp.type)"
          :component="comp"
          :state="getComponentState(comp.id)"
          :rpm="getPumpRPM(comp.id)"
          :isEditMode="isEditMode"
          :showPorts="isEditMode"
          @click="handleComponentClick"
          @command="handleComponentCommand"
          @portMouseDown="handlePortMouseDown"
        />
      </g>
    </svg>
  </div>
</template>

<!-- styles stay the same -->
