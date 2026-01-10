/**
 * Voice Activity Detection (VAD) AudioWorklet Processor
 *
 * Implements VAD with:
 * - RMS level calculation
 * - Temporal smoothing
 * - Hysteresis to prevent flickering (+3dB/-3dB of threshold)
 * - Voice state reporting to main thread
 */
class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Parameters
    this.threshold = -35; // dB - base threshold
    this.hysteresis = 4; // dB - hysteresis range (increased for better noise rejection)
    this.smoothingFactor = 0.85; // Temporal smoothing (reduced for faster response)

    // State
    this.smoothedLevel = -100;
    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.lastReportTime = 0;

    // Listen for parameter updates
    this.port.onmessage = (event) => {
      const { type, data } = event.data;

      if (type === 'setParams') {
        if (data.threshold !== undefined) this.threshold = data.threshold;
        if (data.hysteresis !== undefined) this.hysteresis = data.hysteresis;
        if (data.smoothingFactor !== undefined) this.smoothingFactor = data.smoothingFactor;
      }
    };
  }

  /**
   * Calculate RMS of audio samples
   */
  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Convert linear amplitude to dB
   */
  linearToDb(linear) {
    if (linear <= 0) return -100;
    return 20 * Math.log10(linear);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Pass-through audio
    if (input && input[0]) {
      for (let channel = 0; channel < output.length; channel++) {
        if (input[channel] && output[channel]) {
          output[channel].set(input[channel]);
        }
      }

      // Calculate current level
      const rms = this.calculateRMS(input[0]);
      const currentLevel = this.linearToDb(rms);

      // Apply temporal smoothing
      this.smoothedLevel = this.smoothingFactor * this.smoothedLevel +
        (1 - this.smoothingFactor) * currentLevel;

      // Apply hysteresis for voice detection
      const upperThreshold = this.threshold + this.hysteresis;
      const lowerThreshold = this.threshold - this.hysteresis;

      const wasSpeaking = this.isSpeaking;

      if (this.isSpeaking) {
        // Currently speaking - use lower threshold to stop
        if (this.smoothedLevel < lowerThreshold) {
          this.isSpeaking = false;
        }
      } else {
        // Not speaking - use upper threshold to start
        if (this.smoothedLevel > upperThreshold) {
          this.isSpeaking = true;
          this.speechStartTime = currentTime;
        }
      }

      // Report state change or periodically (every ~100ms)
      const now = currentTime;
      if (wasSpeaking !== this.isSpeaking || now - this.lastReportTime > 0.1) {
        this.lastReportTime = now;
        this.port.postMessage({
          type: 'vadState',
          data: {
            isSpeaking: this.isSpeaking,
            level: this.smoothedLevel,
            rawLevel: currentLevel,
          },
        });
      }
    }

    return true;
  }
}

registerProcessor('vad-processor', VADProcessor);
