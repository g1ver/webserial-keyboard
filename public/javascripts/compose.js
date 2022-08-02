import { WebSerialInterface } from "./modules/webSerial.js";
import notes_data from "../json/notes.json" assert { type: "json" };
import keys_data from "../json/keys.json" assert { type: "json" };

document.getElementById("set-settings").addEventListener("click", () => {
    buildSheet();
});

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
    const keys = JSON.parse(JSON.stringify(keys_data))["keys"];
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
/**
 * each line should have three measures
 * each measure should follow the time signature
 * ex. time sig: 4/4 - 4 beats a measure, 1/4 notes
 */
function buildSheet() {
    const MEASURES_PER_LINE = 3;
    const BEATS_PER_MEASURE = 4;
    // const tempo = document.getElementById("setting-tempo").value;
    // const duration = document.getElementById("setting-duration").value;

    const tempo = 120;
    const duration = 60;

    const measures = ((duration / 60) * tempo) / BEATS_PER_MEASURE;
    const measureRows = measures / MEASURES_PER_LINE;

    const table = document.getElementById("music-table");

    for (let i = 0; i < measureRows; i++) {
        const measureRow = document.createElement("tr");
        measureRow.id = "measure-" + i;

        for (let j = 0; j < MEASURES_PER_LINE; j++) {
            const measure = document.createElement("td");

            for (let k = 0; k < BEATS_PER_MEASURE; k++) {
                const button = document.createElement("button");
                button.innerText = "X";
                button.className = "btn btn-primary"
                measure.appendChild(button);
            }

            measureRow.appendChild(measure);
        }

        table.appendChild(measureRow);
    }

    console.log(measures);
}
