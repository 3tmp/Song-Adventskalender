import { DoorDatabase, SongDatabase } from "./Database.js";
import { isInDevMode } from "./index.js";

/**
 * Get the calendar day from the url
 * @returns {Number} The number on success or `NaN` on failure
 */
export function getDayFromUrl() {
    const parameter = window.location.search;
    if (parameter.length == 0) {
        return Number.NaN;
    }

    if (!parameter.startsWith("?day=")) {
        return Number.NaN;
    }

    const day = Number(parameter.substring(5));

    if (Number.isNaN(day) || day < 1 || day > 24) {
        return Number.NaN;
    }

    return day;
}

export function getSong(day) {
    return SongDatabase.getSong(day);
}

export function isAllowedDay(day) {
    // If we are in dev mode, we set the month to November, but in prod, we really use december
    const december = isInDevMode() ? 10 : 11;
    const year = 2024;
    return new Date() >= new Date(year, december, day);
}

export function setDoorOpened(day) {
    DoorDatabase.setDoorOpened(day);
}