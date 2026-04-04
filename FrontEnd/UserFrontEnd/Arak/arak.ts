import { fetchJegyekList } from "../Core/api.js";
import { formatPrice, parseNumericId } from "../Core/common.js";

export interface TicketTypeDto {
    Id: number;
    ticketTypeId?: number;
    name?: string;
    ticketName: string;
    price?: number;
    ticketType?: string;
    ticketPrice?: number;
}

export interface SelectedTicketQuantity {
    ticketTypeId: number;
    ticketName: string;
    unitPrice: number | null;
    quantity: number;
}

export interface StoredTicketSelection {
    ticketTypeId: number;
    quantity: number;
}

export interface ScreeningTicketDto {
    ticketId?: number;
    ticketTypeId?: number;
    filmScreeningId?: number;
    TicketId?: number;
    TicketTypeId?: number;
    FilmScreeningId?: number;
}

const selectedTicketStorageKeyPrefix = "cinemaSelectedTickets";
let allTicketTypes: TicketTypeDto[] = [];
const jegyekTbody = document.getElementById("jegyekTbody") as HTMLTableSectionElement | null;

export function getTicketName(ticket: TicketTypeDto): string {
    const t = ticket as unknown as Record<string, unknown>;
    const keys = ["ticketType", "ticket_type", "ticketName", "tickettype", "name", "Name"];

    for (const k of keys) {
        const v = t[k];
        if (typeof v === "string" && v.trim()) return v.trim();
    }

    return (ticket.ticketName ?? ticket.name ?? "").trim();
}

export function getTicketPrice(ticket: TicketTypeDto): number | null {
    const t = ticket as unknown as Record<string, unknown>;
    const keys = ["price", "Price", "amount", "Amount", "value", "Value", "ticketPrice", "ticketprice", "ticket_price"];

    for (const k of keys) {
        const v = t[k];
        if (typeof v !== "undefined" && v !== null && !Number.isNaN(Number(v))) {
            return Number(v);
        }
    }

    return null;
}

export function getTicketTypeId(ticket: TicketTypeDto): number | null {
    const t = ticket as unknown as Record<string, unknown>;
    const keys = ["ticketTypeId", "TicketTypeId", "id", "Id"];

    for (const k of keys) {
        const v = t[k];
        if (typeof v !== "undefined" && v !== null && !Number.isNaN(Number(v))) {
            return Number(v);
        }
    }

    return null;
}

export async function ensureTicketTypesLoaded(): Promise<TicketTypeDto[]> {
    if (allTicketTypes.length === 0) {
        allTicketTypes = await fetchJegyekList() as TicketTypeDto[];
    }

    return allTicketTypes;
}

function getSelectedTicketStorageKey(screeningId: number): string {
    return `${selectedTicketStorageKeyPrefix}:${screeningId}`;
}

export function getStoredTicketSelections(screeningId: number): StoredTicketSelection[] {
    const rawSelections = sessionStorage.getItem(getSelectedTicketStorageKey(screeningId));
    if (!rawSelections) return [];

    try {
        const parsedSelections = JSON.parse(rawSelections) as unknown;
        if (!Array.isArray(parsedSelections)) return [];

        return parsedSelections
            .map((selection) => {
                const candidate = selection as Partial<StoredTicketSelection> | null;
                const ticketTypeId = Number(candidate?.ticketTypeId);
                const quantity = Number(candidate?.quantity);

                if (!ticketTypeId || !quantity || quantity < 0) return null;
                return { ticketTypeId, quantity };
            })
            .filter((selection): selection is StoredTicketSelection => Boolean(selection && selection.quantity > 0));
    } catch {
        return [];
    }
}

export function saveStoredTicketSelections(screeningId: number, selections: StoredTicketSelection[]): void {
    const normalizedSelections = selections.filter((selection) => selection.quantity > 0);

    if (normalizedSelections.length === 0) {
        sessionStorage.removeItem(getSelectedTicketStorageKey(screeningId));
        return;
    }

    sessionStorage.setItem(getSelectedTicketStorageKey(screeningId), JSON.stringify(normalizedSelections));
}

