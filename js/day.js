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
