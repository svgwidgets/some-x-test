import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Editor Store
 * Manages editor-specific state: mode, selection, UI state
 */

export type EditorMode = 'edit' | 'runtime';

export const useEditorStore = defineStore('editor', () => {
  // State
  const mode = ref<EditorMode>('edit');
  const selectedComponentId = ref<string | null>(null);
  const isDrawingConnection = ref(false);
  const showGrid = ref(true);
  
  // Getters
  const isEditMode = computed(() => mode.value === 'edit');
  const isRuntimeMode = computed(() => mode.value === 'runtime');
  const hasSelection = computed(() => selectedComponentId.value !== null);
  
  // Actions
  function setMode(newMode: EditorMode) {
    mode.value = newMode;
    
    // Clear selection when switching to runtime
    if (newMode === 'runtime') {
      clearSelection();
    }
    
    console.log(`[Editor] Mode changed to: ${newMode}`);
  }
  
  function toggleMode() {
    setMode(mode.value === 'edit' ? 'runtime' : 'edit');
  }
  
  function selectComponent(componentId: string | null) {
    selectedComponentId.value = componentId;
    console.log(`[Editor] Component selected: ${componentId}`);
  }
  
  function clearSelection() {
    selectedComponentId.value = null;
    console.log('[Editor] Selection cleared');
  }
  
  function startDrawingConnection() {
    isDrawingConnection.value = true;
    console.log('[Editor] Started drawing connection');
  }
  
  function stopDrawingConnection() {
    isDrawingConnection.value = false;
    console.log('[Editor] Stopped drawing connection');
  }
  
  function toggleGrid() {
    showGrid.value = !showGrid.value;
    console.log(`[Editor] Grid: ${showGrid.value ? 'ON' : 'OFF'}`);
  }
  
  // Reset editor state
  function reset() {
    mode.value = 'edit';
    selectedComponentId.value = null;
    isDrawingConnection.value = false;
    showGrid.value = true;
    console.log('[Editor] Reset to initial state');
  }
  
  return {
    // State
    mode,
    selectedComponentId,
    isDrawingConnection,
    showGrid,
    
    // Getters
    isEditMode,
    isRuntimeMode,
    hasSelection,
    
    // Actions
    setMode,
    toggleMode,
    selectComponent,
    clearSelection,
    startDrawingConnection,
    stopDrawingConnection,
    toggleGrid,
    reset,
  };
});
