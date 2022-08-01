import { WebSerialInterface } from "./modules/webSerial.js";
import notes_data from "../json/notes.json" assert { type: "json" };
import keys_88 from "../json/88_key.json" assert { type: "json" };

buildSynth();

function orderedNotes(json_notes) {
    const notes = Object.entries(JSON.parse(JSON.stringify(json_notes)));
    const flattened = Array.from(notes, (arr) => arr[1])
        .flat()
        .sort((a, b) => a - b);
    return flattened;
}

function buildSynth() {
    const synth = document.getElementById("synthesizer-keyboard");
    const keys = JSON.parse(JSON.stringify(keys_88))["88_key"];
    const notes = orderedNotes(notes_data);

    let note = 0;
    keys.forEach((octave) => {
        const div = document.createElement("div");
        div.className = "piano-octave";
        synth.appendChild(div);
        [...octave].forEach((key) => {
            const button = document.createElement("button");
            button.id = notes[note];
            button.type = "button";
            button.className =
                key === "w"
                    ? "white-note btn btn-outline-dark shadow-lg btn-light rounded-0"
                    : "black-note btn btn-outline-light shadow-lg btn-dark rounded-0";
            div.appendChild(button);
            note++;
        });
    });
}
// class="white-note btn btn-outline-dark shadow-lg btn-light rounded-0"
// class="black-note btn btn-outline-light shadow-lg btn-dark rounded-0"
