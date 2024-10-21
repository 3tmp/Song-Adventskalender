import { Song } from "./Song.js";

/**
 * @enum {string}
 */
const OpenStatus = {
    Opened: 'Opened',
    Closed: 'Closed'
}

export class Database {

    static clear() {
        window.localStorage.clear();
    }

    /**
     * @param {string} key 
     * @param {string} value 
     */
    static setString(key, value) {
        window.localStorage.setItem(key, value)
    }

    /**
     * @param {string} key 
     * @returns {string}
     */
    static getString(key) {
        return window.localStorage.getItem(key);
    }

    /**
     * @param {string} key 
     */
    static removeString(key) {
        window.localStorage.removeItem(key);
    }

    /**
     * Enumerates over all items in the database
     * @param {function(string, string): boolean} callback The callback function to be executed for each item.
     */
    static enum(callback) {
        for (var i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            const value = window.localStorage.getItem(key);
            if (!callback(key, value)) {
                return;
            }
        }
    }
}

export class DoorDatabase {

    static #keyPrefix = "door_";
    static #dayPrefix = "day_";

    static initDoors() {
        const prefix = DoorDatabase.#keyPrefix + DoorDatabase.#dayPrefix;

        for (let i = 0; i < 24; i++) {
            Database.setString(prefix + String(i + 1), OpenStatus.Closed);
        }
    }

    static isDoorOpened(day) {
        DoorDatabase.#ensureDayRange(day);

        const key = DoorDatabase.#keyPrefix + DoorDatabase.#dayPrefix + String(day);
        return Database.getString(key) === OpenStatus.Opened;
    }

    static setDoorOpened(day) {
        DoorDatabase.#ensureDayRange(day);

        const key = DoorDatabase.#keyPrefix + DoorDatabase.#dayPrefix + String(day);
        Database.setString(key, OpenStatus.Opened);
    }

    static print() {
        const doors = [];
        DoorDatabase.#enumDoors((day, status) => {
            doors.push({day: day, status: status});
            return true;
        });

        doors.sort((a, b) => a.day - b.day);
        doors.forEach((obj) => console.log(obj.day + ": " + obj.status));

        console.log(doors.length + " doors in database.");
    }

    /**
     * Enumerates all doors and whether they are already opened
     * @param {function(number, OpenStatus): boolean} callback
     */
    static #enumDoors(callback) {
        const prefix = DoorDatabase.#keyPrefix + DoorDatabase.#dayPrefix;
        Database.enum((key, value) => {
            if (key.startsWith(DoorDatabase.#keyPrefix)) {
                const day = Number(key.replace(prefix, ''));
                if (!callback(day, value)) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Ensures that the day is in the range [1, 24]
     * @param {number} day The day to check
     */
    static #ensureDayRange(day) {
        if (day < 1 || day > 24) {
            throw new Error("Invalid day range");
        }
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
        if (Database.getString(key) != null) {
            throw new Error("The database already contains a song for day " + day);
        }
        Database.setString(key, song.serialize());
    }

    /**
     * Retrieves the `Song` that was stored for the given day
     * @param {number} day The day to retrive the `Song` for
     * @throws {Error} If the day is not stored
     */
    static getSong(day) {
        const song = SongDatabase.#getSong(day);
        if (song == null) {
            throw new Error("The database contains no song for day " + day);
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
        keys.forEach((day) => Database.removeString(prefix + String(day)));
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
            throw new TypeError("Not a song");
        }
    }

    /**
     * Retrieves the song for the given day from the database
     * @param {number} dayNumber The day to retrieve the `Song` for
     * @returns {Song|null} A `Song` if the key was found, `null` otherwise
     */
    static #getSong(dayNumber) {
        const key = SongDatabase.#keyPrefix + SongDatabase.#dayPrefix + String(dayNumber);
        const songStr = Database.getString(key);
        return songStr == null ? null : Song.deserialize(songStr);
    }

    /**
     * Enumerates all songs in the database
     * @param {function(number, Song): boolean} callback Gets called for every song. First param is the day number, second is the `Song`.
     *        If the callback returns true, the enumeration continues, if it returns false, it gets stopped.
     */
    static #enumSongs(callback) {
        const prefix = SongDatabase.#keyPrefix + SongDatabase.#dayPrefix;

        Database.enum((key, value) => {
            if (key.startsWith(SongDatabase.#keyPrefix)) {
                const song = Song.deserialize(value);
                const day = Number(key.replace(prefix, ''));
                if (!callback(day, song)) {
                    return false;
                }
            }
            return true;
        });
    }
}