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
import type {
  AdapterSpec,
  CableSpec,
  DeviceSpec,
  MessageDescriptor,
  MessageKey,
  SimulationResult,
  Standard,
} from "./types";
import { BatteryCharging, Bolt, PlugZap, Zap } from "lucide-react";
import en from "./i18n/en";
import ja from "./i18n/ja";

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
  reasons: MessageDescriptor[];
};

type Language = "en" | "ja";
const translations = { en, ja } satisfies Record<Language, Record<MessageKey, string>>;

const formatMessage = (template: string, values?: Record<string, number | string>) => {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
};

const createTranslator = (language: Language) => (key: MessageKey, values?: MessageDescriptor["values"]) =>
  formatMessage(translations[language][key], values);

const getConnectorCompatibility = (
  adapter: AdapterSpec,
  cable: CableSpec,
  device: DeviceSpec
): StandardCompatibility => {
  const reasons: MessageDescriptor[] = [];
  const requiresUsbC = cable.connector.includes("USB-C");
  const requiresUsbA = cable.connector.includes("USB-A");

  if (requiresUsbC && !adapter.ports.includes("USB-C")) {
    reasons.push({ key: "adapterLacksUsbC" });
  }
  if (requiresUsbA && !adapter.ports.includes("USB-A")) {
    reasons.push({ key: "adapterLacksUsbA" });
  }

  if (device.connector === "USB-C" && !cable.connector.includes("USB-C")) {
    reasons.push({ key: "deviceNeedsUsbC" });
  }
  if (device.connector === "Lightning" && !cable.connector.includes("Lightning")) {
    reasons.push({ key: "deviceNeedsLightning" });
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
  const reasons: MessageDescriptor[] = [];
  const connectorCompatibility = getConnectorCompatibility(adapter, cable, device);
  if (!connectorCompatibility.compatible) {
    reasons.push(...connectorCompatibility.reasons);
  }

  if (!adapter.standards.includes(standard)) {
    reasons.push({ key: "adapterNoStandard" });
  }
  if (!device.standards.includes(standard)) {
    reasons.push({ key: "deviceNoStandard" });
  }

  const usesUsbA = cable.connector.includes("USB-A");
  if (usesUsbA && !isStandardAllowedOnUsbA(standard)) {
    reasons.push({ key: "usbACableNoPd" });
  }

  if (standard === "USB PD 3.1 EPR" && !cable.epr) {
    reasons.push({ key: "eprRequiresCable" });
  }

  if (standard === "USB PD 3.1 EPR" && Math.min(adapter.maxV, device.maxV) < 28) {
    reasons.push({ key: "eprRequiresVoltage" });
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

  const bottlenecks: MessageDescriptor[] = [];
  if (adapter.maxW < device.recommendedW) {
    bottlenecks.push({ key: "bottleneckAdapterCaps", values: { maxW: adapter.maxW } });
  }
  if (cable.maxW < device.recommendedW) {
    bottlenecks.push({ key: "bottleneckCableCaps", values: { maxW: cable.maxW } });
  }
  if (deviceMaxW < device.recommendedW) {
    bottlenecks.push({ key: "bottleneckDeviceCurve" });
  }
  if (standard === "USB PD 3.1 EPR" && !cable.epr) {
    bottlenecks.push({ key: "bottleneckEprCable" });
  }
  if (usesUsbA && !isStandardAllowedOnUsbA(standard)) {
    bottlenecks.push({ key: "bottleneckUsbAPd" });
  }

  const nextActions: MessageDescriptor[] = [];
  if (adapter.maxW < device.recommendedW) {
    nextActions.push({ key: "actionUpgradeAdapter" });
  }
  if (cable.maxW < device.recommendedW) {
    nextActions.push({ key: "actionHigherRatedCable" });
  }
  if (standard === "USB PD 3.1 EPR" && !cable.epr) {
    nextActions.push({ key: "actionUseEprCable" });
  }
  if (usesUsbA) {
    nextActions.push({ key: "actionSwitchUsbC" });
  }
  if (!meetsRecommended) {
    nextActions.push({ key: "actionLowerExpectations" });
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

const formatTime = (hours: number, t: ReturnType<typeof createTranslator>) => {
  if (hours <= 0) return t("notAvailable");
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return t("timeFormat", { hrs, mins });
};

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
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
  const t = useMemo(() => createTranslator(language), [language]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-4 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase text-slate-300">
            <Bolt className="h-4 w-4 text-sky-400" />
            {t("appBadge")}
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            {t("appTitle")}
          </h1>
          <p className="text-sm text-slate-400 md:text-base">
            {t("appSubtitle")}
          </p>
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300">
            <span className="text-xs font-medium text-slate-300">{t("languageLabel")}</span>
            <Select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </Select>
          </div>
        </header>

        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <PlugZap className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">{t("standardSelectionTitle")}</p>
                <p className="text-xs text-slate-400">{t("standardSelectionSubtitle")}</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-72">
              <Select
                value={standardSelection}
                onChange={(event) => setStandardSelection(event.target.value as StandardSelection)}
              >
                <option value="Auto">{t("standardAutoRecommended")}</option>
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
                {t("powerAdapter")}
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t("preset")}</Label>
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
                    <Label>{t("maxW")}</Label>
                    <Input
                      type="number"
                      value={adapterState.maxW}
                      onChange={(event) =>
                        setAdapterState({ ...adapterState, maxW: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("maxV")}</Label>
                    <Input
                      type="number"
                      value={adapterState.maxV}
                      onChange={(event) =>
                        setAdapterState({ ...adapterState, maxV: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("maxA")}</Label>
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
                  {t("ports", { ports: adapterState.ports.join(", ") })}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <BatteryCharging className="h-4 w-4 text-emerald-400" />
                {t("chargingCable")}
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t("preset")}</Label>
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
                    <Label>{t("maxW")}</Label>
                    <Input
                      type="number"
                      value={cableState.maxW}
                      onChange={(event) =>
                        setCableState({ ...cableState, maxW: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("maxV")}</Label>
                    <Input
                      type="number"
                      value={cableState.maxV}
                      onChange={(event) =>
                        setCableState({ ...cableState, maxV: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("maxA")}</Label>
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
                  <span>{t("connector", { connector: cableState.connector })}</span>
                  <span>{cableState.epr ? t("eprCable") : t("sprCable")}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <PlugZap className="h-4 w-4 text-purple-400" />
                {t("device")}
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t("preset")}</Label>
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
                    <Label>{t("recommendedW")}</Label>
                    <Input
                      type="number"
                      value={deviceState.recommendedW}
                      onChange={(event) =>
                        setDeviceState({ ...deviceState, recommendedW: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("batteryWh")}</Label>
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
                    <Label>{t("maxV")}</Label>
                    <Input
                      type="number"
                      value={deviceState.maxV}
                      onChange={(event) =>
                        setDeviceState({ ...deviceState, maxV: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("maxA")}</Label>
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
                <div className="text-xs text-slate-400">
                  {t("connector", { connector: deviceState.connector })}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <Card>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{t("simulationResults")}</h2>
                <p className="text-xs text-slate-400">{t("simulationSubtitle")}</p>
              </div>
              <div className="flex items-center gap-3">
                <Label>{t("showNotes")}</Label>
                <Switch checked={showNotes} onChange={setShowNotes} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">{t("selectedStandard")}</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{simulation.standard}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">{t("estimatedMaxPower")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{simulation.estimatedW} W</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">{t("voltageCurrent")}</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {simulation.estimatedV} V · {simulation.estimatedA} A
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400">{t("estimateTime")}</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatTime(simulation.estimatedTimeHours, t)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">{t("recommendedPower")}</p>
                <p className="mt-2 text-sm text-slate-200">
                  {simulation.meetsRecommended ? (
                    <span className="text-emerald-400">{t("meetsRecommended")}</span>
                  ) : (
                    <span className="text-amber-300">{t("belowRecommended")}</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">{t("bottlenecks")}</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {simulation.bottlenecks.length === 0 && <li>{t("noBottlenecks")}</li>}
                  {simulation.bottlenecks.map((item, index) => (
                    <li key={`${item.key}-${index}`}>• {t(item.key, item.values)}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">{t("nextActions")}</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {simulation.nextActions.length === 0 && <li>{t("everythingOptimal")}</li>}
                  {simulation.nextActions.map((item, index) => (
                    <li key={`${item.key}-${index}`}>• {t(item.key, item.values)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {simulation.incompatibilities.length > 0 && (
              <Alert>
                <p className="font-semibold">{t("incompatibilitiesDetected")}</p>
                <ul className="mt-2 space-y-1">
                  {simulation.incompatibilities.map((item, index) => (
                    <li key={`${item.key}-${index}`}>• {t(item.key, item.values)}</li>
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
