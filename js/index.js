import { Song } from "./Song.js";
import { DoorDatabase, SongDatabase } from "./Database.js";

/**
 * Builds the 24 adventcalendar "doors" and inserts them into the `parentElement`
 * @param {HTMLElement} parentElement The container element for the "doors"
 */
export function buildCalendar(parentElement) {

    const december = isInDevMode() ? 10 : 11;
    const year = 2023;
    const currentMonth = new Date().getMonth();
    const maxDoorThatCanBeOpened = new Date(year, december, new Date().getDate());

    // When we are generating the calendar, there will be only one CalendarItem (and it's hidden)
    const bluePrint = document.getElementsByClassName("CalendarItem")[0];

    for (let i = 0; i < 24; i++) {
        const day = i + 1;
        const date = new Date(year, currentMonth, day);
        const isDoorOpened = DoorDatabase.isDoorOpened(day);
        const calendarItem = bluePrint.cloneNode(true);

        // Set the link
        const link = calendarItem.querySelector("a");
        link.href = "day.html?day=" + (day);

        // Set the image
        const img = calendarItem.querySelector(".CalendarItemTop img");
        if (isDoorOpened) {
            img.src = "img/door_" + day + ".jpg";
        }
        else {
            img.src = "img/door_closed_" + day + ".jpg";
        }

        // Set the text
        const bottomContainer = calendarItem.querySelector(".CalendarItemBottom");
        if (isDoorOpened) {
            const node = bottomContainer.querySelector(".AlreadyOpen");
            node.classList.remove("Hidden");

            const song = SongDatabase.getSong(day);
            node.querySelector(":nth-Child(1)").innerText = song.title;
            node.querySelector(":nth-Child(2)").innerText = song.artist;
        }
        else if (date <= maxDoorThatCanBeOpened && date.getMonth() === december) {
            bottomContainer.querySelector(".CanOpen").classList.remove("Hidden");
        }
        else {
            bottomContainer.querySelector(".CannotOpen").classList.remove("Hidden");
        }
        
        parentElement.appendChild(calendarItem);
        // Now show the item
        calendarItem.style.display = "block";
    }
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
    const request = new Request(requestUrl, {cache: "no-store"});

    const response = await fetch(request);
    const result = await response.json();

    return result.map((song) => new Song(song));
}

/**
 * Determines if this is the very frist load of the website (= no songs stored)
 * @returns {boolean} true if it is the first load, false otherwise
 */
export function isFirstLoad() {
    return SongDatabase.isEmpty();
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
 * Determines if the website is currently in dev mode
 * @returns {boolean} true if in dev, false if in prod
 */
export function isInDevMode() {
    return true;
    //return window.location.hostname.includes("127.0.0.1");
}