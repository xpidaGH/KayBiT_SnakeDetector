import { 
  Pi5TelemetryPoint, 
  Pi5SystemHealthSummary,
  Battery24hPoint,
  BatteryDegradationSummary,
  BatteryPhase
} from "../types";

/**
 * Generate initial time-series history for Pi 5 telemetry (last 30 samples at 2-sec intervals)
 */
export function generateInitialTelemetryHistory(count = 30): Pi5TelemetryPoint[] {
  const points: Pi5TelemetryPoint[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * 2000;
    const timeLabel = new Date(timestamp).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    });

    // Slight organic sine wave + random noise to simulate 4-camera RTSP load
    const baseSine = Math.sin(i * 0.2);
    const cpuTemp = 52.4 + baseSine * 4.2 + (Math.random() * 1.5 - 0.75);
    const npuTemp = 48.1 + baseSine * 3.1 + (Math.random() * 1.2 - 0.6);
    const cpuUsage = 38.5 + baseSine * 12.0 + (Math.random() * 4.0 - 2.0);
    const memoryUsedMB = 3420 + Math.floor(baseSine * 180 + Math.random() * 40);
    const npuLoad = 42.0 + baseSine * 18.0 + (Math.random() * 5.0 - 2.5);
    const pcieBandwidth = 285 + baseSine * 45 + (Math.random() * 15 - 7.5);
    
    // PWM Fan curve: starts spinning gently at 50°C, scales with temp
    let fanRpm = 0;
    if (cpuTemp > 50) {
      fanRpm = Math.floor(1800 + (cpuTemp - 50) * 120 + Math.random() * 50);
    }

    points.push({
      timestamp,
      timeLabel,
      cpuTempC: Math.max(35, Math.min(85, parseFloat(cpuTemp.toFixed(1)))),
      npuTempC: Math.max(30, Math.min(80, parseFloat(npuTemp.toFixed(1)))),
      cpuUsagePercent: Math.max(5, Math.min(100, parseFloat(cpuUsage.toFixed(1)))),
      memoryUsedMB,
      memoryTotalMB: 8192,
      memoryUsagePercent: parseFloat(((memoryUsedMB / 8192) * 100).toFixed(1)),
      npuLoadPercent: Math.max(0, Math.min(100, parseFloat(npuLoad.toFixed(1)))),
      pcieBandwidthMBs: Math.max(50, parseFloat(pcieBandwidth.toFixed(0))),
      fanSpeedRpm: fanRpm,
      voltageV: parseFloat((5.12 + (Math.random() * 0.04 - 0.02)).toFixed(2)),
      powerWatts: parseFloat((4.8 + (npuLoad / 100) * 3.2 + (cpuUsage / 100) * 2.1).toFixed(2)),
      throttledHex: "0x0"
    });
  }

  return points;
}

