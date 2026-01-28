import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Runtime Store
 * Manages runtime data: component states, sensor values, etc.
 */

export const useRuntimeStore = defineStore('runtime', () => {
  // State maps
  const componentStates = ref<Record<string, string>>({});
  const pumpRPM = ref<Record<string, number>>({});
  const tankLevels = ref<Record<string, number>>({});
  const sensorValues = ref<Record<string, number>>({});
  
  // Actions
  
  /**
   * Initialize component with default state when added to diagram
   */
  function initializeComponentState(componentId: string, componentType: string) {
    // Set default state based on component type
    switch (componentType) {
      case 'valve':
        componentStates.value[componentId] = 'closed';
        break;
      
      case 'pump':
        componentStates.value[componentId] = 'stopped';
        pumpRPM.value[componentId] = 0;
        break;
      
      case 'tank':
        tankLevels.value[componentId] = 0; // Empty tank
        break;
      
      case 'sensor':
        sensorValues.value[componentId] = 0;
        break;
    }
    
    console.log(`[Runtime] Initialized state for ${componentId} (${componentType})`);
  }
  
  /**
   * Remove component state when component is deleted
   */
  function removeComponentState(componentId: string) {
    delete componentStates.value[componentId];
    delete pumpRPM.value[componentId];
    delete tankLevels.value[componentId];
    delete sensorValues.value[componentId];
    console.log(`[Runtime] Removed state for ${componentId}`);
  }
  
  /**
   * Update component state
   */
  function updateComponentState(componentId: string, state: string) {
    componentStates.value[componentId] = state;
    console.log(`[Runtime] ${componentId} state: ${state}`);
  }
  
  /**
   * Update pump RPM
   */
  function updatePumpRPM(pumpId: string, rpm: number) {
    pumpRPM.value[pumpId] = rpm;
    console.log(`[Runtime] ${pumpId} RPM: ${rpm}`);
  }
  
  /**
   * Update tank level
   */
  function updateTankLevel(tankId: string, level: number) {
    tankLevels.value[tankId] = level;
    console.log(`[Runtime] ${tankId} level: ${level}%`);
  }
  
  /**
   * Update sensor value
   */
  function updateSensorValue(sensorId: string, value: number) {
    sensorValues.value[sensorId] = value;
    console.log(`[Runtime] ${sensorId} value: ${value}`);
  }
  
  /**
   * Clear all runtime state
   */
  function clearAllState() {
    componentStates.value = {};
    pumpRPM.value = {};
    tankLevels.value = {};
    sensorValues.value = {};
    console.log('[Runtime] Cleared all state');
  }
  
  return {
    // State
    componentStates,
    pumpRPM,
    tankLevels,
    sensorValues,
    
    // Actions
    initializeComponentState,
    removeComponentState,
    updateComponentState,
    updatePumpRPM,
    updateTankLevel,
    updateSensorValue,
    clearAllState,
  };
});
