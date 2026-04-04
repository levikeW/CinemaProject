import { clearServerCart, createServerReservation, fetchScreeningTickets, fetchServerCart, removeServerCart } from "../Core/api.js";
import { cartButtonId, formatPrice, showReservationMessage } from "../Core/common.js";
import { ensureCurrentUserIdLoaded, applyLoginState } from "../Fooldalak/auth.js";
import { ensureMoviesLoaded, getRoomLabel } from "../Fooldalak/cinema.js";
import { ensureTicketTypesLoaded, getTicketSummaryMarkup, resolveTicketSelectionFromServerItem } from "../Arak/arak.js";
async function resolveScreeningState(screeningId) {
    const movies = await ensureMoviesLoaded();
    for (const movie of movies) {
        for (const screening of movie.screenings) {
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
async function enrichServerCartItem(item) {
    const [screening, screeningTickets, ticketTypes] = await Promise.all([
        resolveScreeningState(item.filmScreeningId),
        fetchScreeningTickets(item.filmScreeningId),
        ensureTicketTypesLoaded(),
    ]);
    const tickets = resolveTicketSelectionFromServerItem({ ticketId: item.ticketId, amount: item.amount }, screeningTickets, ticketTypes);
    return { item, screening, tickets };
}
export async function refreshFloatingCartBadge() {
    const existingButton = document.getElementById(cartButtonId);
    if (!existingButton)
        return;
    const userId = await ensureCurrentUserIdLoaded();
    const count = userId
        ? (await fetchServerCart(userId)).reduce((sum, item) => sum + item.seats.length, 0)
        : 0;
    let badge = existingButton.querySelector(".floating-cart-badge");
    if (!badge) {
        badge = document.createElement("span");
        badge.className = "floating-cart-badge";
        existingButton.appendChild(badge);
    }
    badge.textContent = String(count);
    badge.style.display = count > 0 ? "flex" : "none";
}
export async function renderCartPage() {
    const mainSection = document.querySelector("main.page-section");
    if (!mainSection)
        return;
    const userId = await ensureCurrentUserIdLoaded();
    if (!userId) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">Jelentkezz be a kosarad megtekintéséhez.</div>
            </section>
        `;
        return;
    }
    const items = await fetchServerCart(userId);
    if (!items.length) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">A kosarad üres.</div>
            </section>
        `;
        return;
    }
    const enrichedItems = await Promise.all(items.map((item) => enrichServerCartItem(item)));
    let content = `
        <section class="container py-4">
            <div class="card">
                <div class="card-body">
                    <h2 class="h5 mb-3">Kosár tartalma</h2>`;
    for (const entry of enrichedItems) {
        const { item, screening, tickets } = entry;
        content += `
            <div class="mb-3">
                <h3 class="h6">${screening?.movieTitle ?? `Vetítés #${item.filmScreeningId}`} — ${screening?.roomName ?? ""}</h3>
                <p class="text-muted">${screening?.date ? new Date(screening.date).toLocaleString("hu-HU") : ""}</p>
                ${getTicketSummaryMarkup(tickets)}
                <div>Székek: ${item.seats.map((seat) => `${seat.rowNumber}.${seat.seatNumber}`).join(", ")}</div>
                <div class="text-muted small">Szerver cart id: ${item.cartId}</div>
                <div class="mt-2">
                    <button class="btn btn-danger btn-sm" data-remove-cart-id="${item.cartId}">Eltávolítás</button>
                </div>
            </div>`;
    }
    const totalSeats = items.reduce((sum, item) => sum + item.seats.length, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    content += `
                    <hr />
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
    const removeButtons = mainSection.querySelectorAll("[data-remove-cart-id]");
    Array.from(removeButtons).forEach((button) => {
        button.addEventListener("click", async () => {
            const cartId = Number(button.dataset.removeCartId);
            if (!cartId)
                return;
            const ok = await removeServerCart(cartId);
            if (!ok) {
                showReservationMessage("A tétel eltávolítása nem sikerült.", true);
                return;
            }
            await renderCartPage();
            await refreshFloatingCartBadge();
        });
    });
    const bookingBtn = document.getElementById("bookingButton");
    if (bookingBtn) {
        bookingBtn.addEventListener("click", async () => {
            const currentItems = await fetchServerCart(userId);
            if (!currentItems.length) {
                alert("A kosarad üres.");
                return;
            }
            let successCount = 0;
            let failedCount = 0;
            for (const item of currentItems) {
                const confirmation = await createServerReservation(item.cartId);
                if (confirmation && Number(confirmation.reservationId ?? confirmation.ReservationId ?? confirmation.paymentReservationId ?? confirmation.PaymentReservationId)) {
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
