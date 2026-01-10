/**
 * Noise Gate AudioWorklet Processor
 *
 * Implements a noise gate with:
 * - RMS calculation for level detection
 * - Envelope follower with configurable attack/release
 * - dB threshold comparison
 * - Smooth gain transitions to avoid clicks/pops
 */
class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Default parameters
    this.threshold = -40; // dB
    this.attackTime = 0.005; // 5ms - faster attack for responsive voice
    this.releaseTime = 0.25; // 250ms - slightly longer to avoid cutting words
    this.holdTime = 0.1; // 100ms hold before release (increased to catch trailing sounds)

    // State
    this.envelope = 0;
    this.currentGain = 0;
    this.holdCounter = 0;
    this.isOpen = false;

    // Listen for parameter updates from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;

      if (type === 'setParams') {
        if (data.threshold !== undefined) this.threshold = data.threshold;
        if (data.attackTime !== undefined) this.attackTime = data.attackTime;
        if (data.releaseTime !== undefined) this.releaseTime = data.releaseTime;
      }
    };
  }

  /**
   * Calculate RMS (Root Mean Square) of audio samples
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

  /**
   * Process audio block
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // If no input, pass silence
    if (!input || !input.length || !input[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = inputChannel.length;

    // Calculate RMS of input block
    const rms = this.calculateRMS(inputChannel);
    const dbLevel = this.linearToDb(rms);

    // Calculate attack/release coefficients based on sample rate
    const attackCoeff = 1 - Math.exp(-1 / (sampleRate * this.attackTime));
    const releaseCoeff = 1 - Math.exp(-1 / (sampleRate * this.releaseTime));

    // Determine if gate should be open
    const shouldOpen = dbLevel > this.threshold;

    // Update envelope with attack/release
    if (shouldOpen) {
      this.envelope += attackCoeff * (1 - this.envelope);
      this.holdCounter = this.holdTime * sampleRate;
      this.isOpen = true;
    } else {
      if (this.holdCounter > 0) {
        this.holdCounter -= blockSize;
      } else {
        this.envelope += releaseCoeff * (0 - this.envelope);
        if (this.envelope < 0.001) {
          this.isOpen = false;
        }
      }
    }

    // Apply gain with smoothing
    const targetGain = this.envelope;

    for (let i = 0; i < blockSize; i++) {
      // Smooth gain transition sample-by-sample
      const smoothingCoeff = 0.01;
      this.currentGain += smoothingCoeff * (targetGain - this.currentGain);
      outputChannel[i] = inputChannel[i] * this.currentGain;
    }

    // Send state to main thread (throttled to every ~50ms)
    if (currentFrame % Math.floor(sampleRate * 0.05) < blockSize) {
      this.port.postMessage({
        type: 'gateState',
        data: {
          isOpen: this.isOpen,
          level: dbLevel,
          gain: this.currentGain,
        },
      });
    }

    return true;
  }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);
