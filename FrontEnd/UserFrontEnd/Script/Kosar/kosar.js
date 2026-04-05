import { clearServerCart, createServerReservation, fetchReservationConfirmation, fetchScreeningTickets, fetchServerCart, removeServerCart, saveStoredReservation } from "../Core/api.js";
import { cartButtonId, formatPrice, showReservationMessage } from "../Core/common.js";
import { ensureCurrentUserIdLoaded, applyLoginState } from "../Fooldalak/auth.js";
import { ensureMoviesLoaded, getRoomLabel } from "../Fooldalak/cinema.js";
import { ensureTicketTypesLoaded, getTicketSummaryMarkup, resolveTicketSelectionFromServerItem } from "../Arak/arak.js";
function getConfirmationSeatLabels(confirmation, item) {
    const sourceSeats = confirmation?.seats ?? confirmation?.Seats;
    if (Array.isArray(sourceSeats)) {
        const result = [];
        for (let i = 0; i < sourceSeats.length; i++) {
            const seatText = String(sourceSeats[i] ?? "").trim();
            if (seatText) {
                result.push(seatText);
            }
        }
        if (result.length > 0) {
            return result;
        }
    }
    const result = [];
    for (let i = 0; i < item.seats.length; i++) {
        result.push(`${item.seats[i].rowNumber}. sor ${item.seats[i].seatNumber}. szék`);
    }
    return result;
}
// Megkeresi, hogy egy filmScreeningId-hoz milyen film, terem és dátum tartozik
async function resolveScreeningState(screeningId) {
    const movies = await ensureMoviesLoaded();
    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        for (let j = 0; j < movie.screenings.length; j++) {
            const screening = movie.screenings[j];
            if (screening.filmScreeningId === screeningId) {
                return {
                    filmScreeningId: screening.filmScreeningId,
                    movieTitle: movie.movieTitle,
                    roomId: screening.roomId,
                    roomName: getRoomLabel(screening.roomId, screening.roomName),
                    date: screening.date,
                };
            }
        }
    }
    return null;
}
// Egy kosár elemhez hozzárakja a megjelenítéshez szükséges plusz adatokat
// pl. filmcím, teremnév, jegyek
async function enrichServerCartItem(item) {
    const screening = await resolveScreeningState(item.filmScreeningId);
    const screeningTickets = await fetchScreeningTickets(item.filmScreeningId);
    const ticketTypes = await ensureTicketTypesLoaded();
    const tickets = resolveTicketSelectionFromServerItem({ ticketId: item.ticketId, amount: item.amount }, screeningTickets, ticketTypes);
    return {
        item: item,
        screening: screening,
        tickets: tickets,
    };
}
// A lebegő kosár ikon kis számát frissíti
export async function refreshFloatingCartBadge() {
    const existingButton = document.getElementById(cartButtonId);
    if (!existingButton) {
        return;
    }
    const userId = await ensureCurrentUserIdLoaded();
    let count = 0;
    if (userId) {
        const items = await fetchServerCart(userId);
        for (let i = 0; i < items.length; i++) {
            count += items[i].seats.length;
        }
    }
    let badge = existingButton.querySelector(".floating-cart-badge");
    if (!badge) {
        badge = document.createElement("span");
        badge.className = "floating-cart-badge";
        existingButton.appendChild(badge);
    }
    badge.textContent = String(count);
    badge.style.display = count > 0 ? "flex" : "none";
}
// Kirajzolja a kosár oldalt
export async function renderCartPage() {
    const mainSection = document.querySelector("main.page-section");
    if (!mainSection) {
        return;
    }
    const userId = await ensureCurrentUserIdLoaded();
    // Ha nincs belépve, ne lássa a kosarat
    if (!userId) {
        mainSection.innerHTML =
            `<section class="container py-4">
                <div class="alert alert-info">Jelentkezz be a kosarad megtekintéséhez.</div>
            </section>`;
        return;
    }
    const items = await fetchServerCart(userId);
    if (items.length === 0) {
        mainSection.innerHTML =
            `<section class="container py-4">
                <div class="alert alert-info">A kosarad üres.</div>
            </section>`;
        return;
    }
    // Minden kosár elemhez lekérjük a plusz adatokat
    const enrichedItems = [];
    for (let i = 0; i < items.length; i++) {
        const enrichedItem = await enrichServerCartItem(items[i]);
        enrichedItems.push(enrichedItem);
    }
    let content = `<section class="container py-4">
            <div class="card">
                <div class="card-body">
                    <h2 class="h5 mb-3">Kosár tartalma</h2>`;
    // Kosár elemek kirajzolása
    for (let i = 0; i < enrichedItems.length; i++) {
        const entry = enrichedItems[i];
        const item = entry.item;
        const screening = entry.screening;
        const tickets = entry.tickets;
        let seatsText = "";
        for (let j = 0; j < item.seats.length; j++) {
            const seat = item.seats[j];
            const oneSeatText = `${seat.rowNumber}.${seat.seatNumber}`;
            if (j === 0) {
                seatsText += oneSeatText;
            }
            else {
                seatsText += ", " + oneSeatText;
            }
        }
        content +=
            `<div class="mb-3">
                <h3 class="h6">${screening ? screening.movieTitle : "Vetítés #" + item.filmScreeningId} — ${screening ? screening.roomName : ""}</h3>
                <p class="text-muted">${screening && screening.date ? new Date(screening.date).toLocaleString("hu-HU") : ""}</p>
                ${getTicketSummaryMarkup(tickets)}
                <div>Székek: ${seatsText}</div>
                <div class="text-muted small">Szerver cart id: ${item.cartId}</div>
                <div class="mt-2">
                    <button class="btn btn-danger btn-sm" data-remove-cart-id="${item.cartId}">Eltávolítás</button>
                </div>
            </div>`;
    }
    let totalSeats = 0;
    let totalPrice = 0;
    // Összesítés alul
    for (let i = 0; i < items.length; i++) {
        totalSeats += items[i].seats.length;
        totalPrice += items[i].totalPrice;
    }
    content +=
        `<hr />
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            Összesen: <strong>${totalSeats} db jegy / szék</strong>
                            <div class="text-muted small">Végösszeg: ${formatPrice(totalPrice)}</div>
                        </div>
                        <div class="cart-actions horizontal-symmetric">
                            <button id="bookingButton" type="button" class="btn btn-success">Foglalás</button>
                            <button id="clearCartButton" class="btn btn-danger">Kosár ürítése</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    mainSection.innerHTML = content;
    const clearBtn = document.getElementById("clearCartButton");
    // Teljes kosár ürítése
    if (clearBtn) {
        clearBtn.addEventListener("click", async () => {
            const ok = await clearServerCart(userId);
            if (!ok) {
                showReservationMessage("A szerveres kosár ürítése nem sikerült.", true);
                return;
            }
            await renderCartPage();
            await refreshFloatingCartBadge();
        });
    }
    // Egyes tételek eltávolítása
    const removeButtons = mainSection.querySelectorAll("[data-remove-cart-id]");
    for (let i = 0; i < removeButtons.length; i++) {
        const button = removeButtons[i];
        button.addEventListener("click", async () => {
            const cartId = Number(button.dataset.removeCartId);
            if (!cartId) {
                return;
            }
            const ok = await removeServerCart(cartId);
            if (!ok) {
                showReservationMessage("A tétel eltávolítása nem sikerült.", true);
                return;
            }
            await renderCartPage();
            await refreshFloatingCartBadge();
        });
    }
    const bookingBtn = document.getElementById("bookingButton");
    // Foglalás létrehozása a kosár elemeiből
    if (bookingBtn) {
        bookingBtn.addEventListener("click", async () => {
            const currentItems = await fetchServerCart(userId);
            if (currentItems.length === 0) {
                alert("A kosarad üres.");
                return;
            }
            let successCount = 0;
            let failedCount = 0;
            for (let i = 0; i < currentItems.length; i++) {
                const item = currentItems[i];
                const confirmation = await createServerReservation(item.cartId);
                const paymentReservationId = Number(confirmation?.reservationId ||
                    confirmation?.ReservationId ||
                    confirmation?.paymentReservationId ||
                    confirmation?.PaymentReservationId);
                if (confirmation &&
                    paymentReservationId) {
                    const persistedConfirmation = await fetchReservationConfirmation(paymentReservationId);
                    if (!persistedConfirmation) {
                        failedCount += 1;
                        continue;
                    }
                    // A friss foglalást helyben is elmentjük,
                    // így a külön foglalások oldalon backend lista nélkül is meg tud jelenni.
                    saveStoredReservation(userId, {
                        paymentReservationId: paymentReservationId,
                        cartId: item.cartId,
                        createdAt: new Date().toISOString(),
                        isPaid: Boolean(persistedConfirmation.isPaid || persistedConfirmation.IsPaid),
                        amount: Number(persistedConfirmation.amount || persistedConfirmation.Amount) || item.amount,
                        price: Number(persistedConfirmation.totalPrice || persistedConfirmation.TotalPrice) || item.totalPrice,
                        movieTitle: String(persistedConfirmation.movieTitle || persistedConfirmation.MovieTitle || ""),
                        screeningDate: String(persistedConfirmation.screeningDate || persistedConfirmation.ScreeningDate || ""),
                        roomName: String(persistedConfirmation.roomName || persistedConfirmation.RoomName || ""),
                        ticketId: Number(persistedConfirmation.ticketId || persistedConfirmation.TicketId) || item.ticketId,
                        userEmail: String(persistedConfirmation.userEmail || persistedConfirmation.UserEmail || ""),
                        seatLabels: getConfirmationSeatLabels(persistedConfirmation, item),
                        seats: item.seats,
                    });
                    successCount += 1;
                }
                else {
                    failedCount += 1;
                }
            }
            await renderCartPage();
            await refreshFloatingCartBadge();
            if (successCount > 0 && failedCount === 0) {
                showReservationMessage("Foglalás sikeresen létrejött.", false);
                return;
            }
            if (successCount > 0 && failedCount > 0) {
                showReservationMessage("Néhány foglalás sikerült, néhány nem.", true);
                return;
            }
            showReservationMessage("A foglalás nem sikerült.", true);
        });
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    const currentPageName = (window.location.pathname.split("/").pop() || "").toLowerCase();
    if (currentPageName === "kosar.html") {
        await renderCartPage();
        await refreshFloatingCartBadge();
    }
});
