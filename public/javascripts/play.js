import { WebSerialInterface } from "./modules/webSerial.js";
import notes_data from "./notes.json" assert { type: "json" };

const wsi = new WebSerialInterface();

let notes_played = [];
let freq_played = [];

addNoteButtons();

document.getElementById("conn-btn").addEventListener("click", async () => {
    wsi.connState ? await clickDisconnect() : await clickConnect();
});

document
    .getElementById("play-recorded-btn")
    .addEventListener("click", async () => {
        playRecorded();
    });

document
    .getElementById("clear-recorded-btn")
    .addEventListener("click", async () => {
        clearRecorded();
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playRecorded() {
    for (const freq of freq_played) {
        await wsi.sendSerial(freq);
        await sleep(100);
        await wsi.sendSerial("END");
        await sleep(100 * 1.3);
    }
}

async function clearRecorded() {
    freq_played = [];
    notes_played = [];
    const notes_display = document.getElementById("recorded-notes");
    notes_display.innerText = "";
}

/**
 * UI functionality
 */
function updateRecorded(note, freq) {
    notes_played.push(note);
    freq_played.push(freq);
    const recorded_div = document.getElementById("recorded-notes");
    recorded_div.className = "text-light";
    recorded_div.innerText = "";
    notes_played.forEach((note, index) => {
        let addin = index == 0 ? "" : ", ";
        const txt = document.createTextNode(addin + note);
        recorded_div.appendChild(txt);
    });
}

function populateNotesMap(json_notes) {
    const notes = new Map(
        Object.entries(JSON.parse(JSON.stringify(json_notes)))
    );
    return notes;
}

function addNoteButtons() {
    const notes = populateNotesMap(notes_data);
    const note_div = document.getElementById("musical-notes");

    notes.forEach((val, key) => {
        val.forEach((freq, index) => {
            const button = document.createElement("button");

            const button_name =
                key == "A" || key == "B" || key == "Bb"
                    ? key + index
                    : key + (index + 1);

            button.innerText = button_name;
            button.id = button_name + "-btn";
            button.className = "btn btn-primary note-btn m-1";
            button.type = "button";
            button.disabled = true;
            note_div.appendChild(button);
            button.addEventListener("mousedown", async () => {
                await wsi.sendSerial(freq);
                updateRecorded(button.innerText, freq);
            });
            button.addEventListener("mouseup", async () => {
                await wsi.sendSerial("END");
            });
        });
        note_div.appendChild(document.createElement("br"));
    });
}

function updateConnButton() {
    const button = document.getElementById("conn-btn");
    const note_buttons = Array.from(
        document.getElementsByClassName("note-btn")
    );
    const play_button = document.getElementById("play-recorded-btn");
    const clear_button = document.getElementById("clear-recorded-btn");
    if (wsi.connState) {
        button.innerHTML = "Disconnect";
        button.className = "btn btn-warning my-1";
        note_buttons.forEach((btn) => (btn.disabled = false));
        play_button.disabled = false;
        clear_button.disabled = false;
    } else {
        button.innerHTML = "Connect";
        button.className = "btn btn-success my-1";
        note_buttons.forEach((btn) => (btn.disabled = true));
        play_button.disabled = true;
        clear_button.disabled = true;
    }
}

function disconnectUI() {
    const device_info = document.getElementById("device-info");

    if (device_info) {
        device_info.remove();
    }
}

function deviceInfoUI(portInfo) {
    const header = document.getElementById("header");
    const t = document.createElement("p");
    t.id = "device-info";
    t.className = "m-2 text-light font-monospace fw-light d-inline text-muted";
    t.innerHTML = `[Device] 0x${portInfo.usbVendorId.toString(
        16
    )}:0x${portInfo.usbProductId.toString(16)}`;
    header.appendChild(t);
}
