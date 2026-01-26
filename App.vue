<template>
  <div class="app">
    <div class="toolbar">
      <h2>P&ID System - Dynamic Editor</h2>
      <div class="controls">
        <button @click="isEditMode = !isEditMode" :class="{ active: isEditMode }">
          {{ isEditMode ? '✏️ Edit Mode' : '▶️ Runtime Mode' }}
        </button>
        <button @click="addComponentAtCenter('valve')" v-if="isEditMode">
          ➕ Add Valve
        </button>
        <button @click="deleteSelected" v-if="isEditMode && selectedComponent" class="danger">
          🗑️ Delete
        </button>
        <button @click="clearDiagram" v-if="isEditMode" class="danger">
          Clear All
        </button>
        <button @click="saveDiagram">💾 Save</button>
        <button @click="loadDiagram">📂 Load</button>
      </div>
    </div>
    
    <div class="main-content" :class="{ 'runtime-mode': !isEditMode }">
      <ComponentPalette
        v-if="isEditMode"
        @addComponent="addComponentAtCenter"
      />
      
       <PIDCanvas
        :components="components"
        :connections="connections"
        :componentStates="componentStates"
        :isEditMode="isEditMode"
        :isDrawingConnection="isDrawingConnection"
        :selectedComponent="selectedComponent"
        @componentClick="selectComponent"
        @componentMouseDown="startDrag"
        @portMouseDown="handlePortMouseDown"
        @connectionClick="handleConnectionClick"
        @canvasClick="handleCanvasClick"
        @componentDrop="handleComponentDrop"
      />
      
      <div class="sidebar">
        <h3>{{ isEditMode ? 'Editor' : 'Runtime' }}</h3>
        
        <div v-if="selectedComponent" class="selected-info">
          <h4>Selected: {{ selectedComponent }}</h4>
          <button @click="deleteSelected" class="danger small">Delete</button>
        </div>
        
        <div class="state-section">
          <h4>Component States</h4>
          <div v-for="comp in components" :key="comp.id" class="state-item">
            <strong>{{ comp.id }}:</strong>
            <select v-model="componentStates[comp.id]" v-if="!isEditMode">
              <option value="closed">Closed</option>
              <option value="open">Open</option>
              <option value="transitioning">Transitioning</option>
              <option value="error">Error</option>
            </select>
            <span v-else :class="`state-${componentStates[comp.id]}`">
              {{ componentStates[comp.id] || 'closed' }}
            </span>
          </div>
        </div>
        
        <div class="stats">
          <h4>Diagram Stats</h4>
          <div>Components: {{ components.length }}</div>
          <div>Connections: {{ connections.length }}</div>
          <div>Mode: {{ isEditMode ? 'Edit' : 'Runtime' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import PIDCanvas from './components/PIDCanvas.vue';
import ComponentPalette from './components/ComponentPalette.vue';
import { useDiagramEditor } from './composables/useDiagramEditor';
import type { Position } from './core/types';

const isEditMode = ref(true);
const componentStates = ref<Record<string, string>>({});

const {
  components,
  connections,
  selectedComponent,
  isDrawingConnection,
  connectionStart,
  addComponent,
  removeComponent,
  moveComponent,
  startConnection,
  completeConnection,
  cancelConnection,
  removeConnection,
  selectComponent,
  clearDiagram: clearDiagramFn,
} = useDiagramEditor();

// Enhanced drag state
const isDragging = ref(false);
const dragComponentId = ref<string | null>(null);
const dragStartMousePos = ref<Position>({ x: 0, y: 0 });
const dragStartComponentPos = ref<Position>({ x: 0, y: 0 });

function addComponentAtCenter(type: string) {
  const centerX = 600;
  const centerY = 400;
  const offset = components.value.length * 30;
  
  const newComp = addComponent(type, { 
    x: centerX + offset, 
    y: centerY 
  });
  
  componentStates.value[newComp.id] = 'closed';
}

function deleteSelected() {
  if (selectedComponent.value) {
    delete componentStates.value[selectedComponent.value];
    removeComponent(selectedComponent.value);
  }
}

function clearDiagram() {
  if (confirm('Clear all components and connections?')) {
    clearDiagramFn();
    componentStates.value = {};
  }
}

function handleCanvasClick(position: Position) {
  if (isDrawingConnection.value) {
    cancelConnection();
  } else {
    selectComponent(null);
  }
}

function handleConnectionClick(connectionId: string) {
  if (isEditMode.value && confirm('Delete this connection?')) {
    removeConnection(connectionId);
  }
}

function handlePortMouseDown(componentId: string, portId: string) {
  if (!isEditMode.value) return;
  
  if (isDrawingConnection.value) {
    // Complete connection
    completeConnection(componentId, portId);
  } else {
    // Start connection
    startConnection(componentId, portId);
  }
}

function startDrag(componentId: string, event: MouseEvent) {
  if (!isEditMode.value) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const component = components.value.find(c => c.id === componentId);
  if (!component) return;
  
  isDragging.value = true;
  dragComponentId.value = componentId;
  dragStartMousePos.value = { x: event.clientX, y: event.clientY };
  dragStartComponentPos.value = { ...component.position };
  
  selectComponent(componentId);
  
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
}
function handleDragMove(event: MouseEvent) {
  if (!isDragging.value || !dragComponentId.value) return;
  
  const component = components.value.find(c => c.id === dragComponentId.value);
  if (!component) return;
  
  // Calculate movement delta
  const dx = event.clientX - dragStartMousePos.value.x;
  const dy = event.clientY - dragStartMousePos.value.y;
  
  // Update component position
  component.position = {
    x: dragStartComponentPos.value.x + dx,
    y: dragStartComponentPos.value.y + dy,
  };
}

function handleDragEnd(event: MouseEvent) {
  isDragging.value = false;
  dragComponentId.value = null;
  
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
}

function handleComponentDrop(type: string, position: Position) {
  const newComp = addComponent(type, position);
  componentStates.value[newComp.id] = 'closed';
}

function saveDiagram() {
  const diagram = {
    components: components.value,
    connections: connections.value,
    componentStates: componentStates.value,
  };
  localStorage.setItem('pid-diagram', JSON.stringify(diagram));
  alert('Diagram saved!');
}

function loadDiagram() {
  const saved = localStorage.getItem('pid-diagram');
  if (saved) {
    const diagram = JSON.parse(saved);
    components.value = diagram.components;
    connections.value = diagram.connections;
    componentStates.value = diagram.componentStates || {};
    alert('Diagram loaded!');
  }
}

// Initialize with sample data
if (components.value.length === 0) {
  const v1 = addComponent('valve', { x: 200, y: 200 });
  const v2 = addComponent('valve', { x: 400, y: 200 });
  componentStates.value[v1.id] = 'closed';
  componentStates.value[v2.id] = 'closed';
}
</script>

<style scoped>
.app {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.toolbar {
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

button.active {
  background: #27ae60;
}

button.danger {
  background: #e74c3c;
}

button.danger:hover {
  background: #c0392b;
}

button.small {
  padding: 4px 8px;
  font-size: 11px;
}

.main-content {
  display: grid;
  grid-template-columns: auto 1fr 300px;
  height: 100%;
  overflow: hidden;
}

  .main-content.runtime-mode {
  grid-template-columns: 1fr 300px; /* No palette column */
}

.sidebar {
  padding: 15px;
  background: #ecf0f1;
  overflow-y: auto;
}

.sidebar h3, .sidebar h4 {
  margin: 15px 0 8px 0;
  font-size: 14px;
}

.selected-info {
  padding: 10px;
  background: #3498db;
  color: white;
  border-radius: 4px;
  margin-bottom: 15px;
}

.state-section, .stats {
  margin: 15px 0;
}

.state-item {
  padding: 8px;
  background: white;
  margin: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

select {
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.state-open { color: #27ae60; font-weight: bold; }
.state-closed { color: #e74c3c; font-weight: bold; }
.state-transitioning { color: #f39c12; font-weight: bold; }
.state-error { color: #c0392b; font-weight: bold; }

.stats div {
  padding: 5px 0;
  font-size: 12px;
}
</style>
