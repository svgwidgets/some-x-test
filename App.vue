<template>
  <div class="app">
    <div class="toolbar">
      <h2>P&ID System - Production Test</h2>
      <div class="controls">
        <button @click="isEditMode = !isEditMode">
          {{ isEditMode ? '→ Runtime Mode' : '→ Edit Mode' }}
        </button>
        <button @click="toggleValve('V-001')">Toggle V-001</button>
        <button @click="togglePump('P-001')">Toggle P-001</button>
        <button @click="toggleValve('V-002')">Toggle V-002</button>
        <button @click="toggleFlow">{{ flowActive ? 'Stop Flow' : 'Start Flow' }}</button>
        <button @click="saveDiagram">Save</button>
        <button @click="loadDiagram">Load</button>
        <button @click="debug = !debug">{{ debug ? 'Hide Debug' : 'Show Debug' }}</button>
      </div>
    </div>
    
    <PIDCanvas
      :components="components"
      :connections="connections"
      :componentStates="componentStates"
      :pumpRPM="pumpRPM"
      :isEditMode="isEditMode"
      :debug="debug"
      @componentClick="handleComponentClick"
      @componentCommand="handleComponentCommand"
    />
    
    <div class="sidebar">
      <h3>System State</h3>
      <div class="state-item">
        <strong>Mode:</strong> {{ isEditMode ? 'Edit' : 'Runtime' }}
      </div>
      <div class="state-item">
        <strong>V-001:</strong> 
        <span :class="`state-${componentStates['V-001']}`">
          {{ componentStates['V-001'] }}
        </span>
      </div>
      <div class="state-item">
        <strong>P-001:</strong>
        <span :class="`state-${componentStates['P-001']}`">
          {{ componentStates['P-001'] }}
        </span>
        <span v-if="pumpRPM['P-001'] > 0"> ({{ pumpRPM['P-001'] }} RPM)</span>
      </div>
      <div class="state-item">
        <strong>V-002:</strong>
        <span :class="`state-${componentStates['V-002']}`">
          {{ componentStates['V-002'] }}
        </span>
      </div>
      <div class="state-item">
        <strong>Flow:</strong> 
        <span :class="flowActive ? 'state-active' : 'state-inactive'">
          {{ flowActive ? 'Active' : 'Inactive' }}
        </span>
      </div>
      
      <h3>Components ({{ components.length }})</h3>
      <div v-for="comp in components" :key="comp.id" class="component-info">
        <strong>{{ comp.id }}</strong>
        <div>Type: {{ comp.type }}</div>
        <div>Position: ({{ comp.position.x }}, {{ comp.position.y }})</div>
        <div>Ports: {{ comp.ports.length }}</div>
      </div>
      
      <h3>Connections ({{ connections.length }})</h3>
      <div v-for="conn in connections" :key="conn.id" class="connection-info">
        <strong>{{ conn.id }}</strong>
        <div>{{ conn.from.componentId }}.{{ conn.from.portId }}</div>
        <div>→ {{ conn.to.componentId }}.{{ conn.to.portId }}</div>
        <div>Flow: {{ conn.flow?.active ? 'Active' : 'Inactive' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PIDCanvas from './components/PIDCanvas.vue';
import type { ComponentBase, Connection } from './core/types';

const isEditMode = ref(false);
const debug = ref(false);

const componentStates = ref<Record<string, string>>({
  'V-001': 'closed',
  'P-001': 'stopped',
  'V-002': 'closed',
});

const pumpRPM = ref<Record<string, number>>({
  'P-001': 0,
});

const flowActive = ref(false);

// Define components
const components = ref<ComponentBase[]>([
  {
    id: 'V-001',
    type: 'valve',
    position: { x: 150, y: 200 },
    rotation: 0,
    ports: [
      { id: 'inlet', type: 'inlet', position: { x: 0, y: 12 } },
      { id: 'outlet', type: 'outlet', position: { x: 40, y: 12 } },
    ],
    dataBindings: {
      state: 'plc1.valves.V001.state',
    },
  },
  {
    id: 'P-001',
    type: 'pump',
    position: { x: 300, y: 200 },
    rotation: 0,
    ports: [
      { id: 'inlet', type: 'inlet', position: { x: 0, y: 20 } },
      { id: 'outlet', type: 'outlet', position: { x: 40, y: 20 } },
    ],
    dataBindings: {
      state: 'plc1.pumps.P001.state',
    },
  },
  {
    id: 'V-002',
    type: 'valve',
    position: { x: 450, y: 200 },
    rotation: 0,
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
    to: { componentId: 'P-001', portId: 'inlet' },
    flow: {
      active: false,
      direction: 'forward',
      rate: 100,
    },
  },
  {
    id: 'PIPE-002',
    from: { componentId: 'P-001', portId: 'outlet' },
    to: { componentId: 'V-002', portId: 'inlet' },
    flow: {
      active: false,
      direction: 'forward',
      rate: 100,
    },
  },
]);

function toggleValve(valveId: string) {
  const current = componentStates.value[valveId];
  const newState = current === 'open' ? 'closed' : 'open';
  componentStates.value[valveId] = newState;
  console.log(`${valveId}: ${current} → ${newState}`);
}

function togglePump(pumpId: string) {
  const current = componentStates.value[pumpId];
  
  if (current === 'stopped') {
    componentStates.value[pumpId] = 'starting';
    console.log(`${pumpId}: stopped → starting`);
    
    setTimeout(() => {
      componentStates.value[pumpId] = 'running';
      pumpRPM.value[pumpId] = 3000;
      console.log(`${pumpId}: starting → running (3000 RPM)`);
    }, 1500);
  } else if (current === 'running') {
    componentStates.value[pumpId] = 'stopping';
    console.log(`${pumpId}: running → stopping`);
    
    setTimeout(() => {
      componentStates.value[pumpId] = 'stopped';
      pumpRPM.value[pumpId] = 0;
      console.log(`${pumpId}: stopping → stopped`);
    }, 2000);
  }
}

function toggleFlow() {
  flowActive.value = !flowActive.value;
  connections.value.forEach(conn => {
    conn.flow!.active = flowActive.value;
  });
  console.log(`Flow: ${flowActive.value ? 'Started' : 'Stopped'}`);
}

function handleComponentClick(componentId: string) {
  console.log('Component clicked:', componentId);
}

function handleComponentCommand(componentId: string, action: string) {
  console.log('Command:', componentId, action);
  componentStates.value[componentId] = action;
}

function saveDiagram() {
  const diagram = {
    components: components.value,
    connections: connections.value,
    componentStates: componentStates.value,
    pumpRPM: pumpRPM.value,
  };
  const json = JSON.stringify(diagram, null, 2);
  localStorage.setItem('pid-diagram', json);
  console.log('Saved:', json);
  alert('Diagram saved!');
}

function loadDiagram() {
  const json = localStorage.getItem('pid-diagram');
  if (json) {
    const diagram = JSON.parse(json);
    components.value = diagram.components;
    connections.value = diagram.connections;
    componentStates.value = diagram.componentStates || {};
    pumpRPM.value = diagram.pumpRPM || {};
    console.log('Loaded:', diagram);
    alert('Diagram loaded!');
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
  margin: 0;
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

.toolbar h2 {
  margin: 0;
  font-size: 18px;
}

.controls {
  display: flex;
  gap: 8px;
}

button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

button:hover {
  background: #2980b9;
}

.sidebar {
  padding: 15px;
  background: #ecf0f1;
  overflow-y: auto;
}

.sidebar h3 {
  margin: 20px 0 10px 0;
  font-size: 14px;
  color: #2c3e50;
  border-bottom: 2px solid #bdc3c7;
  padding-bottom: 5px;
}

.state-item,
.component-info,
.connection-info {
  margin: 8px 0;
  padding: 10px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
}

.state-item strong {
  display: inline-block;
  width: 80px;
}

.state-open { color: #4CAF50; font-weight: bold; }
.state-closed { color: #F44336; font-weight: bold; }
.state-running { color: #4CAF50; font-weight: bold; }
.state-stopped { color: #9E9E9E; font-weight: bold; }
.state-starting { color: #FFC107; font-weight: bold; }
.state-stopping { color: #FF9800; font-weight: bold; }
.state-active { color: #2196F3; font-weight: bold; }
.state-inactive { color: #9E9E9E; }

.component-info div,
.connection-info div {
  margin: 3px 0;
  color: #555;
}
</style>
