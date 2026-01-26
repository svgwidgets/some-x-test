<template>
  <div class="app">
    <div class="toolbar">
      <h2>P&ID System - Production Test</h2>
      <div class="controls">
        <button @click="isEditMode = !isEditMode">
          {{ isEditMode ? 'Runtime Mode' : 'Edit Mode' }}
        </button>
        <button @click="toggleValve('V-001')">Toggle V-001</button>
        <button @click="toggleValve('V-002')">Toggle V-002</button>
        <button @click="toggleFlow">Toggle Flow</button>
        <button @click="saveDiagram">Save Diagram</button>
        <button @click="loadDiagram">Load Diagram</button>
      </div>
    </div>
    
    <PIDCanvas
      :components="components"
      :connections="connections"
      :isEditMode="isEditMode"
      @componentClick="handleComponentClick"
      @componentCommand="handleComponentCommand"
    />
    
    <div class="sidebar">
      <h3>System State</h3>
      <div class="state-item">
        <strong>Mode:</strong> {{ isEditMode ? 'Edit' : 'Runtime' }}
      </div>
      <div class="state-item">
        <strong>V-001:</strong> {{ componentStates['V-001'] || 'closed' }}
      </div>
      <div class="state-item">
        <strong>V-002:</strong> {{ componentStates['V-002'] || 'closed' }}
      </div>
      <div class="state-item">
        <strong>Flow:</strong> {{ flowActive ? 'Active' : 'Inactive' }}
      </div>
      
      <h3>Diagram Data</h3>
      <pre>{{ JSON.stringify(diagramData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PIDCanvas from './components/PIDCanvas.vue';
import type { ComponentBase, Connection, Diagram } from './core/types';

const isEditMode = ref(false);
const componentStates = ref<Record<string, string>>({
  'V-001': 'closed',
  'V-002': 'closed',
});
const flowActive = ref(false);

// Define components
const components = ref<ComponentBase[]>([
  {
    id: 'V-001',
    type: 'valve',
    position: { x: 100, y: 200 },
    ports: [
      { id: 'inlet', type: 'inlet', position: { x: 0, y: 12 } },
      { id: 'outlet', type: 'outlet', position: { x: 40, y: 12 } },
    ],
    dataBindings: {
      state: 'plc1.valves.V001.state',
    },
  },
  {
    id: 'V-002',
    type: 'valve',
    position: { x: 300, y: 200 },
    ports: [
      { id: 'inlet', type: 'inlet', position: { x: 0, y: 12 } },
      { id: 'outlet', type: 'outlet', position: { x: 40, y: 12 } },
    ],
    dataBindings: {
      state: 'plc1.valves.V002.state',
    },
  },
]);

// Define connections
const connections = ref<Connection[]>([
  {
    id: 'PIPE-001',
    from: { componentId: 'V-001', portId: 'outlet' },
    to: { componentId: 'V-002', portId: 'inlet' },
    flow: {
      active: flowActive.value,
      direction: 'forward',
      rate: 100,
    },
  },
]);

// Diagram data (for save/load)
const diagramData = computed<Diagram>(() => ({
  id: 'TEST-001',
  name: 'Test Diagram',
  version: '1.0',
  components: components.value,
  connections: connections.value,
  metadata: {
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    author: 'Engineer',
  },
}));

function toggleValve(valveId: string) {
  const current = componentStates.value[valveId] || 'closed';
  componentStates.value[valveId] = current === 'open' ? 'closed' : 'open';
}

function toggleFlow() {
  flowActive.value = !flowActive.value;
  connections.value[0].flow!.active = flowActive.value;
}

function handleComponentClick(componentId: string) {
  console.log('Component clicked:', componentId);
}

function handleComponentCommand(componentId: string, action: string) {
  console.log('Command:', componentId, action);
  componentStates.value[componentId] = action === 'open' ? 'open' : 'closed';
}

function saveDiagram() {
  const json = JSON.stringify(diagramData.value, null, 2);
  localStorage.setItem('pid-diagram', json);
  console.log('Diagram saved:', json);
  alert('Diagram saved to localStorage');
}

function loadDiagram() {
  const json = localStorage.getItem('pid-diagram');
  if (json) {
    const diagram: Diagram = JSON.parse(json);
    components.value = diagram.components;
    connections.value = diagram.connections;
    console.log('Diagram loaded:', diagram);
    alert('Diagram loaded from localStorage');
  } else {
    alert('No saved diagram found');
  }
}
</script>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.toolbar {
  grid-column: 1 / -1;
  padding: 15px;
  background: #2c3e50;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls {
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2980b9;
}

.sidebar {
  padding: 20px;
  background: #ecf0f1;
  overflow-y: auto;
}

.state-item {
  margin: 10px 0;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
}
</style>
