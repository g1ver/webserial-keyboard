import { WebSerialInterface } from "./modules/webSerial.js";
import notes_data from "../json/notes.json" assert { type: "json" };
import keys_data from "../json/keys.json" assert { type: "json" };
import { RecorderState } from "./modules/sheetMusic.js";

// TODO:
// play note when pressing recorded note,
// time signatures (maybe select common ones to not worry about fractional notes?)
// may have to redo the whole sheet builder though
// error checking is lacking, but I may not have enough time...

let selectedNote = {
    note: "X",
    freq: 0,
};

let debugSwitch = false;
let setState = false;
let debugMessages = [];
const wsi = new WebSerialInterface(debugMessage);
const recorder = new RecorderState(wsi, debugMessage);
buildSynth();

async function debugMessage(message) {
    const time = new Date();
    const timestamp = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;
    debugMessages.push(`${timestamp} ${message}`);
    drawDebug();
}

document.getElementById("conn-btn").addEventListener("click", async () => {
    wsi.connState ? await clickDisconnect() : await clickConnect();
});

document.getElementById("set-settings").addEventListener("click", () => {
    setUpdateUI();
    buildSheet();
});

document.getElementById("play-btn").addEventListener("click", async () => {
    await debugMessage("[*] Building song.");
    recorder.buildSongArr();
    recorder.playSong();
});

document.getElementById("debug-switch").addEventListener("click", () => {
    debugSwitch = !debugSwitch;
    renderDebugWindow();
});

document.getElementById("filter-select").addEventListener("click", () => {
    drawDebug();
});

document.getElementById('stop-btn').addEventListener("click", () => {
    recorder.stopButton();
});

async function clickConnect() {
    const filters = [{ usbVendorId: 0x2341, usbProductId: 0x0043 }]; // arduino uno
    await wsi.connect(filters);
    deviceInfoUI(wsi.portInfo);
    updateConnButton();
    await debugMessage("[*] Connected.");
    await wsi.receiveSerial();
}

async function clickDisconnect() {
    await wsi.disconnect();
    await debugMessage("[*] Disconnected.");
    disconnectUI();
    updateConnButton();
}

async function changeSelectedNote(freq) {
    selectedNote.note = noteStringFromFreq(freq);
    selectedNote.freq = freq;
    renderSelectedNote();
}

function noteStringFromFreq(freq) {
    const notes = populateNotesMap(notes_data);
    let note;
    for (let entry of notes) {
        const octaves = entry[1];
        note = entry[0];
        if (octaves.includes(freq)) {
            return `${note}${octaves.indexOf(freq) + 1}`;
        }
    }
    return null;
}

function populateNotesMap(json_notes) {
    const notes = new Map(
        Object.entries(JSON.parse(JSON.stringify(json_notes)))
    );
    return notes;
}

function orderedNotes(json_notes) {
    const notes = Object.entries(JSON.parse(JSON.stringify(json_notes)));
    const flattened = Array.from(notes, (arr) => arr[1])
        .flat()
        .sort((a, b) => a - b);
    return flattened;
}

/**
 * UI FUNCTIONS
 */
function setUpdateUI() {
    const setButton = document.getElementById("set-settings");
    if (setState) {
        const table = document.getElementById("music-table");

        while (table.lastChild) {
            table.removeChild(table.lastChild);
        }

        setState = false;
        debugMessage("[*] Reset composer.");
    } else {
        setButton.innerText = "Reset";
    }
}

function drawDebug() {
    const debugWindow = document.getElementById("debug-text");
    let debugString = "";
    const textSelect = document.getElementById("filter-select");
    const textSelectOption =
        textSelect.options[textSelect.selectedIndex].innerText;
    const debugFiltered = debugMessages.filter((msg) => {
        if (textSelectOption === "filters" || msg.includes("[*]")) return true;
        return msg.includes(textSelectOption);
    });

    debugFiltered.reverse();
    debugFiltered.forEach((msg) => {
        debugString = debugString.concat(msg + "<br>");
    });

    debugWindow.innerHTML = debugString;
}

function renderSelectedNote() {
    document.getElementById(
        "selected-note"
    ).innerText = `Selected Note: ${selectedNote.note}`;
}

