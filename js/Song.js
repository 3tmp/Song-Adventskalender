export class Song {

    constructor(obj) {
        this.title = obj.title;
        this.artist = obj.artist;
        this.quote = obj.quote;
        this.explaination = obj.explaination;
        this.spotifyId = obj.spotifyId;
        this.youtubeId = obj.youtubeId;
    }

    get youtubeLink() {
        return "https://www.youtube.com/watch?v=" + this.youtubeId;
    }

    get youtubeEmbedLink() {
        return "https://www.youtube-nocookie.com/embed/" + this.youtubeId;
    }

    get spotifyLink() {
        return "https://open.spotify.com/intl-de/track/" + this.spotifyId;
    }

    get spotifyEmbedLink() {
        return "https://open.spotify.com/embed/track/" + this.spotifyId;
    }

    equals(obj) {
        return this == obj
            || obj instanceof Song
            && this.title == obj.title
            && this.artist == obj.artist;
    }

    toString() {
        return "'" + this.title + "' by '" + this.artist + "'";
    }

    /**
     * Dumps the `Song` into a string
     * @returns {string} The serialized object
     */
    serialize() {
        return JSON.stringify(this)
    }

    /**
     * Parses the given string into a `Song`
     * @param {string} songStr The song string to parse
     * @returns {Song} A `Song` object on success
     * @throws {TypeError} If `song` is not a string
     */
    static deserialize(songStr) {
        if (!typeof(songStr) === "string") {
            throw new TypeError("Invalid song");
        }

        const song = JSON.parse(songStr);
        return new Song(song);
    }
}
