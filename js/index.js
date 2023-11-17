/**
 * Builds the 24 adventcalendar "doors" and inserts them into the `parentElement`
 * @param {HTMLElement} parentElement The container element for the "doors"
 */
export function buildCalendar(parentElement) {
    for (let i = 0; i < 24; i++) {
        let dayContainer = document.createElement("div");
        dayContainer.classList.add("CalendarItemContainer");

        let dayLink = document.createElement("a");
        dayLink.href = "day.html?day=" + (i + 1);

        let dayText = document.createElement("p");
        dayText.innerText = "Tag " + (i + 1);

        dayLink.appendChild(dayText);
        dayContainer.appendChild(dayLink);
        parentElement.appendChild(dayContainer);
    }
}