<template>
  <header class="toolbar">
    <div class="toolbar-section toolbar-left">
      <div class="app-title">
        <h1>P&ID Editor</h1>
        <span class="app-version">v1.0</span>
      </div>
      
      <div class="mode-indicator">
        <span class="mode-badge" :class="modeClass">
          <span class="mode-icon">{{ modeIcon }}</span>
          <span class="mode-label">{{ modeLabel }}</span>
        </span>
      </div>
    </div>
    
    <div class="toolbar-section toolbar-center">
      <!-- Future: Save, Load, Undo, Redo buttons will go here -->
    </div>
    
    <div class="toolbar-section toolbar-right">
      <button 
        @click="handleToggleMode"
        class="btn-mode-toggle"
        :class="modeClass"
        :title="toggleTooltip"
      >
        <span class="btn-icon">{{ toggleIcon }}</span>
        <span class="btn-label">{{ toggleLabel }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();

// Computed properties for mode display
const modeClass = computed(() => editorStore.isEditMode ? 'mode-edit' : 'mode-runtime');

const modeIcon = computed(() => editorStore.isEditMode ? '✏️' : '▶️');

const modeLabel = computed(() => editorStore.isEditMode ? 'Edit Mode' : 'Runtime Mode');

const toggleIcon = computed(() => editorStore.isEditMode ? '▶️' : '✏️');

const toggleLabel = computed(() => 
  editorStore.isEditMode ? 'Switch to Runtime' : 'Switch to Edit'
);

const toggleTooltip = computed(() => 
  editorStore.isEditMode 
    ? 'Switch to Runtime Mode (View & Control)' 
    : 'Switch to Edit Mode (Design & Configure)'
);

// Actions
function handleToggleMode() {
  editorStore.toggleMode();
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 var(--spacing-xl);
  background: var(--color-bg-dark);
  color: white;
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

/* App title */
.app-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.app-title h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.app-version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

/* Mode indicator */
.mode-indicator {
  margin-left: var(--spacing-md);
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-normal);
}

.mode-badge.mode-edit {
  background: rgba(25, 118, 210, 0.2);
  color: #64B5F6;
  border: 1px solid rgba(25, 118, 210, 0.3);
}

.mode-badge.mode-runtime {
  background: rgba(56, 142, 60, 0.2);
  color: #81C784;
  border: 1px solid rgba(56, 142, 60, 0.3);
}

.mode-icon {
  font-size: 14px;
}

.mode-label {
  letter-spacing: 0.3px;
}

/* Mode toggle button */
.btn-mode-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.btn-mode-toggle.mode-edit {
  background: var(--color-secondary);
  color: white;
}

.btn-mode-toggle.mode-edit:hover {
  background: var(--color-secondary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-mode-toggle.mode-runtime {
  background: var(--color-primary);
  color: white;
}

.btn-mode-toggle.mode-runtime:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-mode-toggle:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 16px;
}

.btn-label {
  letter-spacing: 0.3px;
}
</style>
