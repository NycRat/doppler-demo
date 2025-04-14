const frequencyEl = document.getElementById("frequency");

frequencyEl.innerText = "???";

const startButton = document.getElementById("start-button");
const showGraphButton = document.getElementById("show-graph-button");
const output = document.getElementById("output");
const body = document.getElementById("body");

const targetFrequencyInput = document.getElementById("frequency-input");
const sensitivityInput = document.getElementById("sensitivity-input");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const history = [];
let shown = false;

canvas.style.visibility = "hidden";

showGraphButton.onclick = () => {
  if (canvas.style.visibility == "hidden") {
    shown = true;
    canvas.style.visibility = "visible";
  } else {
    shown = false;
    canvas.style.visibility = "hidden";
  }
};

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
    if (shown) {
      frequencyEl.textContent = dominantFreq.toFixed(2);
    } else {
      frequencyEl.textContent = "???";
    }

    let targetFrequency = parseInt(targetFrequencyInput.value);
    let targetRange = (100 - parseInt(sensitivityInput.value)) / 10;

    if (dominantFreq > targetFrequency + targetRange) {
      body.style.setProperty("--bg", "red");
    } else if (dominantFreq < targetFrequency - targetRange) {
      body.style.setProperty("--bg", "blue");
    } else {
      body.style.setProperty("--bg", "yellow");
    }

    // constant update canvas width / height
    const width = canvas.width;
    const height = canvas.height;

    history.push(dominantFreq);
    if (history.length > width) {
      history.shift(); // keep the graph scrolling
    }

    // Draw
    const maxFrequency = targetFrequency + targetRange * 3;
    const minFrequency = targetFrequency - targetRange * 3;

    const clamped = Math.max(minFrequency, Math.min(history[0], maxFrequency));
    const normalized = (clamped - minFrequency) / (maxFrequency - minFrequency);
    const y = height - normalized * height;

    const boundY =
      height -
      ((targetFrequency + targetRange - minFrequency) /
        (maxFrequency - minFrequency)) *
        height;
    const boundY2 =
      height -
      ((targetFrequency - targetRange - minFrequency) /
        (maxFrequency - minFrequency)) *
        height;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, y);

    for (let x = 1; x < history.length; x++) {
      const f2 = history[x];

      const y2 =
        height -
        ((Math.min(f2, maxFrequency) - minFrequency) /
          (maxFrequency - minFrequency)) *
          height;

      // Line segment
      ctx.lineTo(x, y2);
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // fill
    for (let x = 1; x < history.length; x++) {
      const f1 = history[x - 1];
      const f2 = history[x];

      const y1 =
        height -
        ((Math.min(f1, maxFrequency) - minFrequency) /
          (maxFrequency - minFrequency)) *
          height;
      const y2 =
        height -
        ((Math.min(f2, maxFrequency) - minFrequency) /
          (maxFrequency - minFrequency)) *
          height;

      // Check if both points are above the secondary bound
      if (
        f1 > targetRange + targetFrequency &&
        f2 > targetFrequency + targetRange
      ) {
        ctx.beginPath();
        ctx.moveTo(x - 1, y1);
        ctx.lineTo(x, y2);
        ctx.lineTo(x, boundY);
        ctx.lineTo(x - 1, boundY);
        ctx.closePath();
        ctx.fillStyle = "#ff0000";
        ctx.fill();
      }
    }

    // fill bottom
    for (let x = 1; x < history.length; x++) {
      const f1 = history[x - 1];
      const f2 = history[x];

      const y1 =
        height -
        ((Math.min(f1, maxFrequency) - minFrequency) /
          (maxFrequency - minFrequency)) *
          height;
      const y2 =
        height -
        ((Math.min(f2, maxFrequency) - minFrequency) /
          (maxFrequency - minFrequency)) *
          height;

      // Check if both points are below the lower bound
      if (
        f1 < targetFrequency - targetRange &&
        f2 < targetFrequency - targetRange
      ) {
        ctx.beginPath();
        ctx.moveTo(x - 1, y1);
        ctx.lineTo(x, y2);
        ctx.lineTo(x, boundY2);
        ctx.lineTo(x - 1, boundY2);
        ctx.closePath();
        ctx.fillStyle = "#0000ff";
        ctx.fill();
      }
    }

    // draw bound lines
    ctx.beginPath();
    ctx.moveTo(0, boundY);
    ctx.lineTo(width, boundY);
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(0, boundY2);
    ctx.lineTo(width, boundY2);
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    requestAnimationFrame(findDominantFrequency);
  }

  findDominantFrequency();
};

function updateCanvasSize() {
  canvas.width = window.innerWidth * 0.4;
  canvas.height = window.innerHeight * 0.9;
}

updateCanvasSize();

window.addEventListener("resize", updateCanvasSize);
