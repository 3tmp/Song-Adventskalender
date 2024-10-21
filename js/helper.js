import { SongDatabase } from "./Database.js";
import { Song } from "./Song.js";
import { CURRENT_YEAR } from "./Constants.js";

/**
 * Determines if the website is currently in dev mode
 * @returns {boolean} true if in dev, false if in prod
 */
export function isInDevMode() {
    return true;
    // TODO revert later!
    //return window.location.hostname.includes('127.0.0.1');
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

/**
 * Converts a month name into a js month number
 * @param {'Jan'|'Feb'|'Mar'|'Apr'|'May'|'Jun'|'Jul'|'Aug'|'Sep'|'Oct'|'Nov'|'Dec'} monthName The name to check
 * @returns {number} The month number for the `Date` object (0 to 11)
 */
export function monthNameToJsMonth(monthName) {
    return {Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11}[monthName];
}

/**
 * Coverts a js month number into a month name
 * @param {number} jsMonth The number of the month (0 to 11)
 * @returns {'Jan'|'Feb'|'Mar'|'Apr'|'May'|'Jun'|'Jul'|'Aug'|'Sep'|'Oct'|'Nov'|'Dec'}
 */
export function jsMonthToMonthName(jsMonth) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][jsMonth];
}
