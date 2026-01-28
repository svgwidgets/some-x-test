export type SensorState = 
  | 'normal' 
  | 'warning-low'
  | 'warning-high'
  | 'alarm-low'
  | 'alarm-high'
  | 'fault';

export type SensorType = 
  | 'pressure'     // PT
  | 'temperature'  // TT
  | 'flow'         // FT
  | 'level';       // LT

export interface SensorConfig {
  sensorType?: SensorType;
  unit?: string;              // e.g., "bar", "°C", "L/min", "%"
  minValue?: number;          // e.g., 0
  maxValue?: number;          // e.g., 200
  warningLow?: number;        // e.g., 20
  warningHigh?: number;       // e.g., 180
  alarmLow?: number;          // e.g., 10
  alarmHigh?: number;         // e.g., 190
  precision?: number;         // Decimal places (e.g., 1 for 150.5)
  showLabel?: boolean;
  showUnit?: boolean;
}