export function clearSelectedTicketQuantities(screeningId: number): void {
    sessionStorage.removeItem(getSelectedTicketStorageKey(screeningId));
}

export function getSelectedTicketQuantities(screeningId: number, availableTickets: TicketTypeDto[]): SelectedTicketQuantity[] {
    const quantityByTicketId = new Map<number, number>(
        getStoredTicketSelections(screeningId).map((selection) => [selection.ticketTypeId, selection.quantity]),
    );

    return availableTickets
        .map((ticket) => {
            const ticketTypeId = getTicketTypeId(ticket);
            if (ticketTypeId === null) return null;

            const quantity = quantityByTicketId.get(ticketTypeId) ?? 0;
            if (quantity <= 0) return null;

            return {
                ticketTypeId,
                ticketName: getTicketName(ticket),
                unitPrice: getTicketPrice(ticket),
                quantity,
            };
        })
        .filter((ticket): ticket is SelectedTicketQuantity => Boolean(ticket));
}

export function saveSelectedTicketQuantities(screeningId: number, tickets: SelectedTicketQuantity[]): void {
    saveStoredTicketSelections(
        screeningId,
        tickets.map((ticket) => ({
            ticketTypeId: ticket.ticketTypeId,
            quantity: ticket.quantity,
        })),
    );
}

export function isVipLabel(value: string | null | undefined): boolean {
    return (value ?? "").trim().toLowerCase().includes("vip");
}

export function getAllowedTicketsForRoom(roomName: string, tickets: TicketTypeDto[]): TicketTypeDto[] {
    const filteredTickets = tickets.filter((ticket) => isVipLabel(roomName)
        ? isVipLabel(getTicketName(ticket))
        : !isVipLabel(getTicketName(ticket)));

    return filteredTickets.length > 0 ? filteredTickets : tickets;
}

export function getSelectedTicketQuantityTotal(tickets: SelectedTicketQuantity[]): number {
    return tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
}

export function getTicketSelectionsTotalPrice(tickets: SelectedTicketQuantity[]): number | null {
    let total = 0;

    for (const ticket of tickets) {
        if (ticket.unitPrice === null) return null;
        total += ticket.unitPrice * ticket.quantity;
    }

    return total;
}

export function getTicketSummaryText(tickets: SelectedTicketQuantity[]): string {
    if (tickets.length === 0) return "Nincs kiválasztott jegy";
    return tickets.map((ticket) => `${ticket.quantity}x ${ticket.ticketName}`).join(", ");
}

export function getTicketSummaryMarkup(tickets: SelectedTicketQuantity[]): string {
    if (tickets.length === 0) {
        return "<div>Jegyek: Nincs kiválasztott jegy</div>";
    }

    const totalPrice = getTicketSelectionsTotalPrice(tickets);
    return `
        <div>Jegyek: ${getTicketSummaryText(tickets)}</div>
        ${totalPrice !== null ? `<div class="text-muted small">Jegyek összesen: ${formatPrice(totalPrice)}</div>` : ""}
    `;
}

export function resolveTicketSelectionFromServerItem(
    item: { ticketId?: number; amount?: number },
    screeningTickets: ScreeningTicketDto[],
    ticketTypes: TicketTypeDto[],
): SelectedTicketQuantity[] {
    if (!item.ticketId) return [];

    const screeningTicket = screeningTickets.find((ticket) => parseNumericId(ticket.ticketId ?? ticket.TicketId) === item.ticketId);
    const ticketTypeId = parseNumericId(screeningTicket?.ticketTypeId ?? screeningTicket?.TicketTypeId);

    if (!ticketTypeId) return [];

    const ticketType = ticketTypes.find((ticket) => getTicketTypeId(ticket) === ticketTypeId);
    return [{
        ticketTypeId,
        ticketName: ticketType ? getTicketName(ticketType) : `Jegy #${ticketTypeId}`,
        unitPrice: ticketType ? getTicketPrice(ticketType) : null,
        quantity: Math.max(1, item.amount ?? 1),
    }];
}

