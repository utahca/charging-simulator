import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  Badge,
  Card,
  Input,
  Label,
  Select,
  Switch,
} from "./components/ui";
import { ADAPTERS, CABLES, DEVICES, STANDARDS } from "./data/presets";
import type { AdapterSpec, CableSpec, DeviceSpec, SimulationResult, Standard } from "./types";
import { BatteryCharging, Bolt, PlugZap, Zap } from "lucide-react";

const STANDARD_PRIORITY: Standard[] = [
  "USB PD 3.1 EPR",
  "USB PD 3.0 PPS",
  "USB PD 3.0",
  "QC 3.0",
  "Apple 2.4A",
  "USB BC 1.2",
];

type StandardSelection = "Auto" | Standard;

type StandardCompatibility = {
  compatible: boolean;
  reasons: string[];
};

const getConnectorCompatibility = (
  adapter: AdapterSpec,
  cable: CableSpec,
  device: DeviceSpec
): StandardCompatibility => {
  const reasons: string[] = [];
  const requiresUsbC = cable.connector.includes("USB-C");
  const requiresUsbA = cable.connector.includes("USB-A");

  if (requiresUsbC && !adapter.ports.includes("USB-C")) {
    reasons.push("Adapter lacks USB-C port for this cable.");
  }
  if (requiresUsbA && !adapter.ports.includes("USB-A")) {
    reasons.push("Adapter lacks USB-A port for this cable.");
  }

  if (device.connector === "USB-C" && !cable.connector.includes("USB-C")) {
    reasons.push("Device needs USB-C but cable ends with Lightning.");
  }
  if (device.connector === "Lightning" && !cable.connector.includes("Lightning")) {
    reasons.push("Device needs Lightning but cable is USB-C only.");
  }

  return { compatible: reasons.length === 0, reasons };
};

const isStandardAllowedOnUsbA = (standard: Standard) =>
  standard === "Apple 2.4A" || standard === "USB BC 1.2" || standard === "QC 3.0";

const isStandardCompatible = (
  standard: Standard,
  adapter: AdapterSpec,
  cable: CableSpec,
  device: DeviceSpec
): StandardCompatibility => {
  const reasons: string[] = [];
  const connectorCompatibility = getConnectorCompatibility(adapter, cable, device);
  if (!connectorCompatibility.compatible) {
    reasons.push(...connectorCompatibility.reasons);
  }

  if (!adapter.standards.includes(standard)) {
    reasons.push("Adapter does not support the selected standard.");
  }
  if (!device.standards.includes(standard)) {
    reasons.push("Device does not support the selected standard.");
  }

  const usesUsbA = cable.connector.includes("USB-A");
  if (usesUsbA && !isStandardAllowedOnUsbA(standard)) {
    reasons.push("USB-A cables cannot negotiate USB Power Delivery.");
  }

  if (standard === "USB PD 3.1 EPR" && !cable.epr) {
    reasons.push("EPR requires a 48V/5A (240W) USB-C cable.");
  }

  if (standard === "USB PD 3.1 EPR" && Math.min(adapter.maxV, device.maxV) < 28) {
    reasons.push("EPR needs 28V+ capability on adapter and device.");
  }

  return { compatible: reasons.length === 0, reasons };
};

