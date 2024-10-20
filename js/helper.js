import { SongDatabase } from "./Database.js";
import { Song } from "./Song.js";
import { CURRENT_YEAR } from "./Constants.js";

/**
 * Determines if the website is currently in dev mode
 * @returns {boolean} true if in dev, false if in prod
 */
export function isInDevMode() {
    return window.location.hostname.includes('127.0.0.1');
}

/**
 * Shuffles the given array using the Fisher-Yates algorithm
 * @param {Array} array The array to shuffle (in place)
 */
export function shuffleArray(array) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {

      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

/**
 * Determines if this is the very frist load of the website (= no songs stored)
 * @returns {boolean} true if it is the first load, false otherwise
 */
export function isFirstLoad() {
    return SongDatabase.isEmpty();
}

/**
 * Loads the songs from the webserver
 * @param {string} requestUrl The url of the json file
 * @returns {Array[Song]}
 */
export async function fetchSongs(requestUrl) {
    // We don't want to cache the file, this helps us to deploy updates
    // if the local storage get cleared. In any case the fetching will
    // only be done once when the webpage loads the first time
    const request = new Request(requestUrl, {cache: 'no-store'});

    const response = await fetch(request);
    const result = await response.json();

    const songs = result.years[CURRENT_YEAR];

    return songs.map((song) => new Song(song));
}