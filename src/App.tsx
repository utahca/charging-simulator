import React, { useMemo, useState } from "react";
import { Info, RefreshCcw, Zap, AlertTriangle, Sparkles, Settings2 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Charging Simulator – USB/PD/PPS
 * Single-file React app. Uses Tailwind (no shadcn/ui dependency).
 */

// ---------- Minimal UI (Tailwind only)

type ButtonVariant = "default" | "outline";

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
) {
  const { variant = "default", className = "", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none";
  const styles =
    variant === "outline"
      ? "border border-slate-200 bg-white hover:bg-slate-50"
      : "bg-slate-900 text-white hover:bg-slate-800";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${className}`}
      {...rest}
    />
  );
}

function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { className = "", ...rest } = props;
  return <label className={`text-sm font-medium ${className}`} {...rest} />;
}

function Badge({
  children,
  variant = "default",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium select-none";
  const styles =
    variant === "outline"
      ? "border border-slate-200 bg-white text-slate-700"
      : "bg-slate-900 text-white";
  const clickable = onClick ? "cursor-pointer hover:opacity-90" : "";
  return (
    <span className={`${base} ${styles} ${clickable} ${className}`} onClick={onClick}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 pt-5 ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>;
}

function Select({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${className}`}
    >
      {children}
    </select>
  );
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        checked ? "bg-slate-900 border-slate-900" : "bg-slate-200 border-slate-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Alert({
  variant = "default",
  title,
  children,
}: {
  variant?: "default" | "destructive";
  title: string;
  children?: React.ReactNode;
}) {
  const styles =
    variant === "destructive"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-slate-200 bg-slate-50 text-slate-900";
  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-start gap-2">
        {variant === "destructive" ? (
          <AlertTriangle className="h-4 w-4 mt-0.5" />
        ) : (
          <Info className="h-4 w-4 mt-0.5" />
        )}
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {children ? <div className="mt-1 text-sm opacity-90">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        {right}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3">
      <Label className="col-span-5 sm:col-span-4 text-sm text-slate-500">{label}</Label>
      <div className="col-span-7 sm:col-span-8">{children}</div>
    </div>
  );
}

// ---------- Types

type Standard =
  | "USB PD 3.1 EPR"
  | "USB PD 3.0/2.0"
  | "USB PD PPS"
  | "Quick Charge 4+"
  | "Quick Charge 3.0"
  | "Apple 2.4A"
  | "USB BC 1.2";

interface AdapterSpec {
  name: string;
  maxW: number;
  maxV: number;
  maxA?: number;
  standards: Standard[];
  notes?: string;
}

interface CableSpec {
  name: string;
  connector: "USB-C to USB-C" | "USB-A to USB-C" | "USB-A to Lightning" | "USB-C to Lightning";
  maxA: number;
  maxV: number;
  eMarked?: boolean;
  usbVersion?: string;
  notes?: string;
}

