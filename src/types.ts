export type Standard =
  | "USB PD 3.1 EPR"
  | "USB PD 3.0 PPS"
  | "USB PD 3.0"
  | "QC 3.0"
  | "Apple 2.4A"
  | "USB BC 1.2";

export type AdapterPort = "USB-C" | "USB-A";
export type CableConnector =
  | "USB-C to USB-C"
  | "USB-A to USB-C"
  | "USB-C to Lightning"
  | "USB-A to Lightning";
export type DeviceConnector = "USB-C" | "Lightning";

export interface AdapterSpec {
  name: string;
  maxW: number;
  maxV: number;
  maxA: number;
  standards: Standard[];
  ports: AdapterPort[];
  notes?: string;
}

export interface CableSpec {
  name: string;
  maxW: number;
  maxV: number;
  maxA: number;
  connector: CableConnector;
  epr: boolean;
  notes?: string;
}

export interface DeviceSpec {
  name: string;
  recommendedW: number;
  maxV: number;
  maxA: number;
  standards: Standard[];
  connector: DeviceConnector;
  batteryWh: number;
  notes?: string;
}

export interface SimulationResult {
  standard: Standard;
  estimatedW: number;
  estimatedV: number;
  estimatedA: number;
  meetsRecommended: boolean;
  estimatedTimeHours: number;
  bottlenecks: string[];
  nextActions: string[];
  incompatibilities: string[];
}