function renderDebugWindow() {
    const hiddenDiv = document.getElementById("debug-div");
    if (debugSwitch) {
        hiddenDiv.hidden = false;
    } else {
        hiddenDiv.hidden = true;
    }
}

function buildSynth() {
    const synth = document.getElementById("synthesizer-keyboard");
    const keys = JSON.parse(JSON.stringify(keys_data))["keys"];
    const notes = orderedNotes(notes_data);

    let note = 0;
    keys.forEach((octave) => {
        const div = document.createElement("div");
        div.className = "piano-octave";
        synth.appendChild(div);
        [...octave].forEach((key) => {
            const button = document.createElement("button");
            const freq = notes[note];
            button.id = freq;
            button.type = "button";
            button.className =
                key === "w"
                    ? "white-note btn btn-outline-dark shadow-lg btn-light rounded-0"
                    : "black-note btn btn-outline-light shadow-lg btn-dark rounded-0";
            button.addEventListener("mousedown", async () => {
                await recorder.playNote(freq);
                await changeSelectedNote(freq);
            });
            button.addEventListener("mouseup", async () => {
                await recorder.stopPlaying();
            });
            div.appendChild(button);
            note++;
        });
    });
}

function buildSheet() {
    const MEASURES_PER_LINE = 3;
    const BEATS_PER_MEASURE = 16;
    const NOTE_LENGTH = 1 / BEATS_PER_MEASURE;
    const tempo = 180;
    const duration = 60;

    debugMessage(
        `[*] Building music sheet, tempo ${tempo}, duration ${duration}`
    );

    // TODO: these values need to be rational for the implementation,
    // so change implementation or floor these values

    // duration is in seconds, need minutes
    const measures = ((duration / 60) * tempo) / BEATS_PER_MEASURE;
    const measureRows = measures / MEASURES_PER_LINE;
    const noteAmount = measures * BEATS_PER_MEASURE;

    recorder.setSettings(
        noteAmount,
        duration,
        tempo,
        measures,
        BEATS_PER_MEASURE,
        NOTE_LENGTH
    );

    const table = document.getElementById("music-table");

    let buttonId = 0;

    // TODO: this can be faster, but not enough time
    for (let i = 0; i < measureRows; i++) {
        const measureRow = document.createElement("tr");
        measureRow.id = "measure-" + i;

        for (let j = 0; j < MEASURES_PER_LINE; j++) {
            const measure = document.createElement("td");

            for (let k = 0; k < BEATS_PER_MEASURE; k++) {
                const button = document.createElement("button");
                button.id = "sheet-" + buttonId;
                button.innerText = "X";
                button.className = "btn btn-dark btn-outline-light";
                button.addEventListener("click", () => {
                    button.innerText = selectedNote.note;
                    recorder.updateNote(
                        button.id.split("-")[1],
                        selectedNote.freq
                    );
                });
                button.addEventListener("dblclick", () => {
                    button.innerText = "X";
                    recorder.updateNote(button.id.split("-")[1], "X");
                });
                measure.appendChild(button);
                buttonId++;
            }
            measureRow.appendChild(measure);
        }
        table.appendChild(measureRow);
    }
    setState = true;
}

function updateConnButton() {
    const button = document.getElementById("conn-btn");
    const noteButtons = Array.from(document.getElementsByClassName("note-btn"));
    if (wsi.connState) {
        button.innerHTML = "Disconnect";
        button.className = "btn btn-warning my-1";
        noteButtons.forEach((btn) => (btn.disabled = false));
    } else {
        button.innerHTML = "Connect";
        button.className = "btn btn-success my-1";
        noteButtons.forEach((btn) => (btn.disabled = true));
    }
}

function disconnectUI() {
    const device_info = document.getElementById("device-info");

    if (device_info) {
        device_info.remove();
    }
}

function deviceInfoUI(portInfo) {
    const setupDiv = document.getElementById("setup-div");
    const t = document.createElement("p");
    t.id = "device-info";
    t.className = "m-2 text-light font-monospace fw-light d-inline text-muted";
    t.innerHTML = `[Device] 0x${portInfo.usbVendorId.toString(
        16
    )}:0x${portInfo.usbProductId.toString(16)}`;
    setupDiv.appendChild(t);
}
