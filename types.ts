export interface Connection {
  id: string;
  from: { componentId: string; portId: string };
  to: { componentId: string; portId: string };
  points?: Position[];
  routingType?: 'straight' | 'orthogonal' | 'curved' | 'auto';  // NEW
  flow?: {
    active: boolean;
    direction: 'forward' | 'reverse';
    rate?: number;
  };
}