interface DeviceSpec {
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

// ---------- Presets

const ADAPTERS: AdapterSpec[] = [
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

const CABLES: CableSpec[] = [
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

const DEVICES: DeviceSpec[] = [
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
    name: "Pixel 8 Pro",
    recommendedW: 30,
    maxW: 30,
    maxV: 11,
    maxA: 3,
    batteryMAh: 5050,
    nominalV: 3.87,
    standards: ["USB PD 3.0/2.0", "USB PD PPS", "Quick Charge 4+", "USB BC 1.2"],
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
    name: "Google Pixel 8 Pro",
    recommendedW: 30,
    maxW: 30,
    maxV: 11,
    maxA: 3,
    batteryMAh: 5050,
    nominalV: 3.85,
    standards: ["USB PD PPS", "USB PD 3.0/2.0", "Quick Charge 3.0"],
    notes: "30W PD急速充電対応 (PPS)",
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

// ---------- Helpers

const ALL_STANDARDS: Standard[] = [
  "USB PD 3.1 EPR",
  "USB PD 3.0/2.0",
  "USB PD PPS",
  "Quick Charge 4+",
  "Quick Charge 3.0",
  "Apple 2.4A",
  "USB BC 1.2",
];

function intersect<T>(a: T[], b: T[]): T[] {
  return a.filter((x) => b.includes(x));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const STANDARD_PRIORITY: Standard[] = [
  "USB PD 3.1 EPR",
  "USB PD 3.0/2.0",
  "USB PD PPS",
  "Quick Charge 4+",
  "Quick Charge 3.0",
  "Apple 2.4A",
  "USB BC 1.2",
];

function chooseBestStandard(options: Standard[]): Standard | null {
  for (const s of STANDARD_PRIORITY) {
    if (options.includes(s)) return s;
  }
  return null;
}

function computeNegotiatedPower(
  adapter: AdapterSpec,
  cable: CableSpec,
  device: DeviceSpec,
  forcedStandard?: Standard | null
) {
  const available = intersect(adapter.standards, device.standards);
  const viable = available.filter((s) => {
    if (
      (s === "USB PD 3.1 EPR" || s === "USB PD 3.0/2.0" || s === "USB PD PPS") &&
      (cable.connector === "USB-A to USB-C" || cable.connector === "USB-A to Lightning")
    )
      return false;
    if (s === "USB PD 3.1 EPR" && (cable.maxV < 48 || cable.maxA < 5)) return false;
    if (s === "USB PD PPS" && cable.connector !== "USB-C to USB-C") return false;
    return true;
  });

  const chosen = forcedStandard ?? chooseBestStandard(viable);
  if (!chosen) {
    return {
      standard: null as Standard | null,
      voltage: 5,
      current: 0,
      power: 0,
      limits: { adapter: true, cable: true, device: true },
      reason: "共通の充電規格がありません",
    };
  }

  let targetV = 5;
  if (chosen === "USB PD 3.1 EPR") targetV = clamp(Math.min(adapter.maxV, device.maxV, cable.maxV), 20, 48);
  else if (chosen === "USB PD 3.0/2.0") targetV = clamp(Math.min(adapter.maxV, device.maxV, cable.maxV), 5, 20);
  else if (chosen === "USB PD PPS") targetV = clamp(Math.min(adapter.maxV, device.maxV, cable.maxV), 5, 21);
  else if (chosen === "Quick Charge 4+" || chosen === "Quick Charge 3.0")
    targetV = Math.min(12, adapter.maxV, device.maxV, cable.maxV);
  else if (chosen === "Apple 2.4A" || chosen === "USB BC 1.2") targetV = 5;

  const adapterMaxA = adapter.maxA ?? adapter.maxW / targetV;
  const deviceMaxA = device.maxA ?? device.maxW / targetV;
  const cableMaxA = cable.maxA;

  const current = Math.min(adapterMaxA, deviceMaxA, cableMaxA);
  let power = current * targetV;
  power = Math.min(power, adapter.maxW, device.maxW);

  const limits = {
    adapter: adapter.maxW <= power + 1e-6 || adapterMaxA <= current + 1e-6 || adapter.maxV < targetV,
    cable: cableMaxA <= current + 1e-6 || cable.maxV < targetV,
    device: device.maxW <= power + 1e-6 || deviceMaxA <= current + 1e-6 || device.maxV < targetV,
  };

  return { standard: chosen, voltage: targetV, current, power, limits, reason: null as string | null };
}

function estimateChargeTimeMinutes(powerW: number, device: DeviceSpec) {
  let capacityWh = 0;
  if (device.batteryWh) capacityWh = device.batteryWh;
  else if (device.batteryMAh && device.nominalV) capacityWh = (device.batteryMAh * device.nominalV) / 1000;
  else return null;

  const sliceWh = capacityWh * 0.6;
  const eff = capacityWh < 25 ? 0.75 : 0.85;
  const effectiveW = Math.min(powerW, device.maxW) * eff;
  if (effectiveW <= 0.1) return null;
  const hours = sliceWh / effectiveW;
  return Math.round(hours * 60);
}

function formatMinutes(min: number | null) {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  return `${h}時間 ${m}分`;
}

// ---------- Main App

export default function App() {
  const [adapterIdx, setAdapterIdx] = useState<number>(0);
  const [cableIdx, setCableIdx] = useState<number>(0);
  const [deviceIdx, setDeviceIdx] = useState<number>(0);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [forcedStandard, setForcedStandard] = useState<Standard | "auto">("auto");

  const [adapterCustom, setAdapterCustom] = useState<Partial<AdapterSpec>>({});
  const [cableCustom, setCableCustom] = useState<Partial<CableSpec>>({});
  const [deviceCustom, setDeviceCustom] = useState<Partial<DeviceSpec>>({});

  const adapter = useMemo<AdapterSpec>(
    () => ({ ...ADAPTERS[adapterIdx], ...adapterCustom, name: ADAPTERS[adapterIdx].name }),
    [adapterIdx, adapterCustom]
  );
  const cable = useMemo<CableSpec>(
    () => ({ ...CABLES[cableIdx], ...cableCustom, name: CABLES[cableIdx].name }),
    [cableIdx, cableCustom]
  );
  const device = useMemo<DeviceSpec>(
    () => ({ ...DEVICES[deviceIdx], ...deviceCustom, name: DEVICES[deviceIdx].name }),
    [deviceIdx, deviceCustom]
  );

  const negotiation = useMemo(
    () =>
      computeNegotiatedPower(adapter, cable, device, forcedStandard === "auto" ? null : forcedStandard),
    [adapter, cable, device, forcedStandard]
  );

  const time20to80 = useMemo(
    () => estimateChargeTimeMinutes(negotiation.power, device),
    [negotiation.power, device]
  );

  const bottlenecks = useMemo(() => {
    const list: { part: "アダプタ" | "ケーブル" | "端末"; reason: string }[] = [];
    if (!negotiation.standard) {
      list.push({ part: "アダプタ", reason: "規格が合わない/対応していない" });
      list.push({ part: "ケーブル", reason: "規格が合わない/対応していない" });
      list.push({ part: "端末", reason: "規格が合わない/対応していない" });
      return list;
    }

    if (adapter.maxV < negotiation.voltage) list.push({ part: "アダプタ", reason: `電圧上限 ${adapter.maxV}V` });
    if (cable.maxV < negotiation.voltage) list.push({ part: "ケーブル", reason: `電圧上限 ${cable.maxV}V` });
    if (device.maxV < negotiation.voltage) list.push({ part: "端末", reason: `電圧上限 ${device.maxV}V` });

    const adapterA = adapter.maxA ?? adapter.maxW / negotiation.voltage;
    const deviceA = device.maxA ?? device.maxW / negotiation.voltage;

    if (negotiation.current + 1e-6 >= adapterA) list.push({ part: "アダプタ", reason: `電流上限 ${adapterA.toFixed(2)}A` });
    if (negotiation.current + 1e-6 >= cable.maxA) list.push({ part: "ケーブル", reason: `電流上限 ${cable.maxA.toFixed(2)}A` });
    if (negotiation.current + 1e-6 >= deviceA) list.push({ part: "端末", reason: `電流上限 ${deviceA.toFixed(2)}A` });

    if (negotiation.power + 1e-6 >= adapter.maxW) list.push({ part: "アダプタ", reason: `出力上限 ${adapter.maxW}W` });
    if (negotiation.power + 1e-6 >= device.maxW) list.push({ part: "端末", reason: `入力上限 ${device.maxW}W` });

    if (
      device.standards.includes("USB PD PPS") &&
      negotiation.standard !== "USB PD PPS" &&
      adapter.standards.includes("USB PD PPS")
    ) {
      list.push({ part: "端末", reason: "PPS対応時はより高効率の可能性" });
    }

    return list;
  }, [negotiation, adapter, cable, device]);

  const suggestions = useMemo(() => {
    const s: string[] = [];
    if (!negotiation.standard) {
      s.push(
        "共通の規格に対応したアダプタ/ケーブルの組み合わせに変更してください (例: USB-C to C + USB PD対応アダプタ)"
      );
      return s;
    }

    if (negotiation.power < device.recommendedW - 1) {
      s.push(`端末の推奨 ${device.recommendedW}W を満たしていません。`);
    }

    if (negotiation.voltage >= 20 && cable.maxA < 5) {
      s.push("5A eMarker付きUSB-Cケーブルに変更すると上限が上がる可能性があります");
    }

    if (adapter.maxW < device.recommendedW) {
      s.push("より高出力のUSB PD対応アダプタを検討してください");
    }

    if (device.standards.includes("USB PD 3.1 EPR") && !adapter.standards.includes("USB PD 3.1 EPR")) {
      s.push("PD 3.1(EPR)対応アダプタに変更すると最大出力を引き上げられる可能性があります");
    }

    if (negotiation.standard === "Apple 2.4A" || negotiation.standard === "USB BC 1.2") {
      s.push("USB-A経由は速度が頭打ちです。USB-C PDの利用を推奨します");
    }

    return s;
  }, [negotiation, cable, adapter, device]);

  const resetAll = () => {
    setAdapterIdx(0);
    setCableIdx(0);
    setDeviceIdx(0);
    setForcedStandard("auto");
    setAdapterCustom({});
    setCableCustom({});
    setDeviceCustom({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-6 w-6" />充電シミュレーター
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              アダプタ / ケーブル / 端末 の組み合わせから、見込みの充電速度・ボトルネック・改善提案を表示します。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetAll}>
              <RefreshCcw className="h-4 w-4 mr-2" />リセット
            </Button>
            <Button variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
              <Settings2 className="h-4 w-4 mr-2" />
              {showAdvanced ? "設定を隠す" : "設定を表示"}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SectionCard title="電源アダプタ">
            <Field label="プリセット">
              <Select value={String(adapterIdx)} onChange={(v) => setAdapterIdx(Number(v))}>
                {ADAPTERS.map((a, i) => (
                  <option key={a.name} value={String(i)}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="最大出力(W)">
                <Input
                  type="number"
                  value={adapter.maxW}
                  onChange={(e) => setAdapterCustom((c) => ({ ...c, maxW: Number(e.target.value) }))}
                />
              </Field>
              <Field label="最大電圧(V)">
                <Input
                  type="number"
                  value={adapter.maxV}
                  onChange={(e) => setAdapterCustom((c) => ({ ...c, maxV: Number(e.target.value) }))}
                />
              </Field>
              <Field label="最大電流(A)">
                <Input
                  type="number"
                  placeholder="(任意)"
                  value={adapter.maxA ?? ""}
                  onChange={(e) =>
                    setAdapterCustom((c) => ({ ...c, maxA: e.target.value ? Number(e.target.value) : undefined }))
                  }
                />
              </Field>
            </div>

            <Field label="対応規格">
              <div className="flex flex-wrap gap-2">
                {ALL_STANDARDS.map((s) => {
                  const enabled = adapter.standards.includes(s);
                  return (
                    <Badge
                      key={s}
                      variant={enabled ? "default" : "outline"}
                      onClick={() => {
                        setAdapterCustom((c) => {
                          const base = c.standards ?? ADAPTERS[adapterIdx].standards;
                          const set = new Set(base);
                          if (set.has(s)) set.delete(s);
                          else set.add(s);
                          return { ...c, standards: Array.from(set) as Standard[] };
                        });
                      }}
                    >
                      {s}
                    </Badge>
                  );
                })}
              </div>
            </Field>
            {adapter.notes && <p className="text-xs text-slate-500">備考: {adapter.notes}</p>}
          </SectionCard>

          <SectionCard title="充電ケーブル">
            <Field label="プリセット">
              <Select value={String(cableIdx)} onChange={(v) => setCableIdx(Number(v))}>
                {CABLES.map((c, i) => (
                  <option key={c.name} value={String(i)}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="最大電流(A)">
                <Input
                  type="number"
                  value={cable.maxA}
                  onChange={(e) => setCableCustom((c) => ({ ...c, maxA: Number(e.target.value) }))}
                />
              </Field>
              <Field label="最大電圧(V)">
                <Input
                  type="number"
                  value={cable.maxV}
                  onChange={(e) => setCableCustom((c) => ({ ...c, maxV: Number(e.target.value) }))}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">eMarker (5A対応)</Label>
              <Switch checked={!!cable.eMarked} onCheckedChange={(v) => setCableCustom((c) => ({ ...c, eMarked: v }))} />
            </div>

            <p className="text-xs text-slate-500">コネクタ: {cable.connector} / バージョン: {cable.usbVersion ?? "—"}</p>
            {cable.notes && <p className="text-xs text-slate-500">備考: {cable.notes}</p>}
          </SectionCard>

          <SectionCard title="充電対象の端末">
            <Field label="プリセット">
              <Select value={String(deviceIdx)} onChange={(v) => setDeviceIdx(Number(v))}>
                {DEVICES.map((d, i) => (
                  <option key={`${d.name}-${i}`} value={String(i)}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="推奨W">
                <Input
                  type="number"
                  value={device.recommendedW}
                  onChange={(e) => setDeviceCustom((c) => ({ ...c, recommendedW: Number(e.target.value) }))}
                />
              </Field>
              <Field label="最大W">
                <Input
                  type="number"
                  value={device.maxW}
                  onChange={(e) => setDeviceCustom((c) => ({ ...c, maxW: Number(e.target.value) }))}
                />
              </Field>
              <Field label="最大V">
                <Input
                  type="number"
                  value={device.maxV}
                  onChange={(e) => setDeviceCustom((c) => ({ ...c, maxV: Number(e.target.value) }))}
                />
              </Field>
              <Field label="最大A (任意)">
                <Input
                  type="number"
                  placeholder="(任意)"
                  value={device.maxA ?? ""}
                  onChange={(e) => setDeviceCustom((c) => ({ ...c, maxA: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </Field>
            </div>

            <div className="mt-2 space-y-2">
              <Label className="text-sm">バッテリー容量</Label>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-6">
                  <div className="text-xs text-slate-500 mb-1">スマホ (mAh)</div>
                  <Input
                    type="number"
                    value={device.batteryMAh ?? ""}
                    onChange={(e) => setDeviceCustom((c) => ({ ...c, batteryMAh: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="col-span-6">
                  <div className="text-xs text-slate-500 mb-1">PC/タブレット (Wh)</div>
                  <Input
                    type="number"
                    value={device.batteryWh ?? ""}
                    onChange={(e) => setDeviceCustom((c) => ({ ...c, batteryWh: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
              </div>
            </div>

            <Field label="対応規格">
              <div className="flex flex-wrap gap-2">
                {ALL_STANDARDS.map((s) => {
                  const enabled = device.standards.includes(s);
                  return (
                    <Badge
                      key={s}
                      variant={enabled ? "default" : "outline"}
                      onClick={() => {
                        setDeviceCustom((c) => {
                          const base = c.standards ?? DEVICES[deviceIdx].standards;
                          const set = new Set(base);
                          if (set.has(s)) set.delete(s);
                          else set.add(s);
                          return { ...c, standards: Array.from(set) as Standard[] };
                        });
                      }}
                    >
                      {s}
                    </Badge>
                  );
                })}
              </div>
            </Field>
            {device.notes && <p className="text-xs text-slate-500">備考: {device.notes}</p>}
          </SectionCard>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="シミュレーション結果"
            right={
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">規格の選択</Label>
                <Select
                  value={forcedStandard}
                  onChange={(v) => setForcedStandard(v as any)}
                  className="w-44"
                >
                  <option value="auto">自動 (最良を選択)</option>
                  {STANDARD_PRIORITY.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            }
          >
            {!negotiation.standard ? (
              <Alert variant="destructive" title="非対応の組み合わせ">
                {negotiation.reason}
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">採用規格</div>
                  <div className="text-xl font-semibold mt-1">{negotiation.standard}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">推定最大出力</div>
                  <motion.div layout className="text-xl font-semibold mt-1 flex items-baseline gap-2">
                    <span>{negotiation.power.toFixed(1)} W</span>
                    <Badge variant="outline">{negotiation.voltage.toFixed(0)} V</Badge>
                    <Badge variant="outline">{negotiation.current.toFixed(2)} A</Badge>
                  </motion.div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">端末推奨との比較</div>
                  <div className="mt-1 text-base">
                    {negotiation.power + 1 >= device.recommendedW ? (
                      <span className="text-emerald-600 font-medium">推奨 {device.recommendedW}W を満たしています</span>
                    ) : (
                      <span className="text-amber-600 font-medium">
                        推奨 {device.recommendedW}W に未達 ({(device.recommendedW - negotiation.power).toFixed(1)}W 不足)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">20%→80% 目安時間</div>
                  <div className="mt-1 text-base font-medium">{formatMinutes(time20to80)}</div>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="ボトルネック">
            {bottlenecks.length === 0 ? (
              <div className="text-sm text-slate-500">顕著なボトルネックは見当たりません</div>
            ) : (
              <ul className="space-y-2">
                {bottlenecks.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <div className="text-sm font-medium">{b.part}</div>
                      <div className="text-sm text-slate-500">{b.reason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="改善提案 (Next Actions)" right={<Sparkles className="h-4 w-4 text-violet-600" />}> 
            {suggestions.length === 0 ? (
              <div className="text-sm text-slate-500">この構成は十分に最適です</div>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-xs text-slate-500 flex gap-2 items-start">
              <Info className="h-3.5 w-3.5 mt-0.5" />
              <span>結果は一般化したモデルに基づく推定です。ポート共有や温度、充電制御の挙動で実測は異なる場合があります。</span>
            </div>
          </SectionCard>
        </div>

        {showAdvanced && (
          <div className="mt-6">
            <SectionCard title="詳細設定">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">規格の優先順位</Label>
                  <p className="text-xs text-slate-500 mb-3">自動選択時に上から順に優先されます (固定値・UIのみ)。</p>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_PRIORITY.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">推定モデル</Label>
                  <p className="text-xs text-slate-500">20%→80%は単純化したテーパリングを考慮した概算です。</p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Charging Simulator (beta)</p>
        </footer>
      </div>
    </div>
  );
}

// ---------- Minimal sanity tests (run in browser console)
function runSanityTests() {
  const a20 = ADAPTERS.find((a) => a.name.includes("20W USB"))!;
  const c3a = CABLES.find((c) => c.name.includes("3A / 60W"))!;
  const iphone = DEVICES.find((d) => d.name.includes("iPhone 15 Pro"))!;
  const r1 = computeNegotiatedPower(a20, c3a, iphone);
  console.assert(r1.power <= 20.5, `Expected ≤20W, got ${r1.power}`);

  const a140 = ADAPTERS.find((a) => a.name.startsWith("Apple 140W"))!;
  const cEPR = CABLES.find((c) => c.maxV >= 48 && c.maxA >= 5)!;
  const mbp16 = DEVICES.find((d) => d.name.includes("MacBook Pro 16"))!;
  const r2 = computeNegotiatedPower(a140, cEPR, mbp16, "USB PD 3.1 EPR");
  console.assert(Math.abs(r2.power - 140) < 2, `Expected ~140W, got ${r2.power}`);

  const cAL = CABLES.find((c) => c.connector === "USB-A to Lightning")!;
  const r3 = computeNegotiatedPower(a20, cAL, iphone, "Apple 2.4A");
  console.assert(r3.power <= 15, `Expected ~12W cap, got ${r3.power}`);
}

if (typeof window !== "undefined") {
  try {
    runSanityTests();
  } catch (e) {
    console.warn("Sanity tests failed:", e);
  }
}