const estimateCharging = (
  adapter: AdapterSpec,
  cable: CableSpec,
  device: DeviceSpec,
  selection: StandardSelection
): SimulationResult => {
  const candidateStandards = STANDARD_PRIORITY.filter(
    (standard) => adapter.standards.includes(standard) && device.standards.includes(standard)
  );

  const autoStandard =
    candidateStandards.find((standard) =>
      isStandardCompatible(standard, adapter, cable, device).compatible
    ) ?? "USB BC 1.2";

  const standard = selection === "Auto" ? autoStandard : selection;

  const compatibility = isStandardCompatible(standard, adapter, cable, device);
  const incompatibilities = [...compatibility.reasons];

  const usesUsbA = cable.connector.includes("USB-A");
  const clampVoltage = usesUsbA ? 5 : Infinity;

  const deviceMaxW = device.maxV * device.maxA;
  const effectiveV = Math.min(adapter.maxV, cable.maxV, device.maxV, clampVoltage);
  const effectiveA = Math.min(adapter.maxA, cable.maxA, device.maxA);
  const effectiveW = Math.min(adapter.maxW, cable.maxW, deviceMaxW, effectiveV * effectiveA);

  const meetsRecommended = effectiveW >= device.recommendedW * 0.95;
  const energyNeededWh = device.batteryWh * 0.6;
  const taperFactor = effectiveW >= device.recommendedW ? 1.15 : effectiveW < 15 ? 1.4 : 1.3;
  const estimatedTimeHours = effectiveW > 0 ? (energyNeededWh / effectiveW) * taperFactor : 0;

  const bottlenecks: string[] = [];
  if (adapter.maxW < device.recommendedW) {
    bottlenecks.push(`Adapter caps at ${adapter.maxW}W.`);
  }
  if (cable.maxW < device.recommendedW) {
    bottlenecks.push(`Cable caps at ${cable.maxW}W.`);
  }
  if (deviceMaxW < device.recommendedW) {
    bottlenecks.push("Device charging curve limits intake.");
  }
  if (standard === "USB PD 3.1 EPR" && !cable.epr) {
    bottlenecks.push("EPR standard selected but cable is not EPR-rated.");
  }
  if (usesUsbA && !isStandardAllowedOnUsbA(standard)) {
    bottlenecks.push("USB-A path prevents USB PD negotiation.");
  }

  const nextActions: string[] = [];
  if (adapter.maxW < device.recommendedW) {
    nextActions.push("Upgrade the adapter to match the device recommended wattage.");
  }
  if (cable.maxW < device.recommendedW) {
    nextActions.push("Use a higher-rated cable (5A or 240W EPR)."
    );
  }
  if (standard === "USB PD 3.1 EPR" && !cable.epr) {
    nextActions.push("Use a USB-C EPR 240W cable for 28V+ charging.");
  }
  if (usesUsbA) {
    nextActions.push("Switch to a USB-C adapter and cable to unlock PD/PPS.");
  }
  if (!meetsRecommended) {
    nextActions.push("Lower expectations: device will charge slower than advertised.");
  }

  return {
    standard,
    estimatedW: Number(effectiveW.toFixed(1)),
    estimatedV: Number(effectiveV.toFixed(1)),
    estimatedA: Number(effectiveA.toFixed(2)),
    meetsRecommended,
    estimatedTimeHours: Number(estimatedTimeHours.toFixed(2)),
    bottlenecks,
    nextActions,
    incompatibilities,
  };
};

const runSanityTests = () => {
  const iphone = DEVICES.find((device) => device.name === "Apple iPhone 15 Pro")!;
  const lightningDevice = DEVICES.find((device) => device.name === "Legacy iPad (Lightning)")!;
  const apple20 = ADAPTERS.find((adapter) => adapter.name === "Apple 20W USB-C Power Adapter")!;
  const c3a = CABLES.find((cable) => cable.name === "Generic USB-C 3A (60W)")!;
  const macbook = DEVICES.find((device) => device.name === "MacBook Pro 16 (M3 Max)")!;
  const apple140 = ADAPTERS.find((adapter) => adapter.name === "Apple 140W USB-C Power Adapter")!;
  const epr = CABLES.find((cable) => cable.name === "Baseus 240W USB-C to USB-C (EPR)")!;
  const usbALightning = CABLES.find((cable) => cable.name === "Apple USB-A to Lightning")!;
  const usbAAdapter = ADAPTERS.find((adapter) => adapter.name === "Generic 12W USB-A")!;

  const test1 = estimateCharging(apple20, c3a, iphone, "Auto");
  console.assert(test1.estimatedW <= 21, "Test1: iPhone + 20W + 3A cable should be <= 20W");

  const test2 = estimateCharging(apple140, epr, macbook, "USB PD 3.1 EPR");
  console.assert(test2.estimatedW >= 135, "Test2: MacBook + 140W + EPR should be ~140W");

  const test3 = estimateCharging(usbAAdapter, usbALightning, lightningDevice, "Apple 2.4A");
  console.assert(test3.estimatedW <= 15, "Test3: USB-A to Lightning Apple 2.4A should be <= 15W");
};