export function clampSelectedTicketQuantities(tickets: SelectedTicketQuantity[], maxAllowed: number): SelectedTicketQuantity[] {
    let remaining = Math.max(0, maxAllowed);

    return tickets
        .map((ticket) => {
            if (remaining <= 0) {
                return { ...ticket, quantity: 0 };
            }

            const quantity = Math.min(ticket.quantity, remaining);
            remaining -= quantity;
            return { ...ticket, quantity };
        })
        .filter((ticket) => ticket.quantity > 0);
}

export function renderRoomTicketSelectionMarkup(
    availableTickets: TicketTypeDto[],
    selectedTickets: SelectedTicketQuantity[],
): string {
    if (availableTickets.length === 0) {
        return `
            <div class="alert alert-warning mb-0">
                Ehhez a teremhez most nincs elérhető jegytípus.
            </div>
        `;
    }

    const selectedCounts = new Map<number, number>(selectedTickets.map((ticket) => [ticket.ticketTypeId, ticket.quantity]));

    return `
        <div class="room-ticket-picker">
            <div class="room-ticket-picker-header">
                <h2 class="room-ticket-picker-title">Jegyek kiválasztása</h2>
                <p class="room-ticket-picker-lead">Válaszd ki, melyik jegytípusból mennyit szeretnél, és utána pontosan ugyanennyi széket tudsz kijelölni.</p>
            </div>
            <div class="room-ticket-counter-grid">
                ${availableTickets.map((ticket) => {
                    const ticketTypeId = getTicketTypeId(ticket);
                    if (ticketTypeId === null) return "";

                    const quantity = selectedCounts.get(ticketTypeId) ?? 0;
                    const ticketName = getTicketName(ticket);
                    const ticketPrice = getTicketPrice(ticket);

                    return `
                        <article class="room-ticket-counter-card">
                            <div class="room-ticket-counter-top">
                                <div class="room-ticket-counter-title">${ticketName}</div>
                                <div class="room-ticket-stepper" role="group" aria-label="${ticketName} darabszám">
                                    <div class="room-ticket-stepper-controls">
                                        <button type="button" class="room-ticket-stepper-btn" data-ticket-action="increment" data-ticket-type-id="${ticketTypeId}" aria-label="${ticketName} mennyiség növelése"></button>
                                        <button type="button" class="room-ticket-stepper-btn" data-ticket-action="decrement" data-ticket-type-id="${ticketTypeId}" aria-label="${ticketName} mennyiség csökkentése"></button>
                                    </div>
                                    <span id="roomTicketCount-${ticketTypeId}" class="room-ticket-stepper-value">${quantity}</span>
                                </div>
                            </div>
                            <div class="room-ticket-counter-price">${ticketPrice !== null ? `${formatPrice(ticketPrice)}/db` : "Ár nem elérhető"}</div>
                        </article>
                    `;
                }).join("")}
            </div>
            <div class="room-ticket-selection-footer">
                <div id="roomTicketSelectionSummary" class="room-ticket-selection-summary"></div>
                <div id="roomSeatSelectionSummary" class="room-ticket-selection-summary"></div>
            </div>
        </div>
    `;
}

export async function renderjegyekTable(): Promise<void> {
    if (!jegyekTbody) return;

    try {
        const jegyek = await ensureTicketTypesLoaded();
        jegyekTbody.innerHTML = "";

        if (jegyek.length === 0) {
            jegyekTbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">Nincs megjeleníthető Jegy.</td>
                </tr>
            `;
            return;
        }

        for (const jegy of jegyek) {
            const row = document.createElement("tr");
            const priceVal = getTicketPrice(jegy);
            row.innerHTML = `
                <td>${getTicketName(jegy)}</td>
                <td>${priceVal !== null ? String(priceVal) : "-"} Ft</td>
            `;
            jegyekTbody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        jegyekTbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-danger">Hiba történt a lista betöltésekor.</td>
            </tr>
        `;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    if (jegyekTbody) {
        await renderjegyekTable();
    }
});
