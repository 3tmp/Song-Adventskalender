import { DoorDatabase, SongDatabase } from "./Database.js";
import { isInDevMode, monthNameToJsMonth } from "./helper.js";
import { CURRENT_YEAR, DEV_MONTH, URL_PARAM_DAY } from "./Constants.js";
import { Song } from "./Song.js";


const day = getDayFromUrl();

if (Number.isNaN(day)) {
    document.querySelector('body').innerHTML = "Error";
    throw new Error("No valid day");
}
console.log("Selected day is " + day);

if (!isAllowedDay(day)) {
    document.getElementById('NotAllowedYet').style.display = 'block';
    document.getElementById('songSeparator').style.display = 'none';
    throw new Error("Not allowed yet");
}

// Set the door as opened
DoorDatabase.setDoorOpened(day);

/** @type {Song} */
const song = SongDatabase.getSong(day);

document.title = "Adventskalender Tag " + day;

const songQuote = document.getElementById('songQuote');
const songExplaination = document.getElementById('songExplaination');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const songYoutubeContainer = document.getElementById('songYoutubeContainer');
const songSpotifyContainer = document.getElementById('songSpotifyContainer');

songQuote.innerText = song.quote;
songExplaination.innerText = song.explaination;
songTitle.innerText = song.title;
songArtist.innerText = song.artist;

// Only embed the youtube/spotify links if not in dev mode
if (isInDevMode()) {
    // TODO REVERT!
    songYoutubeContainer.querySelector('iframe').src = song.youtubeEmbedLink;
    songSpotifyContainer.querySelector('iframe').src = song.spotifyEmbedLink;
}
else {
    songYoutubeContainer.innerHTML = '<div class="YoutubeDev">Youtube</div>';
    songSpotifyContainer.innerHTML = '<div class="SpotifyDev">Spotify</div>';
}

/**
 * Get the calendar day from the url
 * @returns {Number} The number on success or `NaN` on failure
 */
function getDayFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlParamDay = urlParams.get(URL_PARAM_DAY);

    if (urlParamDay === null) {
        return Number.NaN;
    }
    const day = Number(urlParamDay);

    if (Number.isNaN(day) || day < 1 || day > 24) {
        return Number.NaN;
    }

    return day;
}

function isAllowedDay(day) {
    // If we are in dev mode, we set the month in the constants, but in prod, we use december
    const december = isInDevMode() ? DEV_MONTH : 'Dec';
    return new Date() >= new Date(CURRENT_YEAR, monthNameToJsMonth(december), day);
}
