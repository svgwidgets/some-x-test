import { ref } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { useDiagramStore } from '@/stores/diagram';

/**
 * Composable for making components draggable
 */
export function useDraggable(svgElement: SVGSVGElement | null) {
  const editorStore = useEditorStore();
  const diagramStore = useDiagramStore();
  
  const draggedComponentId = ref<string | null>(null);
  const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });
  
  /**
   * Convert screen coordinates to SVG coordinates
   */
  function screenToSVG(screenX: number, screenY: number): { x: number; y: number } {
    if (!svgElement) return { x: screenX, y: screenY };
    
    const pt = svgElement.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    
    const svgP = pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
    return { x: svgP.x, y: svgP.y };
  }
  
  /**
   * Start dragging a component
   */
  function startDrag(componentId: string, event: MouseEvent) {
    // Only allow dragging in edit mode
    if (!editorStore.isEditMode) return;
    
    event.stopPropagation();
    
    // Get component
    const component = diagramStore.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Select component
    editorStore.selectComponent(componentId);
    
    // Get mouse position in SVG coordinates
    const mousePos = screenToSVG(event.clientX, event.clientY);
    
    // Calculate offset between mouse and component position
    dragOffset.value = {
      x: mousePos.x - component.position.x,
      y: mousePos.y - component.position.y,
    };
    
    draggedComponentId.value = componentId;
    editorStore.startDragging(mousePos);
    
    // Add global event listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    console.log(`[Draggable] Started dragging ${componentId}`);
  }
  
  /**
   * Handle drag movement
   */
  function handleDragMove(event: MouseEvent) {
    if (!draggedComponentId.value) return;
    
    // Get current mouse position in SVG coordinates
    const mousePos = screenToSVG(event.clientX, event.clientY);
    
    // Calculate new component position (mouse - offset)
    const newPosition = {
      x: Math.round(mousePos.x - dragOffset.value.x),
      y: Math.round(mousePos.y - dragOffset.value.y),
    };
    
    // Update component position in store
    diagramStore.updateComponentPosition(draggedComponentId.value, newPosition);
  }
  
  /**
   * End dragging
   */
  function handleDragEnd() {
    if (!draggedComponentId.value) return;
    
    console.log(`[Draggable] Stopped dragging ${draggedComponentId.value}`);
    
    draggedComponentId.value = null;
    dragOffset.value = { x: 0, y: 0 };
    editorStore.stopDragging();
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }
  
  return {
    startDrag,
  };
}
