import { addToServerCart, fetchScreeningTickets, fetchSeatsForRoom } from "../Core/api.js";
import { showReservationMessage } from "../Core/common.js";
import { refreshFloatingCartBadge } from "../Kosar/kosar.js";
import { ensureCurrentUserIdLoaded, applyLoginState } from "../Fooldalak/auth.js";
import { ensureRoomsLoaded, getRoomById, getRoomLabel } from "../Fooldalak/cinema.js";
import { clampSelectedTicketQuantities, clearSelectedTicketQuantities, getAllowedTicketsForScreening, ensureTicketTypesLoaded, getSelectedTicketQuantities, getSelectedTicketQuantityTotal, getTicketName, getTicketPrice, getTicketSummaryText, renderRoomTicketSelectionMarkup, saveSelectedTicketQuantities } from "../Arak/arak.js";
const selectedScreeningStorageKey = "cinemaSelectedScreening";
const selectedSeatStorageKeyPrefix = "cinemaSelectedSeats";
const roomDetails = document.getElementById("roomDetails");
// Megmondja, hogy adott vetítéshez milyen kulccsal mentsük a kiválasztott székeket sessionStorage-ba
export function getSelectedSeatStorageKey(screeningId) {
    return `${selectedSeatStorageKeyPrefix}:${screeningId}`;
}
// Visszaolvassa a korábban kiválasztott vetítést a sessionStorage-ból
export function getSelectedScreeningState() {
    const rawScreening = sessionStorage.getItem(selectedScreeningStorageKey);
    if (!rawScreening) {
        return null;
    }
    try {
        return JSON.parse(rawScreening);
    }
    catch {
        return null;
    }
}
// Elmenti, hogy melyik vetítést választotta ki a user
export function setSelectedScreeningState(screening) {
    sessionStorage.setItem(selectedScreeningStorageKey, JSON.stringify(screening));
}
// Visszaadja az adott vetítéshez kiválasztott székek ID-jait
export function getSelectedSeatIds(screeningId) {
    const rawSeatIds = sessionStorage.getItem(getSelectedSeatStorageKey(screeningId));
    if (!rawSeatIds) {
        return [];
    }
    try {
        const parsedSeatIds = JSON.parse(rawSeatIds);
        if (!Array.isArray(parsedSeatIds)) {
            return [];
        }
        const result = [];
        for (let i = 0; i < parsedSeatIds.length; i++) {
            const seatId = Number(parsedSeatIds[i]);
            if (seatId > 0) {
                result.push(seatId);
            }
        }
        return result;
    }
    catch {
        return [];
    }
}
// Elmenti a kiválasztott székeket
export function saveSelectedSeatIds(screeningId, seatIds) {
    sessionStorage.setItem(getSelectedSeatStorageKey(screeningId), JSON.stringify(seatIds));
}
// Törli a kiválasztott székeket adott vetítéshez
export function clearSelectedSeats(screeningId) {
    sessionStorage.removeItem(getSelectedSeatStorageKey(screeningId));
}
// Kirajzolja a terem székeit HTML-ként
export function renderRoomSeatsMarkup(seats, selectedSeatIds) {
    if (seats.length === 0) {
        return `<div class="alert alert-secondary mb-0" role="alert">
                Ehhez a teremhez most nem érkezett ülésadat az API-ból.
            </div>`;
    }
    let maxSeatNumber = 0;
    let maxRowNumber = 0;
    // Megkeressük, hány sor és soronként max hány szék van
    for (let i = 0; i < seats.length; i++) {
        if (seats[i].seatNumber > maxSeatNumber) {
            maxSeatNumber = seats[i].seatNumber;
        }
        if (seats[i].rowNumber > maxRowNumber) {
            maxRowNumber = seats[i].rowNumber;
        }
    }
    // Ha elég sok szék van egy sorban, középre beszúrunk egy "folyosót"
    let aisleIndex = 0;
    if (maxSeatNumber >= 6) {
        aisleIndex = Math.ceil(maxSeatNumber / 2);
    }
    let html = `<div class="room-seat-map">
            <div class="room-seat-screen">Vászon</div>
            <div class="room-seat-layout">`;
    // Soronként végigmegyünk a termen
    for (let rowNumber = 1; rowNumber <= maxRowNumber; rowNumber++) {
        html +=
            `<div class="room-seat-row">
                <div class="room-seat-row-label">${rowNumber}. sor</div>
                <div class="room-seat-row-grid" style="--seat-columns: ${maxSeatNumber}; --seat-aisle-columns: ${aisleIndex ? maxSeatNumber + 1 : maxSeatNumber};">`;
        // Soron belül végigmegyünk a székhelyeken
        for (let seatNumber = 1; seatNumber <= maxSeatNumber; seatNumber++) {
            let currentSeat = null;
            // Megkeressük, van-e ezen a helyen tényleges szék
            for (let i = 0; i < seats.length; i++) {
                if (seats[i].rowNumber === rowNumber && seats[i].seatNumber === seatNumber) {
                    currentSeat = seats[i];
                    break;
                }
            }
            if (!currentSeat) {
                html += `<span class="room-seat room-seat-empty" aria-hidden="true"></span>`;
            }
            else {
                let isSelected = false;
                // Megnézzük, hogy ez a szék ki van-e jelölve
                for (let i = 0; i < selectedSeatIds.length; i++) {
                    if (selectedSeatIds[i] === currentSeat.seatId) {
                        isSelected = true;
                        break;
                    }
                }
                const stateLabel = currentSeat.isReserved ? "Foglalt" : "Szabad";
                // Ha foglalt, tiltott gombként rajzoljuk ki
                if (currentSeat.isReserved) {
                    html +=
                        `<button
                        type="button"
                        class="room-seat room-seat-button room-seat-occupied"
                        title="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                        aria-label="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                        disabled
                        aria-disabled="true"
                    ></button>`;
                }
                else {
                    // Ha szabad, akkor kattintható gomb lesz
                    html +=
                        `<button
                        type="button"
                        class="room-seat room-seat-button room-seat-available${isSelected ? " room-seat-selected" : ""}"
                        title="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                        aria-label="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                        aria-pressed="${isSelected ? "true" : "false"}"
                        data-seat-id="${currentSeat.seatId}"
                    ></button>`;
                }
            }
            // Ide jön a folyosó
            if (aisleIndex && seatNumber === aisleIndex) {
                html += `<span class="room-seat-aisle" aria-hidden="true"></span>`;
            }
        }
        html += `</div>
            </div>`;
    }
    html +=
        `</div>
            <div class="room-seat-legend" aria-label="Szék állapot jelmagyarázat">
                <span class="room-seat-legend-item">
                    <span class="room-seat-legend-swatch room-seat-legend-available"></span>
                    Szabad
                </span>
                <span class="room-seat-legend-item">
                    <span class="room-seat-legend-swatch room-seat-legend-selected"></span>
                    Kijelölt szék
                </span>
                <span class="room-seat-legend-item">
                    <span class="room-seat-legend-swatch room-seat-legend-occupied"></span>
                    Foglalt
                </span>
            </div>
        </div>`;
    return html;
}
// Megnézi, hogy a korábban kiválasztott székek közül melyek maradtak még érvényesek
// ha időközben egy szék foglalttá vált, azt kidobja
export function getAvailableSelectedSeatIds(screeningId, seats, maxAllowed) {
    const savedSeatIds = getSelectedSeatIds(screeningId);
    const result = [];
    for (let i = 0; i < savedSeatIds.length; i++) {
        const seatId = savedSeatIds[i];
        let reserved = false;
        for (let j = 0; j < seats.length; j++) {
            if (seats[j].seatId === seatId && seats[j].isReserved) {
                reserved = true;
                break;
            }
        }
        if (!reserved) {
            result.push(seatId);
        }
        // Ne lehessen több kijelölt szék, mint amennyi jegy van
        if (result.length >= maxAllowed) {
            break;
        }
    }
    saveSelectedSeatIds(screeningId, result);
    return result;
}
// Rárakja a kattintáskezelőt a székekre
export function initializeRoomSeatSelection(screeningId, getSeatSelectionLimit, onSelectionChange) {
    if (!roomDetails) {
        return;
    }
    const seatButtons = roomDetails.querySelectorAll(".room-seat-button[data-seat-id]");
    for (let i = 0; i < seatButtons.length; i++) {
        const seatButton = seatButtons[i];
        seatButton.addEventListener("click", () => {
            if (seatButton.disabled) {
                return;
            }
            const seatId = Number(seatButton.dataset.seatId);
            if (!seatId) {
                return;
            }
            const selectedSeatIds = getSelectedSeatIds(screeningId);
            const seatSelectionLimit = getSeatSelectionLimit();
            let isSelected = false;
            for (let j = 0; j < selectedSeatIds.length; j++) {
                if (selectedSeatIds[j] === seatId) {
                    isSelected = true;
                    break;
                }
            }
            // Ha már ki volt jelölve, akkor kivesszük
            if (isSelected) {
                const newSelectedSeatIds = [];
                for (let j = 0; j < selectedSeatIds.length; j++) {
                    if (selectedSeatIds[j] !== seatId) {
                        newSelectedSeatIds.push(selectedSeatIds[j]);
                    }
                }
                saveSelectedSeatIds(screeningId, newSelectedSeatIds);
            }
            else {
                // Ha még nincs kiválasztva jegy, nem engedünk széket választani
                if (seatSelectionLimit <= 0) {
                    alert("Előbb válassz jegytípust és darabszámot.");
                    return;
                }
                // Több széket nem lehet választani, mint ahány jegy van
                if (selectedSeatIds.length >= seatSelectionLimit) {
                    alert("Csak annyi helyet választhatsz, amennyi jegyet beállítottál.");
                    return;
                }
                selectedSeatIds.push(seatId);
                saveSelectedSeatIds(screeningId, selectedSeatIds);
            }
            // Minden kattintás után újrafrissítjük az állapotot
            onSelectionChange();
        });
    }
}
// A backend csak egy ticketId-s kosár sort tud fogadni,
// ezért a frontend a vegyes jegyválasztást több külön kérésre bontja szét.
function buildCartRequestItems(tickets, screeningTickets, seats, selectedSeatIds) {
    const selectedSeats = [];
    // Először összerakjuk a ténylegesen kiválasztott székeket a teljes terem seat listából.
    for (let i = 0; i < selectedSeatIds.length; i++) {
        for (let j = 0; j < seats.length; j++) {
            if (seats[j].seatId === selectedSeatIds[i]) {
                selectedSeats.push({
                    seatId: seats[j].seatId,
                    rowNumber: seats[j].rowNumber,
                    seatNumber: seats[j].seatNumber,
                });
                break;
            }
        }
    }
    const requests = [];
    let nextSeatIndex = 0;
    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].quantity <= 0) {
            continue;
        }
        let ticketId = 0;
        for (let j = 0; j < screeningTickets.length; j++) {
            if (screeningTickets[j].ticketTypeId === tickets[i].ticketTypeId) {
                ticketId = screeningTickets[j].ticketId;
                break;
            }
        }
        if (!ticketId) {
            return [];
        }
        const requestSeats = [];
        // A kiválasztott székeket sorban kiosztjuk az egyes jegytípusokhoz.
        for (let j = 0; j < tickets[i].quantity; j++) {
            if (nextSeatIndex >= selectedSeats.length) {
                return [];
            }
            requestSeats.push(selectedSeats[nextSeatIndex]);
            nextSeatIndex++;
        }
        requests.push({
            ticketId: ticketId,
            amount: requestSeats.length,
            seats: requestSeats,
        });
    }
    if (nextSeatIndex !== selectedSeats.length) {
        return [];
    }
    return requests;
}
// Ez rajzolja ki az egész terem oldalt
export async function renderRoomPage() {
    if (!roomDetails) {
        return;
    }
    const selectedScreening = getSelectedScreeningState();
    if (!selectedScreening) {
        window.location.replace("../Fooldalak/Cinema.html");
        return;
    }
    await ensureRoomsLoaded();
    const room = getRoomById(selectedScreening.roomId);
    const roomName = getRoomLabel(selectedScreening.roomId, selectedScreening.roomName);
    const formattedDate = new Date(selectedScreening.date).toLocaleString("hu-HU");
    const currentUserId = await ensureCurrentUserIdLoaded();
    const isLoggedIn = Boolean(currentUserId);
    const bookingLabel = isLoggedIn ? "Kosárba" : "Bejelentkezés a kosárhoz";
    let seats = [];
    // Betöltjük a székeket API-ról
    try {
        seats = await fetchSeatsForRoom(selectedScreening.roomId, selectedScreening.filmScreeningId);
    }
    catch (error) {
        console.error(error);
        // Ha az API nem megy, megpróbáljuk a terem adatból visszavenni
        if (room && room.seats) {
            seats = room.seats;
        }
        else {
            seats = [];
        }
    }
    const ticketTypes = await ensureTicketTypesLoaded();
    const screeningTickets = await fetchScreeningTickets(selectedScreening.filmScreeningId);
    const availableTickets = getAllowedTicketsForScreening(roomName, ticketTypes, screeningTickets);
    let availableSeatCount = 0;
    // Összeszámoljuk a szabad székeket
    for (let i = 0; i < seats.length; i++) {
        if (!seats[i].isReserved) {
            availableSeatCount++;
        }
    }
    // Betöltjük a kiválasztott jegyeket, és levágjuk max a szabad helyek számáig
    let selectedTickets = clampSelectedTicketQuantities(getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets), availableSeatCount);
    saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
    const selectedSeatIds = getAvailableSelectedSeatIds(selectedScreening.filmScreeningId, seats, getSelectedTicketQuantityTotal(selectedTickets));
    // Itt kerül ki a teljes oldal HTML-je
    roomDetails.innerHTML =
        `<section class="container py-4">
            <div class="card bg-dark text-light border-secondary room-details-card">
                <div class="card-body">
                    <h1 class="h3 mb-3">${roomName}</h1>
                    <p class="mb-2"><strong>Film:</strong> ${selectedScreening.movieTitle}</p>
                    <p class="mb-4"><strong>Időpont:</strong> ${formattedDate}</p>
                    <div class="mb-4">
                        ${renderRoomTicketSelectionMarkup(availableTickets, selectedTickets)}
                    </div>
                    <div class="mb-4 room-seat-section">
                        <h2 class="h5 mb-3">Székek</h2>
                        ${renderRoomSeatsMarkup(seats, selectedSeatIds)}
                    </div>
                    <div class="text-start mt-2">
                        <button id="addToCartButton" class="btn btn-success room-add-to-cart" type="button">${bookingLabel}</button>
                    </div>
                </div>
            </div>
        </section>`;
    const addToCartButton = document.getElementById("addToCartButton");
    const roomTicketSummary = document.getElementById("roomTicketSelectionSummary");
    const roomSeatSummary = document.getElementById("roomSeatSelectionSummary");
    // Ez frissíti a képernyőt minden változás után
    const updateRoomSelectionState = () => {
        selectedTickets = clampSelectedTicketQuantities(getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets), availableSeatCount);
        saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
        const totalTickets = getSelectedTicketQuantityTotal(selectedTickets);
        const limitedSelectedSeatIds = getAvailableSelectedSeatIds(selectedScreening.filmScreeningId, seats, totalTickets);
        const seatButtons = roomDetails.querySelectorAll(".room-seat-button[data-seat-id]");
        // Székek kinézete és tiltása/frissítése
        for (let i = 0; i < seatButtons.length; i++) {
            const seatButton = seatButtons[i];
            const seatId = Number(seatButton.dataset.seatId);
            let isSelected = false;
            for (let j = 0; j < limitedSelectedSeatIds.length; j++) {
                if (limitedSelectedSeatIds[j] === seatId) {
                    isSelected = true;
                    break;
                }
            }
            const isSeatSelectionEnabled = totalTickets > 0;
            seatButton.disabled = !isSeatSelectionEnabled;
            seatButton.classList.toggle("room-seat-disabled", !isSeatSelectionEnabled);
            seatButton.classList.toggle("room-seat-selected", isSelected);
            seatButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
            seatButton.setAttribute("aria-disabled", seatButton.disabled ? "true" : "false");
        }
        // Jegyszámlálók frissítése
        for (let i = 0; i < availableTickets.length; i++) {
            const ticket = availableTickets[i];
            const ticketTypeId = ticket.ticketTypeId;
            let currentQuantity = 0;
            for (let j = 0; j < selectedTickets.length; j++) {
                if (selectedTickets[j].ticketTypeId === ticketTypeId) {
                    currentQuantity = selectedTickets[j].quantity;
                    break;
                }
            }
            const decrementButton = roomDetails.querySelector(`[data-ticket-action="decrement"][data-ticket-type-id="${ticketTypeId}"]`);
            const incrementButton = roomDetails.querySelector(`[data-ticket-action="increment"][data-ticket-type-id="${ticketTypeId}"]`);
            const counterValue = document.getElementById(`roomTicketCount-${ticketTypeId}`);
            if (counterValue) {
                counterValue.textContent = String(currentQuantity);
            }
            if (decrementButton) {
                decrementButton.disabled = currentQuantity <= 0;
            }
            if (incrementButton) {
                incrementButton.disabled = totalTickets >= availableSeatCount || availableSeatCount === 0;
            }
        }
        // Alul az összefoglaló frissítése
        if (roomTicketSummary) {
            if (totalTickets > 0) {
                roomTicketSummary.textContent = `Kiválasztott jegyek: ${getTicketSummaryText(selectedTickets)}`;
            }
            else {
                roomTicketSummary.textContent = "Előbb válassz jegytípust és darabszámot.";
            }
        }
        if (roomSeatSummary) {
            if (totalTickets > 0) {
                roomSeatSummary.textContent = `Kiválasztott székek: ${limitedSelectedSeatIds.length}/${totalTickets}`;
            }
            else {
                roomSeatSummary.textContent = "Jegyválasztás után tudsz székeket kijelölni.";
            }
        }
        // Csak akkor legyen nyomható a gomb, ha a jegyek és székek száma egyezik
        if (addToCartButton) {
            addToCartButton.disabled = totalTickets === 0 || limitedSelectedSeatIds.length !== totalTickets;
        }
    };
    initializeRoomSeatSelection(selectedScreening.filmScreeningId, () => getSelectedTicketQuantityTotal(selectedTickets), updateRoomSelectionState);
    const ticketStepperButtons = roomDetails.querySelectorAll("[data-ticket-action][data-ticket-type-id]");
    // Jegy darabszám növelés/csökkentés
    for (let i = 0; i < ticketStepperButtons.length; i++) {
        const button = ticketStepperButtons[i];
        button.addEventListener("click", () => {
            const ticketTypeId = Number(button.dataset.ticketTypeId);
            const ticketAction = button.dataset.ticketAction;
            if (!ticketTypeId || !ticketAction) {
                return;
            }
            let currentQuantity = 0;
            for (let j = 0; j < selectedTickets.length; j++) {
                if (selectedTickets[j].ticketTypeId === ticketTypeId) {
                    currentQuantity = selectedTickets[j].quantity;
                    break;
                }
            }
            const currentTotal = getSelectedTicketQuantityTotal(selectedTickets);
            const newSelectedTickets = [];
            if (ticketAction === "increment") {
                if (currentTotal >= availableSeatCount) {
                    return;
                }
                let found = false;
                for (let j = 0; j < selectedTickets.length; j++) {
                    if (selectedTickets[j].ticketTypeId === ticketTypeId) {
                        newSelectedTickets.push({
                            ticketTypeId: selectedTickets[j].ticketTypeId,
                            ticketType: selectedTickets[j].ticketType,
                            unitPrice: selectedTickets[j].unitPrice,
                            quantity: selectedTickets[j].quantity + 1,
                        });
                        found = true;
                    }
                    else {
                        newSelectedTickets.push(selectedTickets[j]);
                    }
                }
                if (!found) {
                    for (let j = 0; j < availableTickets.length; j++) {
                        if (availableTickets[j].ticketTypeId === ticketTypeId) {
                            newSelectedTickets.push({
                                ticketTypeId: availableTickets[j].ticketTypeId,
                                ticketType: getTicketName(availableTickets[j]),
                                unitPrice: getTicketPrice(availableTickets[j]),
                                quantity: 1,
                            });
                            break;
                        }
                    }
                }
            }
            if (ticketAction === "decrement") {
                for (let j = 0; j < selectedTickets.length; j++) {
                    if (selectedTickets[j].ticketTypeId === ticketTypeId) {
                        if (selectedTickets[j].quantity > 1) {
                            newSelectedTickets.push({
                                ticketTypeId: selectedTickets[j].ticketTypeId,
                                ticketType: selectedTickets[j].ticketType,
                                unitPrice: selectedTickets[j].unitPrice,
                                quantity: selectedTickets[j].quantity - 1,
                            });
                        }
                    }
                    else {
                        newSelectedTickets.push(selectedTickets[j]);
                    }
                }
            }
            selectedTickets = newSelectedTickets;
            saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
            updateRoomSelectionState();
        });
    }
    updateRoomSelectionState();
    if (addToCartButton) {
        addToCartButton.addEventListener("click", async () => {
            const userId = await ensureCurrentUserIdLoaded();
            // Ha nincs bejelentkezve, átdobjuk loginra
            if (!userId) {
                window.location.href = "../Fooldalak/Bejelentkezes.html";
                return;
            }
            const selectedIds = getSelectedSeatIds(selectedScreening.filmScreeningId);
            if (selectedIds.length === 0) {
                alert("Nincsenek kiválasztott székek.");
                return;
            }
            const ticketsForCart = getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets);
            const totalSelectedTickets = getSelectedTicketQuantityTotal(ticketsForCart);
            if (totalSelectedTickets === 0) {
                alert("Előbb válassz jegytípust és darabszámot.");
                return;
            }
            if (selectedIds.length !== totalSelectedTickets) {
                alert("A kiválasztott székek száma meg kell egyezzen a kiválasztott jegyek számával.");
                return;
            }
            // Itt bontjuk szét a vegyes jegyválasztást több egyjegytípusos szerveres kérésre.
            const cartRequestItems = buildCartRequestItems(ticketsForCart, screeningTickets, seats, selectedIds);
            if (cartRequestItems.length === 0) {
                alert("A kiválasztott jegyeket most nem sikerült a szerveres kosártételekhez összerakni.");
                return;
            }
            let successCount = 0;
            let failedCount = 0;
            // Minden jegytípus külön kosártételként megy fel a jelenlegi backend szerződés miatt.
            for (let i = 0; i < cartRequestItems.length; i++) {
                const addedCart = await addToServerCart({
                    userId,
                    filmScreeningId: selectedScreening.filmScreeningId,
                    ticketId: cartRequestItems[i].ticketId,
                    amount: cartRequestItems[i].amount,
                    seats: cartRequestItems[i].seats,
                });
                if (addedCart && Number(addedCart.cartId ?? addedCart.CartId)) {
                    successCount++;
                }
                else {
                    failedCount++;
                }
            }
            if (successCount === 0) {
                showReservationMessage("A kosárba helyezés nem sikerült.", true);
                return;
            }
            // Sikeres kosárba rakás után töröljük a helyi kijelöléseket
            clearSelectedSeats(selectedScreening.filmScreeningId);
            clearSelectedTicketQuantities(selectedScreening.filmScreeningId);
            // Újrarajzoljuk az oldalt és frissítjük a kis kosár számot
            await renderRoomPage();
            await refreshFloatingCartBadge();
            if (failedCount === 0) {
                if (cartRequestItems.length > 1) {
                    showReservationMessage("A kiválasztott jegyek külön kosártételként bekerültek a kosárba.", false);
                }
                else {
                    showReservationMessage("A kiválasztott jegyek bekerültek a kosárba.", false);
                }
                return;
            }
            showReservationMessage("A kiválasztott jegyek egy része bekerült a kosárba, egy része nem.", true);
        });
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    if (roomDetails) {
        await renderRoomPage();
    }
});
