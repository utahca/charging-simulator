export type Standard =
  | "USB PD 3.1 EPR"
  | "USB PD 3.0/2.0"
  | "USB PD PPS"
  | "Quick Charge 4+"
  | "Quick Charge 3.0"
  | "Apple 2.4A"
  | "USB BC 1.2";

export interface AdapterSpec {
  name: string;
  maxW: number;
  maxV: number;
  maxA?: number;
  standards: Standard[];
  notes?: string;
}

export interface CableSpec {
  name: string;
  connector: "USB-C to USB-C" | "USB-A to USB-C" | "USB-A to Lightning" | "USB-C to Lightning";
  maxA: number;
  maxV: number;
  eMarked?: boolean;
  usbVersion?: string;
  notes?: string;
}

export interface DeviceSpec {
  name: string;
  recommendedW: number;
  maxW: number;
  maxV: number;
  maxA?: number;
  batteryWh?: number;
  batteryMAh?: number;
  nominalV?: number;
  standards: Standard[];
  notes?: string;
}

export const ADAPTERS: AdapterSpec[] = [
  {
    name: "Apple 20W USB‑C Power Adapter",
    maxW: 20,
    maxV: 9,
    standards: ["USB PD 3.0/2.0", "Apple 2.4A"],
    notes: "iPhone系の定番。PPS非対応",
  },
  {
    name: "Apple 35W Dual USB‑C Adapter",
    maxW: 35,
    maxV: 20,
    standards: ["USB PD 3.0/2.0"],
  },
  {
    name: "Anker 737 (GaNPrime) 120W",
    maxW: 120,
    maxV: 20,
    standards: ["USB PD 3.0/2.0", "USB PD PPS", "Quick Charge 4+"],
    notes: "複数ポートのため単ポート利用時の上限に注意",
  },
  {
    name: "Anker 715 (Nano II) 65W",
    maxW: 65,
    maxV: 20,
    standards: ["USB PD 3.0/2.0", "Quick Charge 4+"],
  },
  {
    name: "UGREEN 300W (PD 3.1 EPR)",
    maxW: 300,
    maxV: 48,
    standards: ["USB PD 3.1 EPR", "USB PD 3.0/2.0"],
  },
  {
    name: "Nintendo Switch OEM Adapter",
    maxW: 39,
    maxV: 15,
    standards: ["USB PD 3.0/2.0"],
  },
  // ユーザー提供
  {
    name: "Apple 140W USB-C Power Adapter",
    maxW: 140,
    maxV: 28,
    standards: ["USB PD 3.1 EPR", "USB PD 3.0/2.0"],
    notes: "PD 3.1対応 / MacBook Pro 16向け",
  },
  {
    name: "Anker 737 Charger (GaNPrime 120W)",
    maxW: 100,
    maxV: 20,
    maxA: 5,
    standards: ["USB PD 3.0/2.0", "USB PD PPS", "Quick Charge 3.0", "Apple 2.4A"],
    notes: "3ポート合計120W / 単ポート最大100W (PPS対応)",
  },
  {
    name: "Belkin BoostCharge Pro 4-Port GaN Charger 108W",
    maxW: 96,
    maxV: 20,
    standards: ["USB PD 3.0/2.0", "Apple 2.4A"],
    notes: "4ポート合計108W / 単Cポート最大96W",
  },
  {
    name: "Samsung 45W USB-C Charger (Super Fast Charging 2.0)",
    maxW: 45,
    maxV: 21,
    standards: ["USB PD PPS", "USB PD 3.0/2.0"],
    notes: "PD PPS対応 / Galaxyの45W急速充電用",
  },
  {
    name: "Anker 715 Charger (Nano II 65W)",
    maxW: 65,
    maxV: 20,
    standards: ["USB PD PPS", "USB PD 3.0/2.0", "Apple 2.4A"],
    notes: "単ポート最大65W (PPS対応)",
  },
];

