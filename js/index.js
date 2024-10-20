import { Song } from "./Song.js";
import { DoorDatabase, SongDatabase } from "./Database.js";
import { isInDevMode } from "./helper.js";

/**
 * Builds the 24 adventcalendar "doors" and inserts them into the `parentElement`
 * @param {HTMLElement} parentElement The container element for the "doors"
 */
export function buildCalendar(parentElement) {

    const december = isInDevMode() ? 10 : 11;
    const year = 2024;
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
