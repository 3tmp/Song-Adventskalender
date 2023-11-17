import { SongDatabase } from "./Database.js";
import { Song } from "./Song.js";

/**
 * Get the calendar day from the url
 * @returns {Number} The number on success or `NaN` on failure
 */
export function getDayFromUrl() {
    let parameter = window.location.search;
    if (parameter.length == 0) {
        return Number.NaN;
    }

    if (!parameter.startsWith("?day=")) {
        return Number.NaN;
    }

    let day = Number(parameter.substring(5));

    if (Number.isNaN(day) || day < 1 || day > 24) {
        return Number.NaN;
    }

    return day;
}

function getSongForDay(day) {

}

/**
 * Loads the songs from the webserver
 * @param {string} requestUrl The url of the json file
 * @returns {Array[Song]}
 */
export async function fetchSongs(requestUrl) {
    const request = new Request(requestUrl, {cache: "default"});

    const response = await fetch(request);
    const result = await response.json();

    return result.map((song) => new Song(song));
}

/**
 * Selects one element from the given list where it is ensured that it is not already used for any day
 * @param {Array[Song]} songs The list of songs to select one song
 * @returns {number} The index of the selected element
 */
export function selectSongForCurrentDay(songs) {
    SongDatabase.print();
    let result;
    do {
        result = getRandomNumber(0, songs.length);
    }
    while (SongDatabase.containsSong(songs[result]));

    return result;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Stores the given song in the database
 * @param {number} day The day to store the song
 * @param {Array[Song]} songs A list of all songs
 * @param {number} index The index of the song to store
 */
export function storeSongByIndex(day, songs, index) {
    const song = songs[index];

    if (SongDatabase.containsSong(song)) {
        throw Error("Song already in use");
    }

    SongDatabase.storeSong(day, song);
}