const formatTime = (hours: number) => {
  if (hours <= 0) return "N/A";
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs}h ${mins}m`;
};

export default function App() {
  const [adapterIndex, setAdapterIndex] = useState(0);
  const [cableIndex, setCableIndex] = useState(0);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [standardSelection, setStandardSelection] = useState<StandardSelection>("Auto");
  const [showNotes, setShowNotes] = useState(true);

  const [adapterState, setAdapterState] = useState<AdapterSpec>(ADAPTERS[0]);
  const [cableState, setCableState] = useState<CableSpec>(CABLES[0]);
  const [deviceState, setDeviceState] = useState<DeviceSpec>(DEVICES[0]);

  useEffect(() => {
    setAdapterState({ ...ADAPTERS[adapterIndex] });
  }, [adapterIndex]);

  useEffect(() => {
    setCableState({ ...CABLES[cableIndex] });
  }, [cableIndex]);

  useEffect(() => {
    setDeviceState({ ...DEVICES[deviceIndex] });
  }, [deviceIndex]);

  useEffect(() => {
    runSanityTests();
  }, []);

  const simulation = useMemo(
    () => estimateCharging(adapterState, cableState, deviceState, standardSelection),
    [adapterState, cableState, deviceState, standardSelection]
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-4 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300">
            <Bolt className="h-4 w-4 text-sky-400" />
            Charging Simulator
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            USB-C &amp; Lightning Charging Simulator
          </h1>
          <p className="text-sm text-slate-400 md:text-base">
            Compare adapters, cables, and devices to estimate real-world charging power,
            bottlenecks, and time to 80%.
          </p>
        </header>

        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <PlugZap className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Standard selection</p>
                <p className="text-xs text-slate-400">Auto picks the best mutually supported standard.</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-72">
              <Select
                value={standardSelection}
                onChange={(event) => setStandardSelection(event.target.value as StandardSelection)}
              >
                <option value="Auto">Auto (recommended)</option>
                {STANDARDS.map((standard) => (
                  <option key={standard} value={standard}>
                    {standard}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Zap className="h-4 w-4 text-sky-400" />
                Power Adapter
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Preset</Label>
                  <Select value={adapterIndex} onChange={(event) => setAdapterIndex(Number(event.target.value))}>
                    {ADAPTERS.map((adapter, index) => (
                      <option key={adapter.name} value={index}>
                        {adapter.name}
                      </option>
                    ))}
                  </Select>
                  {showNotes && adapterState.notes && (
                    <p className="mt-2 text-xs text-slate-400">{adapterState.notes}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Max W</Label>
                    <Input
                      type="number"
                      value={adapterState.maxW}
                      onChange={(event) =>
                        setAdapterState({ ...adapterState, maxW: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max V</Label>
                    <Input
                      type="number"
                      value={adapterState.maxV}
                      onChange={(event) =>
                        setAdapterState({ ...adapterState, maxV: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max A</Label>
                    <Input
                      type="number"
                      value={adapterState.maxA}
                      onChange={(event) =>
                        setAdapterState({ ...adapterState, maxA: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {adapterState.standards.map((standard) => (
                    <Badge key={standard}>{standard}</Badge>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  Ports: {adapterState.ports.join(", ")}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <BatteryCharging className="h-4 w-4 text-emerald-400" />
                Charging Cable
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Preset</Label>
                  <Select value={cableIndex} onChange={(event) => setCableIndex(Number(event.target.value))}>
                    {CABLES.map((cable, index) => (
                      <option key={cable.name} value={index}>
                        {cable.name}
                      </option>
                    ))}
                  </Select>
                  {showNotes && cableState.notes && (
                    <p className="mt-2 text-xs text-slate-400">{cableState.notes}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Max W</Label>
                    <Input
                      type="number"
                      value={cableState.maxW}
                      onChange={(event) =>
                        setCableState({ ...cableState, maxW: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max V</Label>
                    <Input
                      type="number"
                      value={cableState.maxV}
                      onChange={(event) =>
                        setCableState({ ...cableState, maxV: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max A</Label>
                    <Input
                      type="number"
                      value={cableState.maxA}
                      onChange={(event) =>
                        setCableState({ ...cableState, maxA: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Connector: {cableState.connector}</span>
                  <span>{cableState.epr ? "EPR cable" : "SPR cable"}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <PlugZap className="h-4 w-4 text-purple-400" />
                Device
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Preset</Label>
                  <Select value={deviceIndex} onChange={(event) => setDeviceIndex(Number(event.target.value))}>
                    {DEVICES.map((device, index) => (
                      <option key={device.name} value={index}>
                        {device.name}
                      </option>
                    ))}
                  </Select>
                  {showNotes && deviceState.notes && (
                    <p className="mt-2 text-xs text-slate-400">{deviceState.notes}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Recommended W</Label>
                    <Input
                      type="number"
                      value={deviceState.recommendedW}
                      onChange={(event) =>
                        setDeviceState({ ...deviceState, recommendedW: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Battery (Wh)</Label>
                    <Input
                      type="number"
                      value={deviceState.batteryWh}
                      onChange={(event) =>
                        setDeviceState({ ...deviceState, batteryWh: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Max V</Label>
                    <Input
                      type="number"
                      value={deviceState.maxV}
                      onChange={(event) =>
                        setDeviceState({ ...deviceState, maxV: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max A</Label>
                    <Input
                      type="number"
                      value={deviceState.maxA}
                      onChange={(event) =>
                        setDeviceState({ ...deviceState, maxA: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deviceState.standards.map((standard) => (
                    <Badge key={standard}>{standard}</Badge>
                  ))}
                </div>
                <div className="text-xs text-slate-400">Connector: {deviceState.connector}</div>
              </div>
            </Card>
          </motion.div>
        </div>

        <Card>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Simulation Results</h2>
                <p className="text-xs text-slate-400">
                  Based on adapter, cable, device, and standard selection.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Label>Show notes</Label>
                <Switch checked={showNotes} onChange={setShowNotes} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">Selected standard</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{simulation.standard}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">Estimated max power</p>
                <p className="mt-2 text-2xl font-semibold text-white">{simulation.estimatedW} W</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">Voltage / Current</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {simulation.estimatedV} V · {simulation.estimatedA} A
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">20% → 80% estimate</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatTime(simulation.estimatedTimeHours)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Recommended power</p>
                <p className="mt-2 text-sm text-slate-200">
                  {simulation.meetsRecommended ? (
                    <span className="text-emerald-400">Meets device recommended wattage</span>
                  ) : (
                    <span className="text-amber-300">Below device recommended wattage</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Bottlenecks</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {simulation.bottlenecks.length === 0 && <li>No major bottlenecks detected.</li>}
                  {simulation.bottlenecks.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">Next actions</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {simulation.nextActions.length === 0 && <li>Everything looks optimal.</li>}
                  {simulation.nextActions.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {simulation.incompatibilities.length > 0 && (
              <Alert>
                <p className="font-semibold">Incompatibilities detected:</p>
                <ul className="mt-2 space-y-1">
                  {simulation.incompatibilities.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
