import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ComponentBase, Connection } from '@/core/types';

/**
 * Diagram Store
 * Manages diagram data: components, connections
 */

export const useDiagramStore = defineStore('diagram', () => {
  // State
  const components = ref<ComponentBase[]>([]);
  const connections = ref<Connection[]>([]);
  
  // Component counters for auto-ID generation
  const componentCounters = ref<Record<string, number>>({
    valve: 0,
    pump: 0,
    tank: 0,
    sensor: 0,
  });
  
  // Getters
  const componentCount = computed(() => components.value.length);
  const connectionCount = computed(() => connections.value.length);
  
  const getComponentById = computed(() => {
    return (id: string) => components.value.find(c => c.id === id);
  });
  
  // Actions
  
  /**
   * Generate unique component ID
   * Example: valve → V-001, V-002, etc.
   */
  function generateComponentId(type: string): string {
    const prefix = getComponentPrefix(type);
    componentCounters.value[type] = (componentCounters.value[type] || 0) + 1;
    const number = String(componentCounters.value[type]).padStart(3, '0');
    return `${prefix}-${number}`;
  }
  
  /**
   * Get component ID prefix based on type
   */
  function getComponentPrefix(type: string): string {
    const prefixes: Record<string, string> = {
      valve: 'V',
      pump: 'P',
      tank: 'TK',
      sensor: 'PT', // Default to pressure, can be changed
    };
    return prefixes[type] || type.toUpperCase();
  }
  
  /**
   * Add component to diagram
   */
  function addComponent(component: ComponentBase) {
    // Ensure unique ID
    if (!component.id) {
      component.id = generateComponentId(component.type);
    }
    
    components.value.push(component);
    console.log(`[Diagram] Added component: ${component.id}`, component);
    
    return component;
  }
  
  /**
   * Remove component from diagram
   */
  function removeComponent(componentId: string) {
    const index = components.value.findIndex(c => c.id === componentId);
    if (index !== -1) {
      const component = components.value[index];
      components.value.splice(index, 1);
      
      // Remove connected pipes
      connections.value = connections.value.filter(
        conn => conn.from.componentId !== componentId && conn.to.componentId !== componentId
      );
      
      console.log(`[Diagram] Removed component: ${componentId}`);
      return component;
    }
    return null;
  }
  
  /**
   * Update component position
   */
  function updateComponentPosition(componentId: string, position: { x: number; y: number }) {
    const component = components.value.find(c => c.id === componentId);
    if (component) {
      component.position = position;
      console.log(`[Diagram] Updated position for ${componentId}:`, position);
    }
  }
  
  /**
   * Update component properties
   */
  function updateComponent(componentId: string, updates: Partial<ComponentBase>) {
    const component = components.value.find(c => c.id === componentId);
    if (component) {
      Object.assign(component, updates);
      console.log(`[Diagram] Updated component ${componentId}:`, updates);
    }
  }
  
  /**
   * Add connection
   */
  function addConnection(connection: Connection) {
    connections.value.push(connection);
    console.log(`[Diagram] Added connection: ${connection.id}`, connection);
    return connection;
  }
  
  /**
   * Remove connection
   */
  function removeConnection(connectionId: string) {
    const index = connections.value.findIndex(c => c.id === connectionId);
    if (index !== -1) {
      const connection = connections.value[index];
      connections.value.splice(index, 1);
      console.log(`[Diagram] Removed connection: ${connectionId}`);
      return connection;
    }
    return null;
  }
  
  /**
   * Clear entire diagram
   */
  function clearDiagram() {
    components.value = [];
    connections.value = [];
    componentCounters.value = { valve: 0, pump: 0, tank: 0, sensor: 0 };
    console.log('[Diagram] Cleared all components and connections');
  }
  
  /**
   * Load diagram from JSON
   */
  function loadDiagram(data: { components: ComponentBase[]; connections: Connection[] }) {
    components.value = data.components;
    connections.value = data.connections;
    
    // Update counters based on loaded components
    componentCounters.value = { valve: 0, pump: 0, tank: 0, sensor: 0 };
    data.components.forEach(comp => {
      const match = comp.id.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > (componentCounters.value[comp.type] || 0)) {
          componentCounters.value[comp.type] = num;
        }
      }
    });
    
    console.log('[Diagram] Loaded diagram:', data);
  }
  
  /**
   * Export diagram to JSON
   */
  function exportDiagram() {
    return {
      components: components.value,
      connections: connections.value,
    };
  }
  
  return {
    // State
    components,
    connections,
    componentCounters,
    
    // Getters
    componentCount,
    connectionCount,
    getComponentById,
    
    // Actions
    generateComponentId,
    addComponent,
    removeComponent,
    updateComponentPosition,
    updateComponent,
    addConnection,
    removeConnection,
    clearDiagram,
    loadDiagram,
    exportDiagram,
  };
});