export function computeSystemHealthSummary(
  history: Pi5TelemetryPoint[],
  currentStressMode: "normal" | "inference_heavy" | "thermal_spike" | "eco_low_power"
): Pi5SystemHealthSummary {
  if (history.length === 0) {
    history = generateInitialTelemetryHistory(1);
  }

  const latest = history[history.length - 1];
  const temps = history.map(p => p.cpuTempC);
  const cpuTempPeak = Math.max(...temps);
  const cpuTempAvg = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));

  // Determine throttling state based on current temperature and stress mode
  let thermalThrottlingActive = false;
  let armFreqCapped = false;
  let underVoltageDetected = false;
  let throttledHex = "0x0";

  if (latest.cpuTempC >= 80 || currentStressMode === "thermal_spike") {
    thermalThrottlingActive = latest.cpuTempC >= 82;
    armFreqCapped = latest.cpuTempC >= 80;
    throttledHex = thermalThrottlingActive ? "0x20004" : "0x20002";
  }

  // Calculate fan duty cycle (RPi active cooler: max 8000 RPM)
  const maxFanRpm = 8000;
  const fanDutyPercent = Math.min(100, Math.round((latest.fanSpeedRpm / maxFanRpm) * 100));

  // Core load simulation
  const coreBase = latest.cpuUsagePercent;
  const core0 = Math.max(2, Math.min(100, Math.round(coreBase * 1.1 + (Math.random() * 6 - 3))));
  const core1 = Math.max(2, Math.min(100, Math.round(coreBase * 0.95 + (Math.random() * 6 - 3))));
  const core2 = Math.max(2, Math.min(100, Math.round(coreBase * 0.85 + (Math.random() * 6 - 3))));
  const core3 = Math.max(2, Math.min(100, Math.round(coreBase * 1.05 + (Math.random() * 6 - 3))));

  return {
    cpuTempCurrentC: latest.cpuTempC,
    cpuTempPeakC: cpuTempPeak,
    cpuTempAvgC: cpuTempAvg,
    thermalThrottlingActive,
    thermalThrottlingEverOccurred: currentStressMode === "thermal_spike" || cpuTempPeak >= 82,
    underVoltageDetected,
    armFreqCapped,
    fanRpm: latest.fanSpeedRpm,
    fanDutyPercent,
    memoryUsedMB: latest.memoryUsedMB,
    memoryTotalMB: 8192,
    memoryPercent: latest.memoryUsagePercent,
    swapUsedMB: 124,
    swapTotalMB: 2048,
    cmaPoolAllocatedMB: 512, // For Hailo-8L & V4L2 buffers
    npuLoadPercent: latest.npuLoadPercent,
    npuTempC: latest.npuTempC,
    npuOpsPerSec: Math.round(latest.npuLoadPercent * 0.13 * 100) / 10, // ~13 TOPS max
    pcieBandwidthMBs: latest.pcieBandwidthMBs,
    pcieLinkGen: 3, // PCIe Gen 3.0 enabled
    powerSupplyVoltageV: latest.voltageV,
    currentDrawA: parseFloat((latest.powerWatts / latest.voltageV).toFixed(2)),
    sdCardWearPercent: 4.2, // High endurance SanDisk Max Endurance
    coreLoads: [core0, core1, core2, core3],
    uptimeSeconds: 1234520,
    vcgencmdThrottledRaw: throttledHex
  };
}

/**
 * Generates 24-hour historical battery telemetry (96 samples at 15-minute intervals)
 */
