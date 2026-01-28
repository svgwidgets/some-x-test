<template>
  <div class="app">
    <Toolbar />
    
    <div class="main-content" :class="{ 'runtime-mode': editorStore.isRuntimeMode }">
      <!-- Palette: Only in edit mode -->
      <ComponentPalette v-if="editorStore.isEditMode" />
      
      <!-- Canvas: Always visible -->
      <PIDCanvas
        :components="diagramStore.components"
        :connections="diagramStore.connections"
        :componentStates="runtimeStore.componentStates"
        :pumpRPM="runtimeStore.pumpRPM"
        :tankLevels="runtimeStore.tankLevels"
        :sensorValues="runtimeStore.sensorValues"
        :isEditMode="editorStore.isEditMode"
        :showGrid="editorStore.showGrid"
        @componentClick="handleComponentClick"
        @componentCommand="handleComponentCommand"
      />
      
      <!-- Sidebar: Conditional visibility -->
      <aside 
        class="sidebar" 
        v-show="editorStore.isEditMode || editorStore.hasSelection"
      >
        <h3>{{ editorStore.isEditMode ? 'Properties' : 'Component Info' }}</h3>
        
        <!-- System State Section -->
        <div class="sidebar-section">
          <h4>System State</h4>
          <div class="state-item">
            <strong>Mode:</strong>
            <span :class="editorStore.isEditMode ? 'mode-edit' : 'mode-runtime'">
              {{ editorStore.isEditMode ? 'Edit' : 'Runtime' }}
            </span>
          </div>
          
          <!-- Component states -->
          <div 
            v-for="comp in diagramStore.components" 
            :key="comp.id" 
            class="state-item"
          >
            <strong>{{ comp.id }}:</strong>
            <span :class="getStateClass(comp)">
              {{ getStateDisplay(comp) }}
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { useDiagramStore } from '@/stores/diagram';
import { useRuntimeStore } from '@/stores/runtime';
import Toolbar from './components/editor/Toolbar.vue';
import ComponentPalette from './components/editor/ComponentPalette.vue';
import PIDCanvas from './components/PIDCanvas.vue';
import type { ComponentBase } from './core/types';

const editorStore = useEditorStore();
const diagramStore = useDiagramStore();
const runtimeStore = useRuntimeStore();

function handleComponentClick(componentId: string) {
  console.log('Component clicked:', componentId);
  editorStore.selectComponent(componentId);
}

function handleComponentCommand(componentId: string, action: string) {
  console.log('Command:', componentId, action);
}

// Helper functions for state display
function getStateClass(component: ComponentBase): string {
  const state = runtimeStore.componentStates[component.id];
  
  switch (component.type) {
    case 'valve':
      return state === 'open' ? 'state-open' : 'state-closed';
    case 'pump':
      return `state-${state}`;
    case 'tank':
      const level = runtimeStore.tankLevels[component.id] || 0;
      if (level >= 95) return 'state-tank-alarm-high';
      if (level <= 10) return 'state-tank-alarm-low';
      return 'state-tank-normal';
    case 'sensor':
      return 'state-sensor-normal';
    default:
      return '';
  }
}

function getStateDisplay(component: ComponentBase): string {
  switch (component.type) {
    case 'valve':
    case 'pump':
      return runtimeStore.componentStates[component.id] || 'unknown';
    
    case 'tank':
      const level = runtimeStore.tankLevels[component.id] || 0;
      return `${level}%`;
    
    case 'sensor':
      const value = runtimeStore.sensorValues[component.id] || 0;
      const unit = component.config?.unit || '';
      return `${value.toFixed(1)} ${unit}`;
    
    default:
      return 'unknown';
  }
}
</script>

<style scoped>
.app {
  display: grid;
  grid-template-rows: 60px 1fr;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Edit mode: 3 columns (Palette | Canvas | Sidebar) */
.main-content {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  height: 100%;
  overflow: hidden;
  transition: grid-template-columns var(--transition-normal);
}

/* Runtime mode: 2 columns (Canvas | Sidebar - conditional) */
.main-content.runtime-mode {
  grid-template-columns: 1fr 320px;
}

/* Hide sidebar completely if no selection in runtime mode */
.main-content.runtime-mode .sidebar {
  display: none;
}

/* Show sidebar when there's a selection */
.main-content.runtime-mode .sidebar[style*="display: block"] {
  display: block;
}

.sidebar {
  padding: var(--spacing-lg);
  background: var(--color-bg-tertiary);
  border-left: 1px solid var(--color-border-light);
  overflow-y: auto;
}

.sidebar h3 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border-light);
}

.sidebar-section {
  margin-bottom: var(--spacing-xl);
}

.sidebar-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.state-item {
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-md);
  font-size: 13px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.state-item:hover {
  box-shadow: var(--shadow-md);
}

.state-item strong {
  display: inline-block;
  min-width: 80px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* Mode styles */
.mode-edit {
  color: var(--color-primary);
  font-weight: 600;
}

.mode-runtime {
  color: var(--color-secondary);
  font-weight: 600;
}

/* Component state styles */
.state-open {
  color: #4CAF50;
  font-weight: 600;
}

.state-closed {
  color: #F44336;
  font-weight: 600;
}

.state-running {
  color: #4CAF50;
  font-weight: 600;
}

.state-stopped {
  color: #9E9E9E;
  font-weight: 600;
}

.state-starting {
  color: #FFC107;
  font-weight: 600;
}

.state-stopping {
  color: #FF9800;
  font-weight: 600;
}

.state-tank-normal {
  color: #2196F3;
  font-weight: 600;
}

.state-tank-alarm-low,
.state-tank-alarm-high {
  color: #F44336;
  font-weight: 600;
  animation: blink-alarm 1s infinite;
}

.state-sensor-normal {
  color: #2E7D32;
  font-weight: 600;
}

@keyframes blink-alarm {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.3; }
}
</style>