export const CABLES: CableSpec[] = [
  {
    name: "USB‑C to USB‑C 3A / 60W (no eMarker)",
    connector: "USB-C to USB-C",
    maxA: 3,
    maxV: 20,
    eMarked: false,
    usbVersion: "USB 2.0",
    notes: "一般的なC-Cケーブル。上限60W",
  },
  {
    name: "USB‑C to USB‑C 5A / 100W (eMarked)",
    connector: "USB-C to USB-C",
    maxA: 5,
    maxV: 20,
    eMarked: true,
    usbVersion: "USB 3.2",
  },
  {
    name: "USB‑C to USB‑C 5A / 240W (EPR)",
    connector: "USB-C to USB-C",
    maxA: 5,
    maxV: 48,
    eMarked: true,
    usbVersion: "USB 4 / EPR",
  },
  {
    name: "USB‑A to USB‑C (legacy)",
    connector: "USB-A to USB-C",
    maxA: 2.4,
    maxV: 5,
    eMarked: false,
    usbVersion: "USB 2.0",
    notes: "最大12W〜15W程度",
  },
  {
    name: "USB‑C to Lightning (Apple MFi)",
    connector: "USB-C to Lightning",
    maxA: 3,
    maxV: 9,
    eMarked: false,
    usbVersion: "USB 2.0",
  },
  // ユーザー提供
  {
    name: "Baseus 240W USB-C to USB-C (EPR)",
    connector: "USB-C to USB-C",
    maxA: 5,
    maxV: 48,
    eMarked: true,
    usbVersion: "USB 4",
    notes: "PD 3.1 EPR対応",
  },
  {
    name: "Apple 240W USB-C Charge Cable (2 m)",
    connector: "USB-C to USB-C",
    maxA: 5,
    maxV: 48,
    eMarked: true,
    usbVersion: "USB 2.0",
    notes: "PD 3.1 EPR対応 / 編組タイプ",
  },
  {
    name: "Apple USB-C to Lightning Cable (1 m)",
    connector: "USB-C to Lightning",
    maxA: 3,
    maxV: 20,
    usbVersion: "USB 2.0",
    notes: "MFi認証 / PD急速充電対応",
  },
  {
    name: "Apple USB-A to Lightning Cable (1 m)",
    connector: "USB-A to Lightning",
    maxA: 2.4,
    maxV: 5,
    usbVersion: "USB 2.0",
    notes: "Apple 5V2.4A (12W)充電対応",
  },
  {
    name: "Anker PowerLine+ USB-A to USB-C Cable",
    connector: "USB-A to USB-C",
    maxA: 3,
    maxV: 5,
    usbVersion: "USB 3.0",
    notes: "最大5V3A充電対応 / USB 3.0データ対応",
  },
];

export const DEVICES: DeviceSpec[] = [
  {
    name: "iPhone 15 Pro",
    recommendedW: 27,
    maxW: 30,
    maxV: 9,
    maxA: 3,
    batteryMAh: 3274,
    nominalV: 3.85,
    standards: ["USB PD 3.0/2.0", "USB PD PPS", "Apple 2.4A", "USB BC 1.2"],
    notes: "ピーク約27W程度と言われる",
  },
  {
    name: "iPad Pro 11 (M4)",
    recommendedW: 35,
    maxW: 45,
    maxV: 15,
    maxA: 3,
    batteryWh: 31,
    standards: ["USB PD 3.0/2.0", "USB PD PPS"],
  },
  {
    name: "MacBook Air 13 (M2/M3)",
    recommendedW: 35,
    maxW: 45,
    maxV: 20,
    maxA: 2.25,
    batteryWh: 52,
    standards: ["USB PD 3.0/2.0"],
  },
  {
    name: "MacBook Pro 14 (M3)",
    recommendedW: 70,
    maxW: 96,
    maxV: 20,
    maxA: 5,
    batteryWh: 70,
    standards: ["USB PD 3.1 EPR", "USB PD 3.0/2.0"],
  },
  {
    name: "Nintendo Switch",
    recommendedW: 18,
    maxW: 39,
    maxV: 15,
    maxA: 2.6,
    batteryWh: 16,
    standards: ["USB PD 3.0/2.0"],
  },
  {
    name: "Google Pixel 8 Pro",
    recommendedW: 30,
    maxW: 30,
    maxV: 11,
    maxA: 3,
    batteryMAh: 5050,
    nominalV: 3.85,
    standards: ["USB PD 3.0/2.0", "USB PD PPS", "Quick Charge 4+", "USB BC 1.2"],
    notes: "30W PD急速充電対応 (PPS)",
  },
  // ユーザー提供
  {
    name: "Samsung Galaxy S24 Ultra",
    recommendedW: 45,
    maxW: 45,
    maxV: 11,
    maxA: 5,
    batteryMAh: 5000,
    nominalV: 3.85,
    standards: ["USB PD PPS", "USB PD 3.0/2.0", "Quick Charge 4+"],
    notes: "Super Fast Charging 2.0対応",
  },
  {
    name: "Steam Deck OLED",
    recommendedW: 45,
    maxW: 45,
    maxV: 15,
    maxA: 3,
    batteryWh: 50.1,
    batteryMAh: 6470,
    nominalV: 7.74,
    standards: ["USB PD 3.0/2.0", "USB BC 1.2"],
    notes: "付属45W(15V/3A) PD充電器で急速充電",
  },
  {
    name: "MacBook Pro 16 (M3 Max)",
    recommendedW: 140,
    maxW: 140,
    maxV: 28,
    maxA: 5,
    batteryWh: 100,
    batteryMAh: 8700,
    nominalV: 11.4,
    standards: ["USB PD 3.1 EPR", "USB PD 3.0/2.0"],
    notes: "PD 3.1(28V/5A)による140W充電対応",
  },
];

export const ALL_STANDARDS: Standard[] = [
  "USB PD 3.1 EPR",
  "USB PD 3.0/2.0",
  "USB PD PPS",
  "Quick Charge 4+",
  "Quick Charge 3.0",
  "Apple 2.4A",
  "USB BC 1.2",
];

export const STANDARD_PRIORITY: Standard[] = [
  "USB PD 3.1 EPR",
  "USB PD 3.0/2.0",
  "USB PD PPS",
  "Quick Charge 4+",
  "Quick Charge 3.0",
  "Apple 2.4A",
  "USB BC 1.2",
];
