import { fetchJegyekList } from "../Core/api.js";
import { formatPrice } from "../Core/common.js";
const selectedTicketStorageKeyPrefix = "cinemaSelectedTickets";
let allTicketTypes = [];
const jegyekTbody = document.getElementById("jegyekTbody");
// Ticket objektumból kiolvassák a fontos adatokat
export function getTicketName(ticket) {
    return ticket.ticketType;
}
export function getTicketPrice(ticket) {
    return ticket.ticketPrice;
}
export function getTicketTypeId(ticket) {
    return ticket.ticketTypeId;
}
// Betölti egyszer az összes jegytípust az API-ról, és visszaadja őket
export async function ensureTicketTypesLoaded() {
    if (allTicketTypes.length === 0) {
        allTicketTypes = await fetchJegyekList();
    }
    return allTicketTypes;
}
// Megmondja, hogy adott vetítéshez milyen kulccsal tároljuk a jegyválasztást sessionStorage-ban
function getSelectedTicketStorageKey(screeningId) {
    return `${selectedTicketStorageKeyPrefix}:${screeningId}`;
}
// Visszaolvassa az adott vetítéshez elmentett jegymennyiségeket
export function getStoredTicketSelections(screeningId) {
    const rawSelections = sessionStorage.getItem(getSelectedTicketStorageKey(screeningId));
    if (!rawSelections) {
        return [];
    }
    try {
        const parsedSelections = JSON.parse(rawSelections);
        if (!Array.isArray(parsedSelections)) {
            return [];
        }
        const result = [];
        for (let i = 0; i < parsedSelections.length; i++) {
            const selection = parsedSelections[i];
            const ticketTypeId = Number(selection.ticketTypeId);
            const quantity = Number(selection.quantity);
            if (!ticketTypeId) {
                continue;
            }
            if (!quantity) {
                continue;
            }
            if (quantity <= 0) {
                continue;
            }
            result.push({
                ticketTypeId: ticketTypeId,
                quantity: quantity,
            });
        }
        return result;
    }
    catch {
        return [];
    }
}
// Elmenti a kiválasztott jegymennyiségeket sessionStorage-ba
export function saveStoredTicketSelections(screeningId, selections) {
    const validSelections = [];
    for (let i = 0; i < selections.length; i++) {
        if (selections[i].quantity > 0) {
            validSelections.push(selections[i]);
        }
    }
    if (validSelections.length === 0) {
        sessionStorage.removeItem(getSelectedTicketStorageKey(screeningId));
        return;
    }
    sessionStorage.setItem(getSelectedTicketStorageKey(screeningId), JSON.stringify(validSelections));
}
// Kitörli az adott vetítéshez a jegyválasztást
export function clearSelectedTicketQuantities(screeningId) {
    sessionStorage.removeItem(getSelectedTicketStorageKey(screeningId));
}
// Az elmentett darabszámokból és az elérhető jegyekből összerakja a tényleges kiválasztott jegylistát
export function getSelectedTicketQuantities(screeningId, availableTickets) {
    const storedSelections = getStoredTicketSelections(screeningId);
    const result = [];
    for (let i = 0; i < availableTickets.length; i++) {
        const ticket = availableTickets[i];
        const ticketTypeId = ticket.ticketTypeId;
        let quantity = 0;
        for (let j = 0; j < storedSelections.length; j++) {
            if (storedSelections[j].ticketTypeId === ticketTypeId) {
                quantity = storedSelections[j].quantity;
                break;
            }
        }
        if (quantity <= 0) {
            continue;
        }
        result.push({
            ticketTypeId: ticket.ticketTypeId,
            ticketType: ticket.ticketType,
            unitPrice: ticket.ticketPrice,
            quantity: quantity,
        });
    }
    return result;
}
// A kiválasztott jegyeket egyszerűbb tárolható formára alakítja és elmenti
export function saveSelectedTicketQuantities(screeningId, tickets) {
    const storedSelections = [];
    for (let i = 0; i < tickets.length; i++) {
        storedSelections.push({
            ticketTypeId: tickets[i].ticketTypeId,
            quantity: tickets[i].quantity,
        });
    }
    saveStoredTicketSelections(screeningId, storedSelections);
}
// Megnézi, hogy egy szöveg tartalmazza-e azt, hogy vip
export function isVipLabel(value) {
    return String(value || "").toLowerCase().includes("vip");
}
// VIP terem esetén csak VIP jegyeket ad vissza, normál teremnél pedig a nem VIP jegyeket
export function getAllowedTicketsForRoom(roomName, tickets) {
    const result = [];
    const roomIsVip = isVipLabel(roomName);
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const ticketIsVip = isVipLabel(ticket.ticketType);
        if (roomIsVip) {
            if (ticketIsVip) {
                result.push(ticket);
            }
        }
        else {
            if (!ticketIsVip) {
                result.push(ticket);
            }
        }
    }
    if (result.length > 0) {
        return result;
    }
    return tickets;
}
export function getAllowedTicketsForScreening(roomName, ticketTypes, screeningTickets) {
    const screeningAvailableTickets = [];
    for (let i = 0; i < screeningTickets.length; i++) {
        const ticketTypeId = screeningTickets[i].ticketTypeId;
        for (let j = 0; j < ticketTypes.length; j++) {
            if (ticketTypes[j].ticketTypeId !== ticketTypeId) {
                continue;
            }
            let alreadyIncluded = false;
            for (let k = 0; k < screeningAvailableTickets.length; k++) {
                if (screeningAvailableTickets[k].ticketTypeId === ticketTypeId) {
                    alreadyIncluded = true;
                    break;
                }
            }
            if (!alreadyIncluded) {
                screeningAvailableTickets.push(ticketTypes[j]);
            }
            break;
        }
    }
    if (screeningAvailableTickets.length === 0) {
        return getAllowedTicketsForRoom(roomName, ticketTypes);
    }
    const roomFilteredTickets = getAllowedTicketsForRoom(roomName, screeningAvailableTickets);
    if (roomFilteredTickets.length > 0) {
        return roomFilteredTickets;
    }
    return screeningAvailableTickets;
}
// Összeadja, hogy összesen hány jegy van kiválasztva
export function getSelectedTicketQuantityTotal(tickets) {
    let total = 0;
    for (let i = 0; i < tickets.length; i++) {
        total += tickets[i].quantity;
    }
    return total;
}
// Kiszámolja a kiválasztott jegyek teljes árát
export function getTicketSelectionsTotalPrice(tickets) {
    let total = 0;
    for (let i = 0; i < tickets.length; i++) {
        total += tickets[i].unitPrice * tickets[i].quantity;
    }
    return total;
}
// Olvasható szöveget csinál a kiválasztott jegyekből
export function getTicketSummaryText(tickets) {
    if (tickets.length === 0) {
        return "Nincs kiválasztott jegy";
    }
    let text = "";
    for (let i = 0; i < tickets.length; i++) {
        const part = `${tickets[i].quantity}x ${tickets[i].ticketType}`;
        if (i === 0) {
            text += part;
        }
        else {
            text += ", " + part;
        }
    }
    return text;
}
// Összefoglalót csinál a kiválasztott jegyekből és az összárból
export function getTicketSummaryMarkup(tickets) {
    if (tickets.length === 0) {
        return "<div>Jegyek: Nincs kiválasztott jegy</div>";
    }
    const totalPrice = getTicketSelectionsTotalPrice(tickets);
    return `<div>Jegyek: ${getTicketSummaryText(tickets)}</div>
        <div class="text-muted small">Jegyek összesen: ${formatPrice(totalPrice)}</div>`;
}
// Ha a backendből jön egy kosár vagy foglalás elem ticketId-val,
// akkor megpróbálja visszaépíteni, hogy milyen jegytípus és mennyiség volt
export function resolveTicketSelectionFromServerItem(item, screeningTickets, ticketTypes) {
    if (!item.ticketId) {
        return [];
    }
    let ticketTypeId = 0;
    // Megkeressük, hogy a ticketId melyik ticketTypeId-hoz tartozik
    for (let i = 0; i < screeningTickets.length; i++) {
        if (screeningTickets[i].ticketId === item.ticketId) {
            ticketTypeId = screeningTickets[i].ticketTypeId;
            break;
        }
    }
    if (!ticketTypeId) {
        return [];
    }
    // Ha megtaláltuk, visszaadjuk a teljes jegyadatot
    for (let i = 0; i < ticketTypes.length; i++) {
        if (ticketTypes[i].ticketTypeId === ticketTypeId) {
            return [
                {
                    ticketTypeId: ticketTypes[i].ticketTypeId,
                    ticketType: ticketTypes[i].ticketType,
                    unitPrice: ticketTypes[i].ticketPrice,
                    quantity: item.amount ? item.amount : 1,
                }
            ];
        }
    }
    return [];
}
// Levágja a kiválasztott jegyeket maxAllowed darabra
// pl. ha több jegy van, mint amennyi szabad hely
export function clampSelectedTicketQuantities(tickets, maxAllowed) {
    const result = [];
    let remaining = maxAllowed;
    if (remaining < 0) {
        remaining = 0;
    }
    for (let i = 0; i < tickets.length; i++) {
        if (remaining <= 0) {
            break;
        }
        let quantity = tickets[i].quantity;
        if (quantity > remaining) {
            quantity = remaining;
        }
        if (quantity > 0) {
            result.push({
                ticketTypeId: tickets[i].ticketTypeId,
                ticketType: tickets[i].ticketType,
                unitPrice: tickets[i].unitPrice,
                quantity: quantity,
            });
            remaining -= quantity;
        }
    }
    return result;
}
// Kirajzolja a jegyválasztó részt a terem oldalon
export function renderRoomTicketSelectionMarkup(availableTickets, selectedTickets) {
    if (availableTickets.length === 0) {
        return `<div class="alert alert-warning mb-0">
                Ehhez a teremhez most nincs elérhető jegytípus.
            </div>`;
    }
    let html = `<div class="room-ticket-picker">
            <div class="room-ticket-picker-header">
                <h2 class="room-ticket-picker-title">Jegyek kiválasztása</h2>
                <p class="room-ticket-picker-lead">Válaszd ki, melyik jegytípusból mennyit szeretnél, és utána pontosan ugyanennyi széket tudsz kijelölni.</p>
            </div>
            <div class="room-ticket-counter-grid">`;
    for (let i = 0; i < availableTickets.length; i++) {
        const ticket = availableTickets[i];
        let quantity = 0;
        // Megnézi, hogy ebből a jegytípusból jelenleg mennyi van kiválasztva
        for (let j = 0; j < selectedTickets.length; j++) {
            if (selectedTickets[j].ticketTypeId === ticket.ticketTypeId) {
                quantity = selectedTickets[j].quantity;
                break;
            }
        }
        html +=
            `<article class="room-ticket-counter-card">
                <div class="room-ticket-counter-top">
                    <div class="room-ticket-counter-title">${ticket.ticketType}</div>
                    <div class="room-ticket-stepper" role="group" aria-label="${ticket.ticketType} darabszám">
                        <div class="room-ticket-stepper-controls">
                            <button type="button" class="room-ticket-stepper-btn" data-ticket-action="increment" data-ticket-type-id="${ticket.ticketTypeId}" aria-label="${ticket.ticketType} mennyiség növelése"></button>
                            <button type="button" class="room-ticket-stepper-btn" data-ticket-action="decrement" data-ticket-type-id="${ticket.ticketTypeId}" aria-label="${ticket.ticketType} mennyiség csökkentése"></button>
                        </div>
                        <span id="roomTicketCount-${ticket.ticketTypeId}" class="room-ticket-stepper-value">${quantity}</span>
                    </div>
                </div>
                <div class="room-ticket-counter-price">${formatPrice(ticket.ticketPrice)}/db</div>
            </article>`;
    }
    html +=
        `</div>
            <div class="room-ticket-selection-footer">
                <div id="roomTicketSelectionSummary" class="room-ticket-selection-summary"></div>
                <div id="roomSeatSelectionSummary" class="room-ticket-selection-summary"></div>
            </div>
        </div>`;
    return html;
}
// A jegyek táblázat kirajzolása
export async function renderjegyekTable() {
    if (!jegyekTbody) {
        return;
    }
    try {
        const jegyek = await ensureTicketTypesLoaded();
        jegyekTbody.innerHTML = "";
        if (jegyek.length === 0) {
            jegyekTbody.innerHTML =
                `<tr>
                    <td colspan="2" class="text-center text-muted">Nincs megjeleníthető Jegy.</td>
                </tr>`;
            return;
        }
        for (let i = 0; i < jegyek.length; i++) {
            const jegy = jegyek[i];
            const row = document.createElement("tr");
            row.innerHTML =
                `<td>${jegy.ticketType}</td>
                <td>${jegy.ticketPrice} Ft</td>`;
            jegyekTbody.appendChild(row);
        }
    }
    catch (error) {
        console.error(error);
        jegyekTbody.innerHTML =
            `<tr>
                <td colspan="2" class="text-center text-danger">Hiba történt a lista betöltésekor.</td>
            </tr>`;
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    if (jegyekTbody) {
        await renderjegyekTable();
    }
});
