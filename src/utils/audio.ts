// Web Audio API Synthesizer for high-urgency intrusion sirens & warning beeps
let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenLFO: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let isSirenPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSnakeIntrusionAlarm(durationSeconds = 4): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    // High urgency emergency warble siren (700Hz to 1400Hz oscillating at 5Hz)
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(950, now);

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(4.5, now); // 4.5 pulses per second
    lfoGain.gain.setValueAtTime(380, now); // frequency modulation depth

    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + durationSeconds);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);

    lfo.stop(now + durationSeconds);
    osc.stop(now + durationSeconds);
  } catch (e) {
    console.warn("Audio Context playback error:", e);
  }
}

export function startContinuousSiren(): () => void {
  if (isSirenPlaying) return stopContinuousSiren;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    sirenOscillator = ctx.createOscillator();
    sirenLFO = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    sirenGain = ctx.createGain();

    sirenOscillator.type = "sawtooth";
    sirenOscillator.frequency.setValueAtTime(900, now);

    sirenLFO.type = "sine";
    sirenLFO.frequency.setValueAtTime(3.5, now);
    lfoGain.gain.setValueAtTime(400, now);

    sirenLFO.connect(sirenOscillator.frequency);

    sirenGain.gain.setValueAtTime(0.01, now);
    sirenGain.gain.linearRampToValueAtTime(0.3, now + 0.2);

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(ctx.destination);

    sirenLFO.start(now);
    sirenOscillator.start(now);
    isSirenPlaying = true;
  } catch (e) {
    console.warn("Continuous siren error:", e);
  }

  return stopContinuousSiren;
}

export function stopContinuousSiren(): void {
  if (!isSirenPlaying || !audioCtx) return;
  try {
    if (sirenGain) {
      sirenGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    }
    setTimeout(() => {
      sirenOscillator?.stop();
      sirenLFO?.stop();
      sirenOscillator?.disconnect();
      sirenLFO?.disconnect();
      sirenGain?.disconnect();
      sirenOscillator = null;
      sirenLFO = null;
      sirenGain = null;
      isSirenPlaying = false;
    }, 120);
  } catch (e) {
    console.warn("Error stopping siren:", e);
  }
}

export function playAcknowledgeBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn("Audio beep error:", e);
  }
}

export function playTelemetryWarningAlert(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.12);
    osc.frequency.setValueAtTime(880, now + 0.24);
    osc.frequency.setValueAtTime(660, now + 0.36);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    console.warn("Telemetry warning beep error:", e);
  }
}

