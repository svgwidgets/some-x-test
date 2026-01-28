/**
 * Component Palette Item Definition
 */

export interface PaletteItem {
  id: string;
  type: 'valve' | 'pump' | 'tank' | 'sensor';
  label: string;
  description: string;
  icon: string; // Emoji or icon identifier
  category: string;
  defaultConfig?: Record<string, any>;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  {
    id: 'valve',
    type: 'valve',
    label: 'Valve',
    description: 'Control valve for flow regulation',
    icon: '◇',
    category: 'Control',
    defaultConfig: {
      valveType: 'ax',
      controllable: true,
    },
  },
  {
    id: 'pump',
    type: 'pump',
    label: 'Pump',
    description: 'Centrifugal pump for fluid transfer',
    icon: '⊚',
    category: 'Equipment',
    defaultConfig: {
      pumpType: 'centrifugal',
      ratedRPM: 3600,
    },
  },
  {
    id: 'tank',
    type: 'tank',
    label: 'Tank',
    description: 'Storage tank for liquid containment',
    icon: '▭',
    category: 'Storage',
    defaultConfig: {
      tankType: 'vertical',
      capacity: 5000,
      capacityUnit: 'L',
    },
  },
  {
    id: 'sensor-pressure',
    type: 'sensor',
    label: 'Pressure Sensor',
    description: 'Pressure transmitter (PT)',
    icon: 'PT',
    category: 'Instrumentation',
    defaultConfig: {
      sensorType: 'pressure',
      unit: 'bar',
      precision: 1,
      minValue: 0,
      maxValue: 200,
    },
  },
  {
    id: 'sensor-temperature',
    type: 'sensor',
    label: 'Temperature Sensor',
    description: 'Temperature transmitter (TT)',
    icon: 'TT',
    category: 'Instrumentation',
    defaultConfig: {
      sensorType: 'temperature',
      unit: '°C',
      precision: 1,
      minValue: 0,
      maxValue: 150,
    },
  },
];
