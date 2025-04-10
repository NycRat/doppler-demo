const frequencyEl = document.getElementById("frequency");

frequencyEl.innerText = "???";

const startButton = document.getElementById("startButton");
const output = document.getElementById("output");
const body = document.getElementById("body");

startButton.onclick = async () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048 * 2;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  const sampleRate = audioContext.sampleRate;

  function findDominantFrequency() {
    analyser.getByteFrequencyData(dataArray);

    let maxIndex = 0;
    let maxValue = -Infinity;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    const nyquist = sampleRate / 2;
    const binWidth = nyquist / bufferLength;

    // const freqResolution = nyquist / bufferLength;
    // const dominantFreq = maxIndex * freqResolution;

    // Parabolic interpolation
    const y1 = dataArray[maxIndex - 1];
    const y2 = dataArray[maxIndex];
    const y3 = dataArray[maxIndex + 1];

    const denom = y1 - 2 * y2 + y3;
    const delta = denom !== 0 ? (0.5 * (y1 - y3)) / denom : 0;
    const interpolatedIndex = maxIndex + delta;

    const dominantFreq = interpolatedIndex * binWidth;

    // output.textContent = `Dominant Frequency: ${dominantFreq.toFixed(2)} Hz (Amplitude: ${maxValue})`;
    frequencyEl.textContent = dominantFreq.toFixed(2);

    let center = 386;
    let range = 2;

    if (dominantFreq > center + range) {
      body.style.setProperty("--bg", "red");
    } else if (dominantFreq < center - range) {
      body.style.setProperty("--bg", "blue");
    } else {
      body.style.setProperty("--bg", "white");
    }

    requestAnimationFrame(findDominantFrequency);
  }

  findDominantFrequency();
};
