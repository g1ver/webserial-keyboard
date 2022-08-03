export class RecorderState {
    constructor(wsi, debug) {
        this.wsi = wsi;
        this.debug = debug;
    }

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

        // strip out dead notes at end
        if (songArr[songArr.length - 1].freq === "X") {
            songArr.pop();
        }
        this.song = songArr;
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async stopPlaying() {
        const stopCode = "END";
        await this.wsi.sendSerial(stopCode);
    }

    async playNote(freq) {
        const playNoteCode = "NOTE";
        await this.wsi.sendSerial(playNoteCode);
        await this.wsi.sendSerial(freq);
    }

    async stopButton() {
        this.stopNow = true;
    }

    async playSong() {
        this.debug("[*] Starting song.");
        for (const note of this.song) {
            if (this.stopNow) {
                this.stopNow = false;
                break;
            }

            let { freq, timing } = note;

            await this.playNote(freq);
            await this.debug(`[*] sleeping: ${timing} sec`);
            await this.sleep(timing * 1000);
            await this.stopPlaying();
        }
    }

    exportSong(songName, uploaderName, description) {
        const song = new Song(
            songName,
            new Date(),
            uploaderName,
            description,
            this.song,
            {
                noteCount: this.noteCount,
                duration: this.duration,
                tempo: this.tempo,
                measures: this.measures,
                beatsPerMeasure: this.beatsPerMeasure,
                noteLength: this.noteLength,
            }
        );
        return song;
    }
}

export class Song {
    /**
     *
     * @param {String} name The name of the song.
     * @param {Date} date The date when the song is uploaded.
     * @param {String} uploader The name of the uploader/creator of the song.
     * @param {Boolean} imported If the song was imported from MIDI.
     * @param {Array.<note>} song Array of note: [freq, timing]
     */
    constructor(name, date, uploader, description, song, songMetadata) {
        this.name = name;
        this.date = date;
        this.uploader = uploader;
        this.description = description;
        this.song = song;
        this.songMetadata = songMetadata;
        // this.imported = imported;
    }
}
