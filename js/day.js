import { DoorDatabase, SongDatabase } from "./Database.js";
import { isInDevMode, monthNameToJsMonth } from "./helper.js";
import { CURRENT_YEAR, DEV_MONTH } from "./Constants.js";

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
    // If we are in dev mode, we set the month in the constants, but in prod, we use december
    const december = isInDevMode() ? DEV_MONTH : 'Dec';
    return new Date() >= new Date(CURRENT_YEAR, monthNameToJsMonth(december), day);
}

export function setDoorOpened(day) {
    DoorDatabase.setDoorOpened(day);
}