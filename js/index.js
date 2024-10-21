import { DoorDatabase, SongDatabase } from "./Database.js";
import { isInDevMode, monthNameToJsMonth } from "./helper.js";
import { CURRENT_YEAR, DEV_MONTH, URL_PARAM_DAY } from "./Constants.js";

/**
 * Builds the 24 adventcalendar "doors" and inserts them into the `parentElement`
 * @param {HTMLElement} parentElement The container element for the "doors"
 */
export function buildCalendar(parentElement) {

    const december = monthNameToJsMonth(isInDevMode() ? DEV_MONTH : 'Dec');
    const currentMonth = new Date().getMonth();
    const maxDoorThatCanBeOpened = new Date(CURRENT_YEAR, december, new Date().getDate());

    // When we are generating the calendar, there will be only one CalendarItem (and it's hidden)
    const bluePrint = document.getElementsByClassName("CalendarItem")[0];

    for (let i = 0; i < 24; i++) {
        const day = i + 1;
        const date = new Date(CURRENT_YEAR, currentMonth, day);
        const isDoorOpened = DoorDatabase.isDoorOpened(day);
        const calendarItem = bluePrint.cloneNode(true);

        // Set the link
        const link = calendarItem.querySelector("a");
        link.href = `day.html?${URL_PARAM_DAY}=${day}`;

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
