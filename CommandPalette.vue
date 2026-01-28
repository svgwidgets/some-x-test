<template>
  <aside class="component-palette" v-show="editorStore.isEditMode">
    <div class="palette-header">
      <h3>Components</h3>
      <span class="palette-subtitle">Drag to canvas</span>
    </div>
    
    <div class="palette-content">
      <div class="palette-section">
        <h4 class="section-title">Control Elements</h4>
        <div class="palette-items">
          <div
            v-for="item in controlItems"
            :key="item.id"
            class="palette-item"
            :draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragend="handleDragEnd"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-info">
              <div class="item-label">{{ item.label }}</div>
              <div class="item-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="palette-section">
        <h4 class="section-title">Equipment</h4>
        <div class="palette-items">
          <div
            v-for="item in equipmentItems"
            :key="item.id"
            class="palette-item"
            :draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragend="handleDragEnd"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-info">
              <div class="item-label">{{ item.label }}</div>
              <div class="item-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="palette-section">
        <h4 class="section-title">Instrumentation</h4>
        <div class="palette-items">
          <div
            v-for="item in instrumentationItems"
            :key="item.id"
            class="palette-item"
            :draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragend="handleDragEnd"
          >
            <div class="item-icon item-icon-text">{{ item.icon }}</div>
            <div class="item-info">
              <div class="item-label">{{ item.label }}</div>
              <div class="item-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { PALETTE_ITEMS, type PaletteItem } from '@/types/palette';

const editorStore = useEditorStore();

// Categorize items
const controlItems = computed(() => 
  PALETTE_ITEMS.filter(item => item.category === 'Control')
);

const equipmentItems = computed(() => 
  PALETTE_ITEMS.filter(item => item.category === 'Equipment' || item.category === 'Storage')
);

const instrumentationItems = computed(() => 
  PALETTE_ITEMS.filter(item => item.category === 'Instrumentation')
);

// Drag and drop handlers
function handleDragStart(event: DragEvent, item: PaletteItem) {
  if (!event.dataTransfer) return;
  
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/json', JSON.stringify(item));
  
  // Visual feedback
  const target = event.target as HTMLElement;
  target.classList.add('dragging');
  
  console.log('[Palette] Drag started:', item.label);
}

function handleDragEnd(event: DragEvent) {
  const target = event.target as HTMLElement;
  target.classList.remove('dragging');
  console.log('[Palette] Drag ended');
}
</script>

<style scoped>
.component-palette {
  width: 280px;
  background: white;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.palette-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
}

.palette-header h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.palette-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.palette-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.palette-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  margin: 0 0 var(--spacing-sm) 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.palette-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.palette-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-fast);
}

.palette-item:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateX(2px);
}

.palette-item:active {
  cursor: grabbing;
}

.palette-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.item-icon-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.item-description {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Scrollbar styling */
.palette-content::-webkit-scrollbar {
  width: 6px;
}

.palette-content::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

.palette-content::-webkit-scrollbar-thumb {
  background: var(--color-border-medium);
  border-radius: 3px;
}

.palette-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-dark);
}
</style>