export function generate24hBatteryHistory(options?: {
  scenario?: "solar_nominal" | "cloudy_rain" | "heavy_inference" | "solar_surplus";
  chemistry?: "12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct";
  cutoffThreshold?: number;
  enableLoadShedding?: boolean;
}): Battery24hPoint[] {
  const scenario = options?.scenario || "solar_nominal";
  const chemistry = options?.chemistry || "12v_lifepo4";
  const cutoffThreshold = options?.cutoffThreshold ?? (
    chemistry === "12v_lifepo4" ? 11.8 :
    chemistry === "12v_lead_acid" ? 11.6 :
    chemistry === "3s_li_ion" ? 10.5 : 4.8
  );
  const enableLoadShedding = options?.enableLoadShedding ?? true;

  const points: Battery24hPoint[] = [];
  const now = Date.now();
  const totalSamples = 96; // 96 samples * 15 min = 24 hours
  const intervalMs = 15 * 60 * 1000;

  // Chemistry scaling parameters
  const chemMultipliers = {
    "12v_lifepo4": { full: 13.6, nominal: 13.1, plateau: 12.8, low: 11.8, empty: 10.5, rInternal: 0.022 },
    "12v_lead_acid": { full: 14.2, nominal: 12.6, plateau: 12.2, low: 11.6, empty: 10.8, rInternal: 0.045 },
    "3s_li_ion": { full: 12.6, nominal: 11.4, plateau: 11.1, low: 10.5, empty: 9.2, rInternal: 0.038 },
    "5v_direct": { full: 5.25, nominal: 5.10, plateau: 4.95, low: 4.80, empty: 4.40, rInternal: 0.060 }
  }[chemistry];

  for (let i = totalSamples; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const date = new Date(timestamp);
    const hour = date.getHours() + date.getMinutes() / 60; // 0.0 to 23.99
    const hourOffset = -(i * 15) / 60; // -24.0 to 0.0
    const timeLabel = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Solar cycle model (Sunrise 06:30, Peak 13:00, Sunset 19:30)
    let solarIrradiance = 0;
    if (hour >= 6.5 && hour <= 19.5) {
      // Gaussian solar curve peak at 13:00
      const hourDelta = Math.abs(hour - 13.0);
      solarIrradiance = Math.max(0, Math.cos((hourDelta / 6.5) * (Math.PI / 2)));
    }

    let solarWatts = 0;
    if (scenario === "solar_nominal") {
      solarWatts = Math.round(solarIrradiance * 85 * (1 + (Math.random() * 0.1 - 0.05)));
    } else if (scenario === "solar_surplus") {
      solarWatts = Math.round(solarIrradiance * 120 * (1 + (Math.random() * 0.06 - 0.03)));
    } else if (scenario === "cloudy_rain") {
      solarWatts = Math.round(solarIrradiance * 18 * (1 + (Math.random() * 0.2 - 0.1)));
    } else if (scenario === "heavy_inference") {
      solarWatts = Math.round(solarIrradiance * 70 * (1 + (Math.random() * 0.1 - 0.05)));
    }

    const isNight = solarWatts < 5;

    // Load watts calculation (Full load: ~19W with 4 cameras + RPi5 + NPU; Shedded: ~9.5W)
    let baseLoadWatts = 17.5;
    if (scenario === "heavy_inference") baseLoadWatts = 23.0;
    if (scenario === "solar_surplus") baseLoadWatts = 16.0;

    // Phase determination
    let phase: BatteryPhase = "night_plateau";
    if (hour >= 6.5 && hour < 9.0) phase = "dawn_ramp";
    else if (hour >= 9.0 && hour < 14.0) phase = "solar_bulk_charge";
    else if (hour >= 14.0 && hour < 18.0) phase = "solar_float";
    else if (hour >= 18.0 && hour < 22.0) phase = "sunset_drain";
    else if (hour >= 22.0 || hour < 4.0) phase = "night_plateau";
    else phase = "pre_dawn_critical";

    // Base state of charge (SoC %) simulation over 24h
    let baseSoc = 75;
    if (hour >= 13 && hour <= 17) {
      baseSoc = scenario === "cloudy_rain" ? 42 : 98;
    } else if (hour > 17 && hour <= 23) {
      const dropHours = hour - 17;
      baseSoc = scenario === "cloudy_rain" ? 42 - dropHours * 4.5 : 98 - dropHours * 3.2;
    } else if (hour > 23 || hour < 6.5) {
      const nightHours = hour > 23 ? (hour - 23) : (hour + 1);
      baseSoc = scenario === "cloudy_rain" ? Math.max(12, 16 - nightHours * 2.8) : Math.max(28, 78 - nightHours * 4.8);
    } else {
      // 06:30 to 13:00 charge ramp
      const rampHours = hour - 6.5;
      baseSoc = scenario === "cloudy_rain" ? Math.min(42, 14 + rampHours * 4.2) : Math.min(98, 48 + rampHours * 8.0);
    }

    if (scenario === "heavy_inference") {
      baseSoc = Math.max(15, baseSoc * 0.85);
    }

    // Convert SoC % to base Open Circuit Voltage (OCV)
    const socFraction = baseSoc / 100;
    let baseOcv = chemMultipliers.empty + (chemMultipliers.full - chemMultipliers.empty) * Math.pow(socFraction, 0.45);
    if (chemistry === "12v_lifepo4") {
      // LiFePO4 has a very flat plateau between 20% and 80% SoC
      if (socFraction > 0.9) baseOcv = 13.3 + (socFraction - 0.9) * 3.0;
      else if (socFraction > 0.2) baseOcv = 12.85 + (socFraction - 0.2) * 0.65;
      else baseOcv = 11.2 + (socFraction / 0.2) * 1.65;
    }

    // Check load shedding trigger
    const wouldDropBelowThreshold = baseOcv < cutoffThreshold;
    const isLoadShedding = enableLoadShedding && (wouldDropBelowThreshold || baseSoc <= 25);

    // Apply load shedding power reduction
    const actualLoadWatts = isLoadShedding ? (baseLoadWatts * 0.52) : baseLoadWatts;
    const netCurrentA = parseFloat(((solarWatts - actualLoadWatts) / Math.max(1, baseOcv)).toFixed(2));

    // Internal resistance voltage drop (V_sag = I_load * R_internal)
    const currentDrawA = actualLoadWatts / Math.max(1, baseOcv);
    const internalResistanceSag = currentDrawA * chemMultipliers.rInternal;
    
    // Effective terminal voltage under load/charge
    let terminalVoltage = baseOcv + (netCurrentA * 0.03) + (Math.random() * 0.03 - 0.015);
    if (terminalVoltage > chemMultipliers.full) terminalVoltage = chemMultipliers.full;
    if (terminalVoltage < chemMultipliers.empty) terminalVoltage = chemMultipliers.empty;

    // Unprotected voltage trajectory (without load shedding)
    let unprotectedV = terminalVoltage;
    if (isLoadShedding) {
      unprotectedV = terminalVoltage - (baseLoadWatts * 0.48 / baseOcv) * 0.25;
      if (unprotectedV < chemMultipliers.empty - 0.5) unprotectedV = chemMultipliers.empty - 0.5;
    }

    // Degraded / Aged Pack trajectory (3x higher internal resistance + 28% capacity loss)
    const agedResistanceSag = currentDrawA * (chemMultipliers.rInternal * 3.8);
    const agedPackV = Math.max(chemMultipliers.empty - 0.8, terminalVoltage - agedResistanceSag * 1.8 - (100 - baseSoc) * 0.006);

    // Cell thermal dynamics (°C)
    const cellTemp = parseFloat((22.0 + (solarWatts / 120) * 12.0 + (currentDrawA * 0.8) + (Math.random() * 0.8 - 0.4)).toFixed(1));

    points.push({
      timestamp,
      timeLabel,
      hourOffset: parseFloat(hourOffset.toFixed(2)),
      voltageV: parseFloat(terminalVoltage.toFixed(2)),
      unprotectedVoltageV: parseFloat(unprotectedV.toFixed(2)),
      agedPackVoltageV: parseFloat(agedPackV.toFixed(2)),
      socPercent: Math.max(0, Math.min(100, Math.round(baseSoc))),
      solarWatts,
      loadWatts: parseFloat(actualLoadWatts.toFixed(1)),
      netCurrentA,
      phase,
      isLoadShedding,
      isNight,
      internalResistanceSagV: parseFloat(internalResistanceSag.toFixed(3)),
      cellTemperatureC: cellTemp
    });
  }

  return points;
}

