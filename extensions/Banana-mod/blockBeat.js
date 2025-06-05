class BlockBeat {
  constructor() {
    this.audioCtx = null;
    this.scriptNode = null;
    this.t = 0;
  }

  getInfo() {
    return {
      id: 'blockBeat',
      name: 'BlockBeat',
      color1: '#a040a0', // Purple main color
      color2: '#803080', // Darker purple
      color3: '#c060c0', // Lighter purple
      blocks: [
        {
          opcode: 'playBytebeat',
          blockType: Scratch.BlockType.COMMAND,
          text: 'Play bytebeat [FORMULA] at [HZ] Hz',
          arguments: {
            FORMULA: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: '((t>>10)&42)*t'
            },
            HZ: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 8000
            }
          }
        },
        {
          opcode: 'stopBytebeat',
          blockType: Scratch.BlockType.COMMAND,
          text: 'Stop bytebeat'
        }
      ]
    };
  }

  playBytebeat(args) {
    const formula = args.FORMULA;
    const userSampleRate = parseInt(args.HZ);
    if (isNaN(userSampleRate) || userSampleRate <= 0) {
      console.warn("Invalid sample rate.");
      return;
    }

    this.stopBytebeat();

    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    this.t = 0;

    const outputSampleRate = this.audioCtx.sampleRate;
    const samplesPerTick = userSampleRate / outputSampleRate;

    const bufferSize = 4096;
    this.scriptNode = this.audioCtx.createScriptProcessor(bufferSize, 0, 1);

    this.scriptNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        let tSample = Math.floor(this.t);
        let value;
        try {
          let t = tSample;
          value = eval(formula);
        } catch (err) {
          console.error("Error in formula:", err);
          value = 0;
        }
        // Clamp to [-1, 1]
        output[i] = ((value & 255) - 128) / 128;
        this.t += samplesPerTick;
      }
    };

    this.scriptNode.connect(this.audioCtx.destination);
  }

  stopBytebeat() {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
  }
}

Scratch.extensions.register(new BlockBeat());
