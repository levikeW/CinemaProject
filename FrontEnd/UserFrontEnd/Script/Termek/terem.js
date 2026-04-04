import { addToServerCart, fetchScreeningTickets, fetchSeatsForRoom } from "../Core/api.js";
import { showReservationMessage } from "../Core/common.js";
import { ensureCurrentUserIdLoaded, applyLoginState } from "../Fooldalak/auth.js";
import { ensureRoomsLoaded, getRoomById, getRoomLabel } from "../Fooldalak/cinema.js";
import { clampSelectedTicketQuantities, clearSelectedTicketQuantities, ensureTicketTypesLoaded, getAllowedTicketsForRoom, getSelectedTicketQuantities, getSelectedTicketQuantityTotal, getTicketName, getTicketPrice, getTicketSummaryText, getTicketTypeId, renderRoomTicketSelectionMarkup, saveSelectedTicketQuantities, } from "../Arak/arak.js";
const selectedScreeningStorageKey = "cinemaSelectedScreening";
const selectedSeatStorageKeyPrefix = "cinemaSelectedSeats";
const roomDetails = document.getElementById("roomDetails");
export function getSelectedSeatStorageKey(screeningId) {
    return `${selectedSeatStorageKeyPrefix}:${screeningId}`;
}
export function getSelectedScreeningState() {
    const rawScreening = sessionStorage.getItem(selectedScreeningStorageKey);
    if (!rawScreening)
        return null;
    try {
        return JSON.parse(rawScreening);
    }
    catch {
        return null;
    }
}
export function setSelectedScreeningState(screening) {
    sessionStorage.setItem(selectedScreeningStorageKey, JSON.stringify(screening));
}
export function getSelectedSeatIds(screeningId) {
    const rawSeatIds = sessionStorage.getItem(getSelectedSeatStorageKey(screeningId));
    if (!rawSeatIds)
        return [];
    try {
        const parsedSeatIds = JSON.parse(rawSeatIds);
        return Array.isArray(parsedSeatIds)
            ? parsedSeatIds.filter((value) => typeof value === "number")
            : [];
    }
    catch {
        return [];
    }
}
export function saveSelectedSeatIds(screeningId, seatIds) {
    sessionStorage.setItem(getSelectedSeatStorageKey(screeningId), JSON.stringify(seatIds));
}
export function clearSelectedSeats(screeningId) {
    sessionStorage.removeItem(getSelectedSeatStorageKey(screeningId));
}
export function renderRoomSeatsMarkup(seats, selectedSeatIds) {
    if (seats.length === 0) {
        return `
            <div class="alert alert-secondary mb-0" role="alert">
                Ehhez a teremhez most nem érkezett ülésadat az API-ból.
            </div>
        `;
    }
    const seatsByRow = new Map();
    let maxSeatNumber = 0;
    for (const seat of seats) {
        const rowSeats = seatsByRow.get(seat.rowNumber) ?? new Map();
        rowSeats.set(seat.seatNumber, seat);
        seatsByRow.set(seat.rowNumber, rowSeats);
        maxSeatNumber = Math.max(maxSeatNumber, seat.seatNumber);
    }
    const sortedRows = Array.from(seatsByRow.entries()).sort((left, right) => left[0] - right[0]);
    const aisleIndex = maxSeatNumber >= 6 ? Math.ceil(maxSeatNumber / 2) : 0;
    const seatRowsMarkup = sortedRows.map(([rowNumber, rowSeats]) => {
        const seatCells = [];
        for (let seatNumber = 1; seatNumber <= maxSeatNumber; seatNumber++) {
            const seat = rowSeats.get(seatNumber);
            if (!seat) {
                seatCells.push('<span class="room-seat room-seat-empty" aria-hidden="true"></span>');
            }
            else {
                const stateLabel = seat.isReserved ? "Foglalt" : "Szabad";
                const isSelected = selectedSeatIds.has(seat.seatId);
                if (seat.isReserved) {
                    seatCells.push(`
                        <button
                            type="button"
                            class="room-seat room-seat-button room-seat-occupied"
                            title="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                            aria-label="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                            disabled
                            aria-disabled="true"
                        ></button>
                    `);
                }
                else {
                    seatCells.push(`
                        <button
                            type="button"
                            class="room-seat room-seat-button room-seat-available${isSelected ? " room-seat-selected" : ""}"
                            title="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                            aria-label="${rowNumber}. sor ${seatNumber}. szék - ${stateLabel}"
                            aria-pressed="${isSelected ? "true" : "false"}"
                            data-seat-id="${seat.seatId}"
                        ></button>
                    `);
                }
            }
            if (aisleIndex && seatNumber === aisleIndex) {
                seatCells.push('<span class="room-seat-aisle" aria-hidden="true"></span>');
            }
        }
        return `
            <div class="room-seat-row">
                <div class="room-seat-row-label">${rowNumber}. sor</div>
                <div class="room-seat-row-grid" style="--seat-columns: ${maxSeatNumber}; --seat-aisle-columns: ${aisleIndex ? maxSeatNumber + 1 : maxSeatNumber};">${seatCells.join("")}</div>
            </div>
        `;
    }).join("");
    return `
        <div class="room-seat-map">
            <div class="room-seat-screen">Vászon</div>
            <div class="room-seat-layout">${seatRowsMarkup}</div>
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
        </div>
    `;
}
export function getAvailableSelectedSeatIds(screeningId, seats, maxAllowed = Number.MAX_SAFE_INTEGER) {
    const reservedSeatIds = new Set(seats.filter((seat) => Boolean(seat.isReserved)).map((seat) => seat.seatId));
    const selectedSeatIds = getSelectedSeatIds(screeningId)
        .filter((seatId) => !reservedSeatIds.has(seatId))
        .slice(0, Math.max(0, maxAllowed));
    saveSelectedSeatIds(screeningId, selectedSeatIds);
    return new Set(selectedSeatIds);
}
export function initializeRoomSeatSelection(screeningId, getSeatSelectionLimit, onSelectionChange) {
    if (!roomDetails)
        return;
    const seatButtons = roomDetails.querySelectorAll(".room-seat-button[data-seat-id]");
    Array.from(seatButtons).forEach((seatButton) => {
        seatButton.addEventListener("click", () => {
            if (seatButton.disabled)
                return;
            const seatId = Number(seatButton.dataset.seatId);
            if (!seatId)
                return;
            const selectedSeatIds = getSelectedSeatIds(screeningId);
            const isSelected = selectedSeatIds.includes(seatId);
            const seatSelectionLimit = getSeatSelectionLimit();
            if (isSelected) {
                saveSelectedSeatIds(screeningId, selectedSeatIds.filter((id) => id !== seatId));
            }
            else {
                if (seatSelectionLimit <= 0) {
                    alert("Előbb válassz jegytípust és darabszámot.");
                    return;
                }
                if (selectedSeatIds.length >= seatSelectionLimit) {
                    alert("Csak annyi helyet választhatsz, amennyi jegyet beállítottál.");
                    return;
                }
                saveSelectedSeatIds(screeningId, [...selectedSeatIds, seatId]);
            }
            onSelectionChange();
        });
    });
}
function resolveServerTicketId(tickets, screeningTickets) {
    const selected = tickets.filter((ticket) => ticket.quantity > 0);
    if (selected.length !== 1) {
        return null;
    }
    const ticketTypeId = selected[0].ticketTypeId;
    const matchingTicket = screeningTickets.find((ticket) => Number(ticket.ticketTypeId ?? ticket.TicketTypeId) === ticketTypeId);
    return Number(matchingTicket?.ticketId ?? matchingTicket?.TicketId) || null;
}
function buildServerSeatDtos(roomId, seats) {
    return seats.map((seat) => ({
        seatId: seat.seatId,
        rowNumber: seat.rowNumber,
        seatNumber: seat.seatNumber,
        roomId,
        isReserved: false,
    }));
}
export async function renderRoomPage() {
    if (!roomDetails)
        return;
    const selectedScreening = getSelectedScreeningState();
    if (!selectedScreening) {
        window.location.replace("../Főoldalak/Cinema.html");
        return;
    }
    await ensureRoomsLoaded();
    const room = getRoomById(selectedScreening.roomId);
    const roomName = getRoomLabel(selectedScreening.roomId, selectedScreening.roomName);
    const formattedDate = new Date(selectedScreening.date).toLocaleString("hu-HU");
    const isLoggedIn = Boolean((await ensureCurrentUserIdLoaded()) || false);
    const bookingLabel = isLoggedIn ? "Kosárba" : "Bejelentkezés a kosárhoz";
    let seats = [];
    try {
        seats = await fetchSeatsForRoom(selectedScreening.roomId, selectedScreening.filmScreeningId);
    }
    catch (error) {
        console.error(error);
        seats = room?.seats ?? [];
    }
    const ticketTypes = await ensureTicketTypesLoaded();
    const availableTickets = getAllowedTicketsForRoom(roomName, ticketTypes);
    const screeningTickets = await fetchScreeningTickets(selectedScreening.filmScreeningId);
    const availableSeatCount = seats.filter((seat) => !seat.isReserved).length;
    let selectedTickets = clampSelectedTicketQuantities(getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets), availableSeatCount);
    saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
    const selectedSeatIds = getAvailableSelectedSeatIds(selectedScreening.filmScreeningId, seats, getSelectedTicketQuantityTotal(selectedTickets));
    roomDetails.innerHTML = `
        <section class="container py-4">
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
        </section>
    `;
    const addToCartButton = document.getElementById("addToCartButton");
    const roomTicketSummary = document.getElementById("roomTicketSelectionSummary");
    const roomSeatSummary = document.getElementById("roomSeatSelectionSummary");
    const updateRoomSelectionState = () => {
        selectedTickets = clampSelectedTicketQuantities(getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets), availableSeatCount);
        saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
        const totalTickets = getSelectedTicketQuantityTotal(selectedTickets);
        const limitedSelectedSeatIds = getAvailableSelectedSeatIds(selectedScreening.filmScreeningId, seats, totalTickets);
        const seatButtons = roomDetails.querySelectorAll(".room-seat-button[data-seat-id]");
        Array.from(seatButtons).forEach((seatButton) => {
            const seatId = Number(seatButton.dataset.seatId);
            const isSelected = limitedSelectedSeatIds.has(seatId);
            const isSeatSelectionEnabled = totalTickets > 0;
            seatButton.disabled = !isSeatSelectionEnabled;
            seatButton.classList.toggle("room-seat-disabled", !isSeatSelectionEnabled);
            seatButton.classList.toggle("room-seat-selected", isSelected);
            seatButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
            seatButton.setAttribute("aria-disabled", seatButton.disabled ? "true" : "false");
        });
        for (const ticket of availableTickets) {
            const ticketTypeId = getTicketTypeId(ticket);
            if (ticketTypeId === null)
                continue;
            const currentQuantity = selectedTickets.find((selectedTicket) => selectedTicket.ticketTypeId === ticketTypeId)?.quantity ?? 0;
            const decrementButton = roomDetails.querySelector(`[data-ticket-action="decrement"][data-ticket-type-id="${ticketTypeId}"]`);
            const incrementButton = roomDetails.querySelector(`[data-ticket-action="increment"][data-ticket-type-id="${ticketTypeId}"]`);
            const counterValue = document.getElementById(`roomTicketCount-${ticketTypeId}`);
            if (counterValue)
                counterValue.textContent = String(currentQuantity);
            if (decrementButton)
                decrementButton.disabled = currentQuantity <= 0;
            if (incrementButton)
                incrementButton.disabled = totalTickets >= availableSeatCount || availableSeatCount === 0;
        }
        if (roomTicketSummary) {
            roomTicketSummary.textContent = totalTickets > 0
                ? `Kiválasztott jegyek: ${getTicketSummaryText(selectedTickets)}`
                : "Előbb válassz jegytípust és darabszámot.";
        }
        if (roomSeatSummary) {
            roomSeatSummary.textContent = totalTickets > 0
                ? `Kiválasztott székek: ${limitedSelectedSeatIds.size}/${totalTickets}`
                : "Jegyválasztás után tudsz székeket kijelölni.";
        }
        if (addToCartButton) {
            addToCartButton.disabled = totalTickets === 0 || limitedSelectedSeatIds.size !== totalTickets;
        }
    };
    initializeRoomSeatSelection(selectedScreening.filmScreeningId, () => getSelectedTicketQuantityTotal(selectedTickets), updateRoomSelectionState);
    const ticketStepperButtons = roomDetails.querySelectorAll("[data-ticket-action][data-ticket-type-id]");
    Array.from(ticketStepperButtons).forEach((button) => {
        button.addEventListener("click", () => {
            const ticketTypeId = Number(button.dataset.ticketTypeId);
            const ticketAction = button.dataset.ticketAction;
            if (!ticketTypeId || !ticketAction)
                return;
            const currentQuantities = new Map(selectedTickets.map((ticket) => [ticket.ticketTypeId, ticket.quantity]));
            const currentQuantity = currentQuantities.get(ticketTypeId) ?? 0;
            const currentTotal = getSelectedTicketQuantityTotal(selectedTickets);
            if (ticketAction === "increment") {
                if (currentTotal >= availableSeatCount)
                    return;
                currentQuantities.set(ticketTypeId, currentQuantity + 1);
            }
            if (ticketAction === "decrement") {
                if (currentQuantity <= 1) {
                    currentQuantities.delete(ticketTypeId);
                }
                else {
                    currentQuantities.set(ticketTypeId, currentQuantity - 1);
                }
            }
            selectedTickets = availableTickets
                .map((ticket) => {
                const nextTicketTypeId = getTicketTypeId(ticket);
                if (nextTicketTypeId === null)
                    return null;
                const quantity = currentQuantities.get(nextTicketTypeId) ?? 0;
                if (quantity <= 0)
                    return null;
                return {
                    ticketTypeId: nextTicketTypeId,
                    ticketName: getTicketName(ticket),
                    unitPrice: getTicketPrice(ticket),
                    quantity,
                };
            })
                .filter((ticket) => Boolean(ticket));
            saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
            updateRoomSelectionState();
        });
    });
    updateRoomSelectionState();
    if (addToCartButton) {
        addToCartButton.addEventListener("click", async () => {
            const userId = await ensureCurrentUserIdLoaded();
            if (!userId) {
                window.location.href = "../Főoldalak/Bejelentkezes.html";
                return;
            }
            const selectedIds = getSelectedSeatIds(selectedScreening.filmScreeningId);
            if (!selectedIds.length) {
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
            const ticketId = resolveServerTicketId(ticketsForCart, screeningTickets);
            if (!ticketId) {
                alert("Ehhez az összeállításhoz a backend jelenleg egyszerre egy jegytípust támogat.");
                return;
            }
            const seatsForCart = seats
                .filter((seat) => selectedIds.includes(seat.seatId))
                .map((seat) => ({
                seatId: seat.seatId,
                rowNumber: seat.rowNumber,
                seatNumber: seat.seatNumber,
            }));
            const addedCart = await addToServerCart({
                userId,
                filmScreeningId: selectedScreening.filmScreeningId,
                ticketId,
                amount: totalSelectedTickets,
                seats: buildServerSeatDtos(selectedScreening.roomId, seatsForCart),
            });
            if (!addedCart || !Number(addedCart.cartId ?? addedCart.CartId)) {
                showReservationMessage("A kosárba helyezés nem sikerült.", true);
                return;
            }
            clearSelectedSeats(selectedScreening.filmScreeningId);
            clearSelectedTicketQuantities(selectedScreening.filmScreeningId);
            await renderRoomPage();
            showReservationMessage("A kiválasztott jegyek bekerültek a szerveres kosárba.", false);
        });
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    if (roomDetails) {
        await renderRoomPage();
    }
});