/**
 * Computes statistical degradation metrics for a 24-hour battery time-series dataset
 */
export function computeBatteryDegradationSummary(
  history: Battery24hPoint[],
  thresholdV = 11.8
): BatteryDegradationSummary {
  if (history.length === 0) {
    history = generate24hBatteryHistory();
  }

  const voltages = history.map(p => p.voltageV);
  const peakVoltageV = Math.max(...voltages);
  const minVoltageV = Math.min(...voltages);
  const voltageDeltaV = parseFloat((peakVoltageV - minVoltageV).toFixed(2));
  const avgVoltageV = parseFloat((voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(2));
  
  const latest = history[history.length - 1];
  const socs = history.map(p => p.socPercent);
  const minSoc = Math.min(...socs);
  const deepestDodPercent = Math.max(0, 100 - minSoc);

  // Time calculations (each sample = 0.25 hours)
  const samplesBelowThreshold = history.filter(p => p.voltageV <= thresholdV).length;
  const hoursBelowThreshold = parseFloat((samplesBelowThreshold * 0.25).toFixed(1));

  const sheddingSamples = history.filter(p => p.isLoadShedding).length;
  const loadSheddingHours = parseFloat((sheddingSamples * 0.25).toFixed(1));

  // Energy integration (Wh = W * 0.25h)
  const energyConsumedWh = Math.round(history.reduce((sum, p) => sum + p.loadWatts * 0.25, 0));
  const energyGeneratedWh = Math.round(history.reduce((sum, p) => sum + p.solarWatts * 0.25, 0));
  const netEnergyWh = energyGeneratedWh - energyConsumedWh;

  // Energy preserved by load shedding (approx 8.5W savings per shedding hour)
  const energyPreservedWh = Math.round(loadSheddingHours * 8.5);
  const additionalRuntimeHours = parseFloat((energyPreservedWh / 9.2).toFixed(1));

  // SOH estimation based on depth of discharge cycle
  const estimatedSohPercent = deepestDodPercent > 80 ? 94.2 : 98.6;
  const cycleFadeRatePercent = parseFloat((0.0003 * Math.pow(deepestDodPercent / 50, 1.8)).toFixed(4));
  const averageInternalResistanceMOhms = Math.round(
    (history.reduce((sum, p) => sum + p.internalResistanceSagV, 0) / history.length) * 1000
  );

  return {
    peakVoltageV,
    minVoltageV,
    voltageDeltaV,
    avgVoltageV,
    currentVoltageV: latest.voltageV,
    currentSocPercent: latest.socPercent,
    deepestDodPercent,
    hoursBelowThreshold,
    loadSheddingHours,
    energyConsumedWh,
    energyGeneratedWh,
    netEnergyWh,
    estimatedSohPercent,
    cycleFadeRatePercent,
    energyPreservedWh,
    additionalRuntimeHours,
    averageInternalResistanceMOhms
  };
}
