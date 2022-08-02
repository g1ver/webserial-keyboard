import { WebSerialInterface } from "./modules/webSerial.js";
import notes_data from "../json/notes.json" assert { type: "json" };
import keys_data from "../json/keys.json" assert { type: "json" };

let selectedNote = "X";
const wsi = new WebSerialInterface();
buildSynth();

// TODO: fix button padding with note,
// play note when pressing recorded note, 
// figure out datastructure to hold songs

document.getElementById("conn-btn").addEventListener("click", async () => {
    wsi.connState ? await clickDisconnect() : await clickConnect();
});

document.getElementById("set-settings").addEventListener("click", () => {
    buildSheet();
});

async function clickConnect() {
    const filters = [{ usbVendorId: 0x2341, usbProductId: 0x0043 }];

    await wsi.connect(filters);
    deviceInfoUI(wsi.portInfo);
    updateConnButton();
    await wsi.receiveSerial();
}

async function clickDisconnect() {
    await wsi.disconnect();
    disconnectUI();
    updateConnButton();
    clearRecorded();
}

async function changeSelectedNote(freq) {
    selectedNote = noteStringFromFreq(freq);
    renderSelectedNote();
}

function noteStringFromFreq(freq) {
    const notes = populateNotesMap(notes_data);
    let note;
    for (let entry of notes) {
        const octaves = entry[1];
        note = entry[0];
        if (octaves.includes(freq)) {
            return `${note}${octaves.indexOf(freq) + 1}`
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
function renderSelectedNote() {
    document.getElementById(
        "selected-note"
    ).innerText = `Selected Note: ${selectedNote}`;
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
                await wsi.sendSerial(freq);
                await changeSelectedNote(freq);
            });
            button.addEventListener("mouseup", async () => {
                await wsi.sendSerial("END");
            });
            div.appendChild(button);
            note++;
        });
    });
}

function buildSheet() {
    const MEASURES_PER_LINE = 3;
    const BEATS_PER_MEASURE = 4;
    const tempo = 120;
    const duration = 60;

    const measures = ((duration / 60) * tempo) / BEATS_PER_MEASURE;
    const measureRows = measures / MEASURES_PER_LINE;

    const table = document.getElementById("music-table");

    let buttonId = 1;

    for (let i = 0; i < measureRows; i++) {
        const measureRow = document.createElement("tr");
        measureRow.id = "measure-" + i;

        for (let j = 0; j < MEASURES_PER_LINE; j++) {
            const measure = document.createElement("td");

            for (let k = 0; k < BEATS_PER_MEASURE; k++) {
                const button = document.createElement("button");
                button.id = "sheet-" + buttonId;
                button.innerText = "X";
                button.className = "btn btn-dark";
                button.addEventListener('click', () => {
                    button.innerText = selectedNote;
                });
                button.addEventListener('dblclick', () => {
                    button.innerText = "X";
                });
                measure.appendChild(button);
                buttonId++;
            }

            measureRow.appendChild(measure);
        }

        table.appendChild(measureRow);
    }
}

function updateConnButton() {
    const button = document.getElementById("conn-btn");
    const note_buttons = Array.from(
        document.getElementsByClassName("note-btn")
    );
    if (wsi.connState) {
        button.innerHTML = "Disconnect";
        button.className = "btn btn-warning my-1";
        note_buttons.forEach((btn) => (btn.disabled = false));
    } else {
        button.innerHTML = "Connect";
        button.className = "btn btn-success my-1";
        note_buttons.forEach((btn) => (btn.disabled = true));
    }
}

function disconnectUI() {
    const device_info = document.getElementById("device-info");

    if (device_info) {
        device_info.remove();
    }
}

function deviceInfoUI(portInfo) {
    const header = document.getElementById("setup-div");
    const t = document.createElement("p");
    t.id = "device-info";
    t.className = "m-2 text-light font-monospace fw-light d-inline text-muted";
    t.innerHTML = `[Device] 0x${portInfo.usbVendorId.toString(
        16
    )}:0x${portInfo.usbProductId.toString(16)}`;
    header.appendChild(t);
}
