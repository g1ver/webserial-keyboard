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
