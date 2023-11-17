import { Song } from "./Song.js";

export class Database {

    static clear() {
        window.localStorage.clear();
    }
}

export class SongDatabase {

    static #keyPrefix = "song_";
    static #dayPrefix = "day_";

    /**
     * Serializes the `song` and stores it in the database. 
     * @param {number} day The day at which to store the `song`
     * @param {Song} song The `Song` to store
     * @throws {Error} If a song is already stored on that day
     */
    static storeSong(day, song) {
        this.#ensureSong(song);

        const key = SongDatabase.#keyPrefix + SongDatabase.#dayPrefix + String(day);
        if (window.localStorage.getItem(key) != null) {
            throw Error("The database already contains a song for day " + day);
        }
        window.localStorage.setItem(key, song.serialize());
    }

    /**
     * Retrieves the `Song` that was stored for the given day
     * @param {number} day The day to retrive the `Song` for
     * @throws {Error} If the day is not stored
     */
    static getSong(day) {
        const song = SongDatabase.#getSong(day);
        if (song == null) {
            throw Error("The database contains no song for day " + day);
        }
        return song;
    }

    /**
     * Removes all songs from the database.
     */
    static clearSongs() {
        const keys = [];
        SongDatabase.#enumSongs((day, _) => {
            keys.push(day);
            return true;
        });

        const prefix = SongDatabase.#keyPrefix + SongDatabase.#dayPrefix;
        keys.forEach((day) => window.localStorage.removeItem(prefix + String(day)));
    }

    /**
     * Determines if the database contains any songs
     * @returns true if the database is empty, false otherwise
     */
    static isEmpty() {
        let result = true;
        SongDatabase.#enumSongs((_, __) => {
            result = false;
            return false;
        });
        return result;
    }

    /**
     * Prints all songs to the console.
     * Only for debugging purposes.
     */
    static print() {
        const songs = [];
        SongDatabase.#enumSongs((day, song) => {
            songs.push({day: day, song: song});
            return true;
        });

        songs.sort((a, b) => a.day - b.day);
        songs.forEach((obj) => console.log(obj.day + ": " + obj.song.toString()));

        console.log(songs.length + " songs in database.");
    }

    /**
     * Ensures that the given `song` is an instance of the `Song` class. If not it throws
     * @param {*} song The song to check
     * @throws {TypeError} If the `song` is not a `Song`
     */
    static #ensureSong(song) {
        if (!(song instanceof Song)) {
            throw TypeError("Not a song");
        }
    }

    /**
     * Retrieves the song for the given day from the database
     * @param {number} dayNumber The day to retrieve the `Song` for
     * @returns {Song|null} A `Song` if the key was found, `null` otherwise
     */
    static #getSong(dayNumber) {
        const key = SongDatabase.#keyPrefix + SongDatabase.#dayPrefix + String(dayNumber);
        const songStr = window.localStorage.getItem(key);
        return songStr == null ? null : Song.deserialize(songStr);
    }

    /**
     * Enumerates all songs in the database
     * @param {function(number, Song): boolean} callback Gets called for every song. First param is the day number, second is the `Song`.
     *        If the callback returns true, the enumeration continues, if it returns false, it gets stopped.
     */
    static #enumSongs(callback) {
        for (var i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key.startsWith(SongDatabase.#keyPrefix)) {
                const song = Song.deserialize(window.localStorage.getItem(key));
                const day = Number(key.replace(SongDatabase.#keyPrefix + SongDatabase.#dayPrefix, ""));
                if (!callback(day, song)) {
                    return;
                }
            }
        }
    }
}