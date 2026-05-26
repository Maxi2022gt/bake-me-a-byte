let sndctx;
let source;
let startTime = 0;
let pausedAt = 0;
let audioBuffer;
let isPlaying = false;
let funct = new Function("t","return 0");

min=Math.min;max=Math.max;

// https://stackoverflow.com/questions/56666231/node-js-use-math-methods-without-refer-to-module
// it's changed to support int() expressions and retain Math. prefixes when there is already one
function fixMath(str) {
    str = str.replaceAll("int", "floor");

    return str.replace(
        /[a-z][\d.a-z]*(?=\(|[^\da-z]|$)/ig,
        (k, offset, full) => {
            if (full.slice(offset - 5, offset) === "Math.") {
                return k;
            }

            return (k in Math ? "Math." : "") + k;
        }
    );
}

function play() {
    const sr = 48000;
    const len = Number(document.getElementById("tim").value) || 30;
    const faksr = Number(document.getElementById("sr").value) || 8000;
    
    let cod = document.getElementById("t").value;
    let funct = new Function("t",fixMath(`return ${cod}`));
    let mode = document.getElementById("mode").value;
    if (!sndctx) sndctx = new AudioContext();
    
    if (!audioBuffer || source === null) {
        const dat = new Float32Array(sr * len);
        for (let i = 0; i < dat.length; i++) {
            let t = i / 48000 * faksr | 0;
            try {
                switch (mode) {
                    case "Bytebeat": 
                        dat[i] = (funct(t) & 255) / 128 - 0.5 || 0;
                        break;
                    case "Signed Bytebeat": 
                        dat[i] = (funct(t) + 128 & 255) / 128 - 0.5 || 0;
                        break;
                    case "Floatbeat": 
                        dat[i] = max(min(funct(t)||0,1),-1);
                        break;
                    case "Bitbeat": 
                        dat[i] = (funct(t)&1)*2-1||0;
                        break;
                    case "Bitbeat (Alt)": 
                        dat[i] = (funct(t)>1)*2-1||0;
                        break;
                    case "2048Mode": 
                        dat[i] = (funct(t) & 2047) / 1024 - 0.5 || 0;
                        break;
                }
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
        document.getElementById("playBtn").innerText = "Stop";
    } else {
        source.stop();
        pausedAt = sndctx.currentTime - startTime;
        source = null;
        isPlaying = false;
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

function changeUrl() {
    let url = new URL(window.location.href);
    let info = {form: document.getElementById("t").value, length:Number(document.getElementById("tim").value) || 30, faksr: Number(document.getElementById("sr").value) || 8000, mode: document.getElementById("mode").value};
    let elm = Base64.encodeURI(JSON.stringify(info));
    let encodedForUrl = "v2_"+elm;

    url.searchParams.set("byte",encodedForUrl)

    history.replaceState(null, "", url);
}

function loadUrlData() {
    let params = new URLSearchParams(location.search);

    let raw = params.get("byte");

    if (!raw) return null;

    try {
        if (raw.startsWith("v1_")) {
            return JSON.parse(
                Base64.decode(raw.slice(3))
            );
        }
        else if (raw.startsWith("v2_")) {
            return JSON.parse(
                Base64.decode(raw.slice(3))
            );
        }
    }
    catch (err) {
        console.error("Invalid URL data:", err);
    }

    return null;
}

let data = loadUrlData();

if (data) {
    document.getElementById("t").value = data.form ?? "";
    document.getElementById("tim").value = data.length ?? 30;
    document.getElementById("sr").value = data.faksr ?? 8000;
    document.getElementById("mode").value = data.mode ?? "Bytebeat";
}

document.getElementById("t").addEventListener("input",changeUrl)
document.getElementById("sr").addEventListener("input",changeUrl)
document.getElementById("tim").addEventListener("input",changeUrl)
document.getElementById("mode").onchange = changeUrl;