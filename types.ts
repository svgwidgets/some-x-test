// Base types for ALL components
export interface Position {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  type: 'inlet' | 'outlet' | 'bidirectional';
  position: Position;  // Relative to component origin
  connected?: string;  // Pipe ID
}

export interface ComponentBase {
  id: string;
  type: string;
  position: Position;
  rotation?: number;
  ports: Port[];
  dataBindings?: DataBindings;
  config?: Record<string, any>;
}

export interface DataBindings {
  state?: string;      // e.g., "plc1.valves.V001.state"
  value?: string;      // e.g., "plc1.sensors.PT001.value"
  command?: string;    // e.g., "plc1.valves.V001.command"
  [key: string]: string | undefined;
}

export interface Connection {
  id: string;
  from: {
    componentId: string;
    portId: string;
  };
  to: {
    componentId: string;
    portId: string;
  };
  points?: Position[];  // Optional intermediate points for routing
  flow?: {
    active: boolean;
    direction: 'forward' | 'reverse';
    rate?: number;
  };
}

export interface Diagram {
  id: string;
  name: string;
  version: string;
  components: ComponentBase[];
  connections: Connection[];
  metadata: {
    created: string;
    modified: string;
    author: string;
  };
}
