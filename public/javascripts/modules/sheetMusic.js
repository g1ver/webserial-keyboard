export class RecorderState {
    constructor() {}

    setSettings(
        noteCount,
        duration,
        tempo,
        measures,
        beatsPerMeasure,
        noteLength
    ) {
        this.noteCount = noteCount;
        this.duration = duration;
        this.tempo = tempo;
        this.measures = measures;
        this.beatsPerMeasure = beatsPerMeasure;
        this.noteLength = noteLength;
        this.state = Array(noteCount).fill("X");
    }

    updateNote(noteIndex, freq) {
        this.state[noteIndex] = freq;
    }

    buildSongArr() {
        let songArr = [];
        const secondsPerMeasure = this.duration / this.measures;
        const noteInSeconds = secondsPerMeasure * this.noteLength;

        this.state.forEach((element) => {
            const prevNote = songArr.pop();

            let note = {
                freq: element,
                timing: noteInSeconds,
            };

            if (prevNote === undefined) {
                // first elem
            } else if (prevNote.freq == note.freq) {
                note = { ...prevNote, timing: prevNote.timing + note.timing };
            } else {
                songArr.push(prevNote);
            }

            songArr.push(note);
        });
        console.log(songArr);
    }

    exportSong() {}
}

export class Song {
    /**
     *
     * @param {String} name The name of the song.
     * @param {Date} date The date when the song is uploaded.
     * @param {String} uploader The name of the uploader/creator of the song.
     * @param {Boolean} imported If the song was imported from MIDI.
     * @param {Array.<number, number>} song Array of [note, timing]
     */
    constructor(name, date, uploader, imported, song) {
        this.name = name;
        this.date = date;
        this.uploader = uploader;
        this.imported = imported;
        this.song = song;
    }
}
