let sndctx;
let source;
let startTime = 0;
let pausedAt = 0;
let audioBuffer;
let isPlaying = false;

let currentFormula = 0;

function play() {
    const sr = 48000;
    const len = Number(document.getElementById("tim").value) || 30;
    const faksr = Number(document.getElementById("sr").value) || 8000;

    let cod = document.getElementById("t").value;
    if (!cod) {
        cod = bytebeats[currentFormula];
        currentFormula = (currentFormula + 1) % bytebeats.length;
        document.getElementById("t").value = cod;
    }

    if (!sndctx) sndctx = new AudioContext();

    if (!audioBuffer || source === null) {
        const dat = new Float32Array(sr * len);
        for (let i = 0; i < dat.length; i++) {
            let t = i / 48000 * faksr | 0;
            try {
                dat[i] = (eval(cod) & 255) / 128 - 0.5 || 0;
            } catch (err) {
                console.error("Bytebeat error at t=" + i, err);
                dat[i] = 0;
            }
        }

        audioBuffer = sndctx.createBuffer(1, sr * len, sr);
        const chd = audioBuffer.getChannelData(0);
        for (let i = 0; i < sr * len; i++) chd[i] = dat[i];
    }

    if (!isPlaying) {
        source = sndctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(sndctx.destination);
        startTime = sndctx.currentTime - pausedAt;
        source.start(0, pausedAt);
        source.onended = () => {
            pausedAt = 0;
            isPlaying = false;
            document.getElementById("playBtn").innerText = "Play";
        };
        isPlaying = true;
        document.getElementById("playBtn").innerText = "Pause";
    } else {
        source.stop();
        pausedAt = sndctx.currentTime - startTime;
        source = null;
        isPlaying = false;
        document.getElementById("playBtn").innerText = "Resume";
    }
}

function rewind() {
    if (source) {
        source.stop();
        source = null;
    }
    pausedAt = 0;
    isPlaying = false;
    document.getElementById("playBtn").innerText = "Play";
}
