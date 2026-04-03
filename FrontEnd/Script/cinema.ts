const API_BASE = "http://localhost:5067";

// DTO
interface TicketTypeDto {
    Id: number;
    ticketTypeId?: number;
    name?: string;
    ticketName: string;
    price?: number;
    ticketType?: string;
    ticketPrice?: number;
}

interface FilmScreeningDto {
    filmScreeningId: number;
    movieId: number;
    movieTitle: string;
    roomId: number;
    roomName: string | null;
    date: string;
}

interface RoomDto {
    roomId: number;
    roomName: string;
    seats?: SeatDto[];
}

interface SeatDto {
    seatId: number;
    rowNumber: number;
    seatNumber: number;
    roomId: number;
    isReserved?: boolean;
}

interface ApiCollectionResponse<T> {
    value?: T[];
}

interface MovieDto {
    movieId: number;
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
    screenings: FilmScreeningDto[];
}

interface ImageDto {
    imageId?: number;
    imageContent: string | number[];
}

interface CurrentUserDto {
    userId?: string | number;
    role?: string;
    email?: string;
    fullName?: string;
    billingAddress?: string;
    UserId?: string | number;
    Role?: string;
    Email?: string;
    FullName?: string;
    BillingAddress?: string;
}

interface LoginResponseDto {
    userId?: string | number;
    role?: string;
    UserId?: string | number;
    Role?: string;
}

interface SelectedScreeningState {
    filmScreeningId: number;
    movieTitle: string;
    roomId: number;
    roomName: string;
    date: string;
}

interface StoredUserProfile {
    email: string;
    fullName: string;
    billingAddress: string;
}

interface CategoriesDto {
    id?: number;
    categId?: number;
    name?: string;
    categName?: string;
    description?: string;
    categoryId?: number;
    categoryName?: string;
    categoryDescription?: string;
}

interface CartSeat {
    seatId: number;
    rowNumber: number;
    seatNumber: number;
}

interface CartItem {
    filmScreeningId: number;
    movieTitle: string;
    roomId: number;
    roomName?: string;
    date?: string;
    seats: CartSeat[];
    tickets: SelectedTicketQuantity[];
}

interface SavedReservation {
    id: string;
    userEmail: string;
    filmScreeningId: number;
    movieTitle: string;
    roomId: number;
    roomName?: string;
    date?: string;
    seats: CartSeat[];
    tickets: SelectedTicketQuantity[];
    createdAt: string;
    cartId?: string;
    paymentReservationId?: number;
}

interface ScreeningTicketDto {
    ticketId?: number;
    ticketTypeId?: number;
    filmScreeningId?: number;
    TicketId?: number;
    TicketTypeId?: number;
    FilmScreeningId?: number;
}

interface ServerCartDto {
    cartId?: number;
    CartId?: number;
}

interface ServerConfirmationDto {
    reservationId?: number;
    ReservationId?: number;
    paymentReservationId?: number;
    PaymentReservationId?: number;
}

interface SelectedTicketQuantity {
    ticketTypeId: number;
    ticketName: string;
    unitPrice: number | null;
    quantity: number;
}

interface StoredTicketSelection {
    ticketTypeId: number;
    quantity: number;
}


const jegyekTbody = document.getElementById("jegyekTbody") as HTMLTableSectionElement | null;
const movieList = document.getElementById("movieList") as HTMLElement | null;
const locationFilter = document.getElementById("locationFilter") as HTMLSelectElement | null;
const genreFilter = document.getElementById("genreFilter") as HTMLSelectElement | null;
const movieFilter = document.getElementById("movieFilter") as HTMLSelectElement | null;
const dateFilter = document.getElementById("dateFilter") as HTMLInputElement | null;
const movieSearchInput = document.getElementById("movieSearchInput") as HTMLInputElement | null;
const categoriesGrid = document.getElementById("categoriesGrid") as HTMLElement | null;
const roomDetails = document.getElementById("roomDetails") as HTMLElement | null;

let allMovies: MovieDto[] = [];
let allRooms: RoomDto[] = [];
let allCategories: CategoriesDto[] = [];
let allTicketTypes: TicketTypeDto[] = [];

const currentUserStorageKey = "cinemaCurrentUserEmail";
const currentUserIdStorageKey = "cinemaCurrentUserId";
const userProfilesStorageKey = "cinemaUserProfiles";
const cartButtonId = "floatingCartButton";
const selectedScreeningStorageKey = "cinemaSelectedScreening";
const selectedSeatStorageKeyPrefix = "cinemaSelectedSeats";
const selectedTicketStorageKeyPrefix = "cinemaSelectedTickets";
const cartStorageKey = "cinemaCartItems";
const reservationsStorageKey = "cinemaReservations";

const moviePosterFallbacks: Record<string, string> = {
    avatar: "avatar.jpg",
    inception: "inception.jpg",
    interstellar: "interstellar.jpg",
    "the dark knight": "thedarkknight.jpg",
};

const movieDescriptionTranslations: Record<string, string> = {
    inception: "Egy tolvaj álmokba lép be, hogy titkokat lopjon.",
    interstellar: "Egy csapat egy űrbéli féreglyukon keresztül utazik.",
    "the dark knight": "Batman Gotham városában szembenéz Jokerrel.",
    avatar: "Egy tengerészgyalogos felfedezi Pandora világát.",
};

function getTicketName(ticket: TicketTypeDto): string {
    const t = ticket as any;
    const keys = ['ticketType', 'ticket_type', 'ticketName', 'tickettype', 'name', 'Name'];
    for (const k of keys) {
        const v = t[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return (ticket.ticketName ?? ticket.name ?? '').trim();
}

function getTicketPrice(ticket: TicketTypeDto): number | null {
    const t = ticket as any;
    const keys = ['price', 'Price', 'amount', 'Amount', 'value', 'Value', 'ticketPrice', 'ticketprice', 'ticket_price'];
    for (const k of keys) {
        const v = t[k];
        if (typeof v !== 'undefined' && v !== null && !Number.isNaN(Number(v))) {
            return Number(v);
        }
    }
    return null;
}

function getCategoryName(category: CategoriesDto): string {
    return (category.categoryName ?? category.categName ?? category.name ?? "").trim();
}

function getCategoryDescription(category: CategoriesDto): string {
    return (category.categoryDescription ?? category.description ?? "").trim();
}

function getMovieFallbackPoster(movie: MovieDto): string {
    const normalizedTitle = movie.movieTitle.trim().toLowerCase();
    return moviePosterFallbacks[normalizedTitle] ?? "Logo.png";
}

function getMovieDescription(movie: MovieDto): string {
    const normalizedTitle = movie.movieTitle.trim().toLowerCase();
    return movieDescriptionTranslations[normalizedTitle] ?? movie.description;
}

function getRoomLabel(roomId: number, roomName?: string | null): string {
    if (roomName && roomName.trim()) {
        return roomName;
    }

    const matchingRoom = allRooms.find((room) => room.roomId === roomId);
    return matchingRoom?.roomName ?? `Terem #${roomId}`;
}

function getRoomById(roomId: number): RoomDto | undefined {
    return allRooms.find((room) => room.roomId === roomId);
}

function renderRoomSeatsMarkup(seats: SeatDto[], selectedSeatIds: Set<number>): string {
    if (seats.length === 0) {
        return `
            <div class="alert alert-secondary mb-0" role="alert">
                Ehhez a teremhez most nem érkezett ülésadat az API-ból.
            </div>
        `;
    }

    const seatsByRow = new Map<number, Map<number, SeatDto>>();
    let maxSeatNumber = 0;

    for (const seat of seats) {
        const rowSeats = seatsByRow.get(seat.rowNumber) ?? new Map<number, SeatDto>();
        rowSeats.set(seat.seatNumber, seat);
        seatsByRow.set(seat.rowNumber, rowSeats);
        maxSeatNumber = Math.max(maxSeatNumber, seat.seatNumber);
    }

    const sortedRows = Array.from(seatsByRow.entries()).sort((left, right) => left[0] - right[0]);
    const aisleIndex = maxSeatNumber >= 6 ? Math.ceil(maxSeatNumber / 2) : 0;

    const seatRowsMarkup = sortedRows.map(([rowNumber, rowSeats]) => {
        const seatCells: string[] = [];

        for (let seatNumber = 1; seatNumber <= maxSeatNumber; seatNumber++) {
            const seat = rowSeats.get(seatNumber);

            if (!seat) {
                seatCells.push('<span class="room-seat room-seat-empty" aria-hidden="true"></span>');
            } else {
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
                } else {
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

function getSelectedSeatStorageKey(screeningId: number): string {
    return `${selectedSeatStorageKeyPrefix}:${screeningId}`;
}

function getSelectedTicketStorageKey(screeningId: number): string {
    return `${selectedTicketStorageKeyPrefix}:${screeningId}`;
}

function getSelectedSeatIds(screeningId: number): number[] {
    const rawSeatIds = sessionStorage.getItem(getSelectedSeatStorageKey(screeningId));
    if (!rawSeatIds) {
        return [];
    }

    try {
        const parsedSeatIds = JSON.parse(rawSeatIds) as unknown;
        return Array.isArray(parsedSeatIds)
            ? parsedSeatIds.filter((value): value is number => typeof value === "number")
            : [];
    } catch {
        return [];
    }
}

function saveSelectedSeatIds(screeningId: number, seatIds: number[]): void {
    sessionStorage.setItem(getSelectedSeatStorageKey(screeningId), JSON.stringify(seatIds));
}

function getStoredTicketSelections(screeningId: number): StoredTicketSelection[] {
    const rawSelections = sessionStorage.getItem(getSelectedTicketStorageKey(screeningId));
    if (!rawSelections) {
        return [];
    }

    try {
        const parsedSelections = JSON.parse(rawSelections) as unknown;
        if (!Array.isArray(parsedSelections)) {
            return [];
        }

        return parsedSelections
            .map((selection) => {
                const candidate = selection as Partial<StoredTicketSelection> | null;
                const ticketTypeId = Number(candidate?.ticketTypeId);
                const quantity = Number(candidate?.quantity);

                if (!ticketTypeId || !quantity || quantity < 0) {
                    return null;
                }

                return { ticketTypeId, quantity };
            })
            .filter((selection): selection is StoredTicketSelection => Boolean(selection && selection.quantity > 0));
    } catch {
        return [];
    }
}

function saveStoredTicketSelections(screeningId: number, selections: StoredTicketSelection[]): void {
    const normalizedSelections = selections.filter((selection) => selection.quantity > 0);

    if (normalizedSelections.length === 0) {
        sessionStorage.removeItem(getSelectedTicketStorageKey(screeningId));
        return;
    }

    sessionStorage.setItem(getSelectedTicketStorageKey(screeningId), JSON.stringify(normalizedSelections));
}

function getSelectedTicketQuantities(screeningId: number, availableTickets: TicketTypeDto[]): SelectedTicketQuantity[] {
    const quantityByTicketId = new Map<number, number>(
        getStoredTicketSelections(screeningId).map((selection) => [selection.ticketTypeId, selection.quantity]),
    );

    return availableTickets
        .map((ticket) => {
            const ticketTypeId = getTicketTypeId(ticket);
            if (ticketTypeId === null) {
                return null;
            }

            const quantity = quantityByTicketId.get(ticketTypeId) ?? 0;
            if (quantity <= 0) {
                return null;
            }

            return {
                ticketTypeId,
                ticketName: getTicketName(ticket),
                unitPrice: getTicketPrice(ticket),
                quantity,
            };
        })
        .filter((ticket): ticket is SelectedTicketQuantity => Boolean(ticket));
}

function saveSelectedTicketQuantities(screeningId: number, tickets: SelectedTicketQuantity[]): void {
    saveStoredTicketSelections(
        screeningId,
        tickets.map((ticket) => ({
            ticketTypeId: ticket.ticketTypeId,
            quantity: ticket.quantity,
        })),
    );
}

function clearSelectedTicketQuantities(screeningId: number): void {
    sessionStorage.removeItem(getSelectedTicketStorageKey(screeningId));
}

function clampSelectedTicketQuantities(tickets: SelectedTicketQuantity[], maxAllowed: number): SelectedTicketQuantity[] {
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

function getCartItems(): CartItem[] {
    const raw = localStorage.getItem(cartStorageKey);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed)
            ? parsed
                .map((item) => normalizeCartItem(item))
                .filter((item): item is CartItem => Boolean(item))
            : [];
    } catch {
        return [];
    }
}

function saveCartItems(items: CartItem[]): void {
    localStorage.setItem(cartStorageKey, JSON.stringify(items));
    refreshFloatingCartBadge();
}

function getAllSavedReservations(): SavedReservation[] {
    const raw = localStorage.getItem(reservationsStorageKey);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed)
            ? parsed
                .map((item) => normalizeSavedReservation(item))
                .filter((item): item is SavedReservation => Boolean(item))
            : [];
    } catch {
        return [];
    }
}

function saveReservation(reservation: SavedReservation): void {
    const items = getAllSavedReservations();
    items.push(reservation);
    localStorage.setItem(reservationsStorageKey, JSON.stringify(items));
}

function isReservationSynced(reservation: SavedReservation): boolean {
    return typeof reservation.paymentReservationId === 'number' && reservation.paymentReservationId > 0;
}

function getUserReservations(email: string): SavedReservation[] {
    if (!email) return [];
    return getAllSavedReservations().filter(r => (r.userEmail || "").toLowerCase() === email.toLowerCase() && isReservationSynced(r));
}

function getReservedSeatIdsForScreening(screeningId: number): Set<number> {
    const reservedSeatIds = new Set<number>();

    for (const cartItem of getCartItems()) {
        if (cartItem.filmScreeningId !== screeningId) {
            continue;
        }

        for (const seat of cartItem.seats) {
            reservedSeatIds.add(seat.seatId);
        }
    }

    for (const reservation of getAllSavedReservations()) {
        if (!isReservationSynced(reservation) || reservation.filmScreeningId !== screeningId) {
            continue;
        }

        for (const seat of reservation.seats) {
            reservedSeatIds.add(seat.seatId);
        }
    }

    return reservedSeatIds;
}

function mergeReservedSeatsForScreening(seats: SeatDto[], screeningId: number): SeatDto[] {
    const reservedSeatIds = getReservedSeatIdsForScreening(screeningId);

    if (reservedSeatIds.size === 0) {
        return seats;
    }

    return seats.map((seat) => reservedSeatIds.has(seat.seatId)
        ? { ...seat, isReserved: true }
        : seat);
}

function getAvailableSelectedSeatIds(screeningId: number, seats: SeatDto[], maxAllowed = Number.MAX_SAFE_INTEGER): Set<number> {
    const reservedSeatIds = new Set<number>(
        seats
            .filter((seat) => Boolean(seat.isReserved))
            .map((seat) => seat.seatId),
    );

    const selectedSeatIds = getSelectedSeatIds(screeningId)
        .filter((seatId) => !reservedSeatIds.has(seatId))
        .slice(0, Math.max(0, maxAllowed));
    saveSelectedSeatIds(screeningId, selectedSeatIds);

    return new Set<number>(selectedSeatIds);
}

function clearSelectedSeats(screeningId: number, seatIds: number[]): void {
    const selectedSeatIds = new Set<number>(getSelectedSeatIds(screeningId));
    let hasChanges = false;

    for (const seatId of seatIds) {
        if (selectedSeatIds.delete(seatId)) {
            hasChanges = true;
        }
    }

    if (hasChanges) {
        saveSelectedSeatIds(screeningId, Array.from(selectedSeatIds));
    }
}

function generateId(prefix = "res"): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateCartId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function showReservationMessage(message: string, isError = false): void {
    const mainSection = document.querySelector('main.page-section') as HTMLElement | null;
    if (!mainSection) return;

    let container = mainSection.querySelector('#reservationsMessage') as HTMLElement | null;
    if (!container) {
        container = document.createElement('div');
        container.id = 'reservationsMessage';
        mainSection.prepend(container);
    }

    container.textContent = message;
    container.className = isError ? 'alert alert-danger d-block' : 'alert alert-success d-block';
    setTimeout(() => {
        if (container) container.className = '';
    }, 5000);
}

function updateSavedReservation(reservation: SavedReservation): void {
    const items = getAllSavedReservations();
    const idx = items.findIndex(r => r.id === reservation.id);
    if (idx >= 0) {
        items[idx] = reservation;
        localStorage.setItem(reservationsStorageKey, JSON.stringify(items));
    }
}

function parseNumericId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = Number(value);
        return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
    }

    return null;
}

function getCurrentUserId(): number | null {
    return parseNumericId(localStorage.getItem(currentUserIdStorageKey));
}

function setCurrentUserId(userId: number | null): void {
    if (userId && userId > 0) {
        localStorage.setItem(currentUserIdStorageKey, String(userId));
        return;
    }

    localStorage.removeItem(currentUserIdStorageKey);
}

async function fetchAuthenticatedUserData(): Promise<CurrentUserDto | null> {
    try {
        const response = await fetch(`${API_BASE}/api/user/getmydata`, {
            credentials: 'include'
        });

        if (!response.ok) {
            return null;
        }

        return await response.json() as CurrentUserDto;
    } catch {
        return null;
    }
}

async function ensureCurrentUserIdLoaded(): Promise<number | null> {
    const storedUserId = getCurrentUserId();
    if (storedUserId) {
        return storedUserId;
    }

    const user = await fetchAuthenticatedUserData();
    const userId = parseNumericId(user?.userId ?? user?.UserId);
    if (userId) {
        setCurrentUserId(userId);
    }

    return userId;
}

function getSelectedServerTicketTypeId(tickets: SelectedTicketQuantity[]): number | null {
    const selectedTickets = tickets.filter((ticket) => ticket.quantity > 0);

    if (selectedTickets.length !== 1) {
        return null;
    }

    return parseNumericId(selectedTickets[0].ticketTypeId);
}

function buildServerSeatDtos(reservation: SavedReservation): SeatDto[] {
    return reservation.seats.map((seat) => ({
        seatId: seat.seatId,
        rowNumber: seat.rowNumber,
        seatNumber: seat.seatNumber,
        roomId: reservation.roomId,
        isReserved: false,
    }));
}

function normalizeCollectionPayload<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) {
        return payload as T[];
    }

    if (payload && Array.isArray((payload as { value?: unknown[] }).value)) {
        return (payload as { value: T[] }).value;
    }

    return [];
}

async function fetchScreeningTickets(screeningId: number): Promise<ScreeningTicketDto[]> {
    try {
        const response = await fetch(`${API_BASE}/api/cinema/getticketsbyscreening?screeningId=${encodeURIComponent(String(screeningId))}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            return [];
        }

        const payload = await response.json().catch(() => null);
        return normalizeCollectionPayload<ScreeningTicketDto>(payload);
    } catch {
        return [];
    }
}

async function resolveServerTicketId(reservation: SavedReservation): Promise<number | null> {
    const ticketTypeId = getSelectedServerTicketTypeId(reservation.tickets);
    if (!ticketTypeId) {
        return null;
    }

    const screeningTickets = await fetchScreeningTickets(reservation.filmScreeningId);
    const matchingTicket = screeningTickets.find((ticket) => parseNumericId(ticket.ticketTypeId ?? ticket.TicketTypeId) === ticketTypeId);

    return parseNumericId(matchingTicket?.ticketId ?? matchingTicket?.TicketId);
}

function getServerCartId(payload: unknown): number | null {
    const candidate = payload as ServerCartDto | null;
    return parseNumericId(candidate?.cartId ?? candidate?.CartId);
}

function getServerReservationId(payload: unknown): number | null {
    const candidate = payload as ServerConfirmationDto | null;
    return parseNumericId(
        candidate?.reservationId
        ?? candidate?.ReservationId
        ?? candidate?.paymentReservationId
        ?? candidate?.PaymentReservationId,
    );
}

async function removeServerCart(cartId: number): Promise<void> {
    try {
        await fetch(`${API_BASE}/api/cart/removefromcart?cartId=${encodeURIComponent(String(cartId))}`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch {
    }
}

async function createReservationOnServer(reservation: SavedReservation): Promise<{ paymentReservationId: number; cartId: number } | null> {
    const userId = await ensureCurrentUserIdLoaded();
    const ticketId = await resolveServerTicketId(reservation);
    const amount = getSelectedTicketQuantityTotal(reservation.tickets) || reservation.seats.length;

    if (!userId || !ticketId || amount <= 0 || reservation.seats.length === 0) {
        return null;
    }

    const addToCartResponse = await fetch(`${API_BASE}/api/cart/addtocart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            userId,
            filmScreeningId: reservation.filmScreeningId,
            ticketId,
            amount,
            seats: buildServerSeatDtos(reservation),
        })
    });

    if (!addToCartResponse.ok) {
        return null;
    }

    const cartPayload = await addToCartResponse.json().catch(() => null);
    const cartId = getServerCartId(cartPayload);

    if (!cartId) {
        return null;
    }

    const createResponse = await fetch(`${API_BASE}/api/payment_reservation/createreservation?cartId=${encodeURIComponent(String(cartId))}`, {
        method: 'POST',
        credentials: 'include'
    });

    if (!createResponse.ok) {
        await removeServerCart(cartId);
        return null;
    }

    const confirmationPayload = await createResponse.json().catch(() => null);
    const paymentReservationId = getServerReservationId(confirmationPayload);

    if (!paymentReservationId) {
        return null;
    }

    return {
        paymentReservationId,
        cartId,
    };
}

function getTicketTypeId(ticket: TicketTypeDto): number | null {
    const t = ticket as any;
    const keys = ['ticketTypeId', 'TicketTypeId', 'id', 'Id'];
    for (const k of keys) {
        const v = t[k];
        if (typeof v !== 'undefined' && v !== null && !Number.isNaN(Number(v))) {
            return Number(v);
        }
    }

    return null;
}

function isVipLabel(value: string | null | undefined): boolean {
    return (value ?? '').trim().toLowerCase().includes('vip');
}

function getAllowedTicketsForRoom(roomName: string, tickets: TicketTypeDto[]): TicketTypeDto[] {
    const filteredTickets = tickets.filter((ticket) => isVipLabel(roomName)
        ? isVipLabel(getTicketName(ticket))
        : !isVipLabel(getTicketName(ticket)));

    return filteredTickets.length > 0 ? filteredTickets : tickets;
}

function formatPrice(amount: number): string {
    return `${amount.toLocaleString('hu-HU')} Ft`;
}

function getSelectedTicketQuantityTotal(tickets: SelectedTicketQuantity[]): number {
    return tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
}

function getTicketSelectionsTotalPrice(tickets: SelectedTicketQuantity[]): number | null {
    let total = 0;

    for (const ticket of tickets) {
        if (ticket.unitPrice === null) {
            return null;
        }

        total += ticket.unitPrice * ticket.quantity;
    }

    return total;
}

function getTicketSummaryText(tickets: SelectedTicketQuantity[]): string {
    if (tickets.length === 0) {
        return 'Nincs kiválasztott jegy';
    }

    return tickets
        .map((ticket) => `${ticket.quantity}x ${ticket.ticketName}`)
        .join(', ');
}

function getTicketSummaryMarkup(tickets: SelectedTicketQuantity[]): string {
    if (tickets.length === 0) {
        return '<div>Jegyek: Nincs kiválasztott jegy</div>';
    }

    const totalPrice = getTicketSelectionsTotalPrice(tickets);
    return `
        <div>Jegyek: ${getTicketSummaryText(tickets)}</div>
        ${totalPrice !== null ? `<div class="text-muted small">Jegyek összesen: ${formatPrice(totalPrice)}</div>` : ''}
    `;
}

function normalizeCartSeats(seats: unknown): CartSeat[] {
    if (!Array.isArray(seats)) {
        return [];
    }

    const normalizedSeats: CartSeat[] = [];

    for (const seat of seats) {
        const candidate = seat as Partial<CartSeat> | null;
        const seatId = Number(candidate?.seatId);
        const rowNumber = Number(candidate?.rowNumber);
        const seatNumber = Number(candidate?.seatNumber);

        if (!seatId || !rowNumber || !seatNumber) {
            continue;
        }

        normalizedSeats.push({ seatId, rowNumber, seatNumber });
    }

    return normalizedSeats;
}

function normalizeSelectedTicketQuantities(tickets: unknown): SelectedTicketQuantity[] {
    if (!Array.isArray(tickets)) {
        return [];
    }

    const normalizedTickets: SelectedTicketQuantity[] = [];

    for (const ticket of tickets) {
        const candidate = ticket as Partial<SelectedTicketQuantity> | null;
        const ticketTypeId = Number(candidate?.ticketTypeId);
        const quantity = Number(candidate?.quantity);

        if (!ticketTypeId || !quantity || quantity < 0) {
            continue;
        }

        const unitPrice = typeof candidate?.unitPrice === 'number'
            ? candidate.unitPrice
            : (candidate?.unitPrice !== null && typeof candidate?.unitPrice !== 'undefined' && !Number.isNaN(Number(candidate.unitPrice))
                ? Number(candidate.unitPrice)
                : null);

        normalizedTickets.push({
            ticketTypeId,
            ticketName: (candidate?.ticketName ?? '').trim() || `Jegy #${ticketTypeId}`,
            unitPrice,
            quantity,
        });
    }

    return normalizedTickets.filter((ticket) => ticket.quantity > 0);
}

function normalizeCartItem(item: unknown): CartItem | null {
    const candidate = item as Partial<CartItem> | null;
    const filmScreeningId = Number(candidate?.filmScreeningId);
    const roomId = Number(candidate?.roomId);

    if (!filmScreeningId || !roomId) {
        return null;
    }

    return {
        filmScreeningId,
        movieTitle: candidate?.movieTitle ?? '',
        roomId,
        roomName: candidate?.roomName,
        date: candidate?.date,
        seats: normalizeCartSeats(candidate?.seats),
        tickets: normalizeSelectedTicketQuantities(candidate?.tickets),
    };
}

function normalizeSavedReservation(item: unknown): SavedReservation | null {
    const candidate = item as Partial<SavedReservation> | null;
    const filmScreeningId = Number(candidate?.filmScreeningId);
    const roomId = Number(candidate?.roomId);
    const createdAt = typeof candidate?.createdAt === 'string' ? candidate.createdAt : '';

    if (!candidate?.id || !filmScreeningId || !roomId || !createdAt) {
        return null;
    }

    return {
        id: candidate.id,
        userEmail: candidate.userEmail ?? '',
        filmScreeningId,
        movieTitle: candidate.movieTitle ?? '',
        roomId,
        roomName: candidate.roomName,
        date: candidate.date,
        seats: normalizeCartSeats(candidate.seats),
        tickets: normalizeSelectedTicketQuantities(candidate.tickets),
        createdAt,
        cartId: typeof candidate?.cartId !== 'undefined' && candidate?.cartId !== null
            ? String(candidate.cartId)
            : undefined,
        paymentReservationId: typeof candidate?.paymentReservationId === 'number'
            ? candidate.paymentReservationId
            : (typeof candidate?.paymentReservationId !== 'undefined' && !Number.isNaN(Number(candidate.paymentReservationId))
                ? Number(candidate.paymentReservationId)
                : undefined),
    };
}

async function deleteReservationOnServerByPaymentId(paymentReservationId: number): Promise<boolean> {
    const endpoints = [
        '/api/payment_reservation/cancelreservation',
        '/api/admin/deletereservation'
    ];

    for (const ep of endpoints) {
        try {
            const url = `${API_BASE}${ep}?reservationId=${encodeURIComponent(String(paymentReservationId))}`;
            const response = await fetch(url, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) return true;
        } catch (err) {
            continue;
        }
    }

    return false;
}

async function handleDeleteReservation(localId: string): Promise<void> {
    const items = getAllSavedReservations();
    const idx = items.findIndex(r => r.id === localId);
    if (idx < 0) {
        showReservationMessage('Foglalás nem található.', true);
        return;
    }

    const reservation = items[idx];

    if (reservation.paymentReservationId && typeof reservation.paymentReservationId === 'number') {
        try {
            const ok = await deleteReservationOnServerByPaymentId(reservation.paymentReservationId);
            if (!ok) {
                showReservationMessage('A foglalás törlése a szerveren nem sikerült.', true);
                return;
            }
        } catch (err) {
            showReservationMessage('Hiba történt a szerverkapcsolat során.', true);
            return;
        }
    }

    clearSelectedSeats(reservation.filmScreeningId, reservation.seats.map((seat) => seat.seatId));

    items.splice(idx, 1);
    localStorage.setItem(reservationsStorageKey, JSON.stringify(items));
    showReservationMessage('Foglalás törölve.', false);
    renderSavedReservations();
}

function renderSavedReservations(): void {
    const mainSection = document.querySelector('main.page-section') as HTMLElement | null;
    if (!mainSection) return;

    const email = getCurrentUserEmail().trim();
    if (!email) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">Jelentkezz be a foglalásaid megtekintéséhez.</div>
            </section>
        `;
        return;
    }

    const reservations = getUserReservations(email);
    if (!reservations || reservations.length === 0) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">Nincsenek aktív foglalásaid.</div>
            </section>
        `;
        return;
    }

    let content = `
        <section class="container py-4">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="h5 mb-0">Aktív foglalásaim</h2>
                        <a class="btn btn-save-like btn-sm" href="Profile.html">← Vissza a profilra</a>
                    </div>
    `;

    for (const r of reservations) {
        content += `
            <div class="mb-3">
                <h3 class="h6">${r.movieTitle} — ${r.roomName ?? ''}</h3>
                <p class="text-muted">${r.date ? new Date(r.date).toLocaleString('hu-HU') : ''}</p>
                ${getTicketSummaryMarkup(r.tickets)}
                <div>Székek: ${r.seats.map(s => `${s.rowNumber}.${s.seatNumber}`).join(', ')}</div>
                <div class="text-muted small">Mentve: ${new Date(r.createdAt).toLocaleString('hu-HU')}</div>
                <div class="text-muted small">Cart id: ${r.cartId ?? '-'}</div>
                <div class="mt-2">
                    <button class="btn btn-danger btn-sm" onclick="window.handleDeleteReservation('${r.id}')">Törlés</button>
                </div>
            </div>
        `;
    }

    content += `
                </div>
            </div>
        </section>
    `;

    mainSection.innerHTML = content;
}


function addSeatsToCart(item: CartItem): void {
    const items = getCartItems();
    const existing = items.find((it) => it.filmScreeningId === item.filmScreeningId);

    if (existing) {
        const existingSeatIds = new Set(existing.seats.map(s => s.seatId));
        for (const s of item.seats) {
            if (!existingSeatIds.has(s.seatId)) existing.seats.push(s);
        }

        const mergedTickets = new Map<number, SelectedTicketQuantity>();
        for (const ticket of [...existing.tickets, ...item.tickets]) {
            const current = mergedTickets.get(ticket.ticketTypeId);
            if (current) {
                current.quantity += ticket.quantity;
            } else {
                mergedTickets.set(ticket.ticketTypeId, { ...ticket });
            }
        }

        existing.tickets = Array.from(mergedTickets.values()).filter((ticket) => ticket.quantity > 0);
        existing.roomName = item.roomName ?? existing.roomName;
        existing.date = item.date ?? existing.date;
    } else {
        items.push(item);
    }

    saveCartItems(items);
}

function refreshFloatingCartBadge(): void {
    const count = getCartItems().reduce((sum, it) => sum + (it.seats?.length ?? 0), 0);
    const existingButton = document.getElementById(cartButtonId);
    if (!existingButton) return;
    let badge = existingButton.querySelector('.floating-cart-badge') as HTMLElement | null;
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'floating-cart-badge';
        existingButton.appendChild(badge);
    }

    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function initializeRoomSeatSelection(
    screeningId: number,
    getSeatSelectionLimit: () => number,
    onSelectionChange: () => void,
): void {
    if (!roomDetails) {
        return;
    }

    const seatButtons = roomDetails.querySelectorAll<HTMLButtonElement>(".room-seat-button[data-seat-id]");

    for (const seatButton of seatButtons) {
        seatButton.addEventListener("click", () => {
            if (seatButton.disabled) {
                return;
            }

            const seatId = Number(seatButton.dataset.seatId);
            if (!seatId) {
                return;
            }

            const selectedSeatIds = getSelectedSeatIds(screeningId);
            const isSelected = selectedSeatIds.includes(seatId);
            const seatSelectionLimit = getSeatSelectionLimit();

            if (isSelected) {
                saveSelectedSeatIds(screeningId, selectedSeatIds.filter((id) => id !== seatId));
            } else {
                if (seatSelectionLimit <= 0) {
                    alert("Előbb válassz jegytípust és darabszámot.");
                    return;
                }

                if (selectedSeatIds.length >= seatSelectionLimit) {
                    alert('Csak annyi helyet választhatsz, amennyi jegyet beállítottál.');
                    return;
                }

                saveSelectedSeatIds(screeningId, [...selectedSeatIds, seatId]);
            }

            onSelectionChange();
        });
    }
}

function normalizeMovieScreenings(movie: MovieDto): MovieDto {
    const normalizedScreenings: FilmScreeningDto[] = [];

    for (const screening of movie.screenings) {
        normalizedScreenings.push({
            ...screening,
            roomName: getRoomLabel(screening.roomId, screening.roomName),
        });
    }

    return {
        ...movie,
        screenings: normalizedScreenings,
    };
}

function getSelectedScreeningState(): SelectedScreeningState | null {
    const rawScreening = sessionStorage.getItem(selectedScreeningStorageKey);
    if (!rawScreening) return null;

    try {
        return JSON.parse(rawScreening) as SelectedScreeningState;
    } catch {
        return null;
    }
}

function setSelectedScreeningState(screening: SelectedScreeningState): void {
    sessionStorage.setItem(selectedScreeningStorageKey, JSON.stringify(screening));
}

function findScreeningById(screeningId: number): SelectedScreeningState | null {
    for (const movie of allMovies) {
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

// TICKETS
async function fetchJegyekList(): Promise<TicketTypeDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getalltickettype`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a jegyek listát.");

    const payload = await response.json();
    if (Array.isArray(payload)) {
        return payload as TicketTypeDto[];
    }

    if (payload && Array.isArray(payload.value)) {
        return payload.value as TicketTypeDto[];
    }

    if (payload && Array.isArray(payload.data)) {
        return payload.data as TicketTypeDto[];
    }

    throw new Error('Váratlan API válasz: jegyek lista nem található.');
}

async function ensureTicketTypesLoaded(): Promise<TicketTypeDto[]> {
    if (allTicketTypes.length === 0) {
        allTicketTypes = await fetchJegyekList();
    }

    return allTicketTypes;
}

async function renderjegyekTable(): Promise<void> {
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
            const priceDisplay = priceVal !== null ? String(priceVal) : "-";
            row.innerHTML = `
                <td>${getTicketName(jegy)}</td>
                <td>${priceDisplay} Ft</td>
            `;
            jegyekTbody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        if (jegyekTbody) {
            jegyekTbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-danger">Hiba történt a lista betöltésekor.</td>
                </tr>
            `;
        }
    }
}

function renderRoomTicketSelectionMarkup(
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
                    if (ticketTypeId === null) {
                        return '';
                    }

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
                            <div class="room-ticket-counter-price">${ticketPrice !== null ? `${formatPrice(ticketPrice)}/db` : 'Ár nem elérhető'}</div>
                        </article>
                    `;
                }).join('')}
            </div>
            <div class="room-ticket-selection-footer">
                <div id="roomTicketSelectionSummary" class="room-ticket-selection-summary"></div>
                <div id="roomSeatSelectionSummary" class="room-ticket-selection-summary"></div>
            </div>
        </div>
    `;
}

// MOVIES
async function fetchMoviesList(): Promise<MovieDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallmovies`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a filmek listáját.");
    return await response.json() as MovieDto[];
}

async function fetchRoomsList(): Promise<RoomDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallrooms`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a termek listáját.");
    return await response.json() as RoomDto[];
}

async function fetchSeatsForRoom(roomId: number, screeningId?: number): Promise<SeatDto[]> {
    const query = new URLSearchParams({ roomId: String(roomId) });

    if (screeningId) {
        query.set("screeningId", String(screeningId));
    }

    const response = await fetch(`${API_BASE}/api/cinema/getseats?${query.toString()}`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a terem székadatait.");

    const payload = await response.json() as SeatDto[] | ApiCollectionResponse<SeatDto>;
    return Array.isArray(payload) ? payload : (payload.value ?? []);
}

async function ensureRoomsLoaded(): Promise<RoomDto[]> {
    if (allRooms.length === 0) {
        allRooms = await fetchRoomsList();
    }

    return allRooms;
}

async function fetchCategoriesList(): Promise<CategoriesDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallcateg`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a kategóriák listáját.");
    return await response.json() as CategoriesDto[];
}

async function ensureMoviesLoaded(): Promise<MovieDto[]> {
    if (allMovies.length === 0) {
        const [movies, rooms, categories] = await Promise.all([fetchMoviesList(), fetchRoomsList(), fetchCategoriesList()]);
        const normalizedMovies: MovieDto[] = [];

        allRooms = rooms;
        allCategories = categories;

        for (const movie of movies) {
            normalizedMovies.push(normalizeMovieScreenings(movie));
        }

        allMovies = normalizedMovies;
    }

    return allMovies;
}

function renderMovieOptions(
    select: HTMLSelectElement | null,
    values: string[],
    defaultLabel: string,
    getLabel?: (value: string) => string,
): void {
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);

    for (const value of values) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = getLabel ? getLabel(value) : value;
        select.appendChild(option);
    }

    if (values.indexOf(currentValue) !== -1) {
        select.value = currentValue;
    }
}

function populateMovieFilters(movies: MovieDto[]): void {
    const roomIdSet = new Set<number>();
    const movieTitleSet = new Set<string>();

    for (const movie of movies) {
        for (const screening of movie.screenings) {
            roomIdSet.add(screening.roomId);
        }

        if (movie.movieTitle) {
            movieTitleSet.add(movie.movieTitle);
        }
    }

    const roomIds = Array.from(roomIdSet).sort((left, right) => left - right).map((roomId) => String(roomId));
    const genres = allCategories
        .map((category) => getCategoryName(category))
        .filter((categoryName) => Boolean(categoryName))
        .sort((left, right) => left.localeCompare(right, "hu"));
    const movieTitles = Array.from(movieTitleSet).sort((left, right) => left.localeCompare(right, "hu"));

    renderMovieOptions(locationFilter, roomIds, "Összes terem", (roomValue) => getRoomLabel(Number(roomValue)));
    renderMovieOptions(genreFilter, genres, "Összes kategória");
    renderMovieOptions(movieFilter, movieTitles, "Összes film");
}

function getFilteredMovies(): MovieDto[] {
    const selectedLocation = locationFilter?.value ?? "";
    const selectedGenre = genreFilter?.value ?? "";
    const selectedMovie = movieFilter?.value ?? "";
    const selectedDate = dateFilter?.value ?? "";
    const searchText = (movieSearchInput?.value ?? "").trim().toLowerCase();
    const hasScreeningFilters = Boolean(selectedLocation || selectedDate);
    const filteredMovies: MovieDto[] = [];

    for (const movie of allMovies) {
        if (selectedGenre && movie.genre !== selectedGenre) {
            continue;
        }

        if (selectedMovie && movie.movieTitle !== selectedMovie) {
            continue;
        }

        const filteredScreenings: FilmScreeningDto[] = [];

        for (const screening of movie.screenings) {
            const matchesLocation = !selectedLocation || String(screening.roomId) === selectedLocation;
            const matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;

            if (matchesLocation && matchesDate) {
                filteredScreenings.push(screening);
            }
        }
        
        if (filteredScreenings.length > 0 || !hasScreeningFilters) {
            if (searchText && !(movie.movieTitle ?? "").toLowerCase().includes(searchText)) {
                continue;
            }

            filteredMovies.push({
                ...movie,
                screenings: filteredScreenings,
            });
        }
    }

    return filteredMovies;
}
async function fetcImages(id : number): Promise<ImageDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getimage?movieId=${id}`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a képet.");
    return await response.json() as ImageDto[];
}

function baseimages(bytes: number[]): string {
    let binary = "";
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
        const chunk = bytes.slice(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
}

function getImageSource(imageData: ImageDto | ImageDto[] | null | undefined, fallbackSource: string): string {
    if (!imageData) return fallbackSource;

    const image = Array.isArray(imageData) ? imageData[0] : imageData;
    if (!image?.imageContent) return fallbackSource;

    if (typeof image.imageContent === "string") {
        const trimmedContent = image.imageContent.trim();
        if (!trimmedContent || trimmedContent.length < 100) return fallbackSource;

        return trimmedContent.startsWith("data:image")
            ? trimmedContent
            : `data:image/jpeg;base64,${trimmedContent}`;
    }

    if (image.imageContent.length < 64) return fallbackSource;

    return `data:image/jpeg;base64,${baseimages(image.imageContent)}`;
}

async function getMovieImageSource(movie: MovieDto): Promise<string> {
    const fallbackSource = getMovieFallbackPoster(movie);

    try {
        return getImageSource(await fetcImages(movie.movieId), fallbackSource);
    } catch {
        return fallbackSource;
    }
}

function getScreeningsButtonsHtml(screenings: FilmScreeningDto[]): string {
    if (screenings.length === 0) {
        return '<p class="text-muted">Nincs elérhető vetítés</p>';
    }

    let buttonsHtml = "";

    for (let index = 0; index < screenings.length; index++) {
        const screening = screenings[index];
        buttonsHtml += `
            <button class="btn btn-primary btn-sm me-2" type="button" data-screening-id="${screening.filmScreeningId}">
                Vetítés ${index + 1} (${new Date(screening.date).toLocaleString('hu-HU')})
            </button>
        `;
    }

    return buttonsHtml;
}

async function renderMoviesList(moviesToRender?: MovieDto[]): Promise<void> {
    if (!movieList) return;

    try {
        if (allMovies.length === 0) {
            await ensureMoviesLoaded();
            populateMovieFilters(allMovies);
        }

        const movies = moviesToRender ?? allMovies;
        movieList.innerHTML = "";

        if (movies.length === 0) {
            movieList.innerHTML = `
                <div class="alert alert-info">Nincs megjeleníthető film.</div>
            `;
            return;
        }
      
        for (const movie of movies) {
            const image = await getMovieImageSource(movie);
            const movieCard = document.createElement("div");
            movieCard.className = "movie-card my-3";
            movieCard.innerHTML = `
                <div class="movie-card-poster">
                    <img src="${image}" alt="${movie.movieTitle}">
                </div>
                <div class="movie-card-content">
                    <h3>${movie.movieTitle}</h3>
                    <p><strong>Rendező:</strong> ${movie.director}</p>
                    <p><strong>Időtartam:</strong> ${movie.duration} perc</p>
                    <p><strong>Műfaj:</strong> ${movie.genre}</p>
                    <p><strong>Leírás:</strong> ${getMovieDescription(movie)}</p>
                    <div class="screenings-buttons">
                        ${getScreeningsButtonsHtml(movie.screenings)}
                    </div>
                </div>
            `;
            movieList.appendChild(movieCard);
        }
    } catch (error) {
        console.error(error);
        if (movieList) {
            movieList.innerHTML = `
                <div class="alert alert-danger">Hiba történt a filmek betöltésekor.</div>
            `;
        }
    }
}

async function renderCategoriesPage(): Promise<void> {
    if (!categoriesGrid) return;

    try {
        const categories = (await fetchCategoriesList())
            .filter((category) => Boolean(getCategoryName(category)))
            .sort((left, right) => getCategoryName(left).localeCompare(getCategoryName(right), "hu"));

        if (categories.length === 0) {
            categoriesGrid.innerHTML = '<div class="category-empty card-like-panel">Még nem érkezett kategóriaadat a backendből.</div>';
            return;
        }

        categoriesGrid.innerHTML = "";

        for (const [index, category] of categories.entries()) {
            const categoryCard = document.createElement("article");
            categoryCard.className = `category-card category-accent-${(index % 4) + 1}`;
            categoryCard.innerHTML = `
                <div class="category-card-header">
                    <div>
                        <h2>${getCategoryName(category)}</h2>
                        <p class="category-description">${getCategoryDescription(category) || "Ehhez a kategóriához még nem lett leírás megadva az adatbázisban."}</p>
                    </div>
                </div>
            `;
            categoriesGrid.appendChild(categoryCard);
        }
    } catch (error) {
        console.error(error);
        categoriesGrid.innerHTML = '<div class="category-empty card-like-panel">Hiba történt a kategóriák betöltésekor.</div>';
    }
}

function applyMovieFilters(): void {
    void renderMoviesList(getFilteredMovies());
}

function renderCartPage(): void {
    const mainSection = document.querySelector('main.page-section') as HTMLElement | null;
    if (!mainSection) return;

    const items = getCartItems();
    if (!items || items.length === 0) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">A kosarad üres.</div>
            </section>
        `;
        return;
    }

    let content = `
        <section class="container py-4">
            <div class="card">
                <div class="card-body">
                    <h2 class="h5 mb-3">Kosár tartalma</h2>
    `;

    for (const item of items) {
        content += `
            <div class="mb-3">
                <h3 class="h6">${item.movieTitle} — ${item.roomName ?? ''}</h3>
                <p class="text-muted">${item.date ? new Date(item.date).toLocaleString('hu-HU') : ''}</p>
                ${getTicketSummaryMarkup(item.tickets)}
                <div>Székek: ${item.seats.map(s => `${s.rowNumber}.${s.seatNumber}`).join(', ')}</div>
            </div>
        `;
    }

    const totalSeats = items.reduce((sum, it) => sum + (it.seats?.length ?? 0), 0);
    const totalPrice = items.reduce((sum, item) => {
        const itemTotal = getTicketSelectionsTotalPrice(item.tickets);
        return sum + (itemTotal ?? 0);
    }, 0);

    content += `
                    <hr />
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Összesen: <strong>${totalSeats} db jegy / szék</strong>
                        <div class="text-muted small">Végösszeg: ${formatPrice(totalPrice)}</div>
                        </div>
                        <div class="cart-actions horizontal-symmetric">
                                <button id="bookingButton" type="button" class="btn btn-success">Foglalás</button>
                                <button id="clearCartButton" class="btn btn-danger">Kosár ürítése</button>
                            </div>
                    </div>
                </div>
            </div>
        </section>
    `;

    mainSection.innerHTML = content;

    const clearBtn = document.getElementById('clearCartButton') as HTMLButtonElement | null;
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            saveCartItems([]);
            renderCartPage();
        });
    } 
    const bookingBtn = document.getElementById('bookingButton') as HTMLButtonElement | null;
    if (bookingBtn) {
        bookingBtn.addEventListener('click', async () => {
            const email = getCurrentUserEmail().trim();
            if (!email) {
                window.location.href = 'Bejelentkezes.html';
                return;
            }

            const items = getCartItems();
            if (!items || items.length === 0) {
                alert('A kosarad üres.');
                return;
            }

            const userId = await ensureCurrentUserIdLoaded();
            if (!userId) {
                showReservationMessage('A szerveres foglaláshoz jelentkezz ki, majd be újra.', true);
                return;
            }

            const remainingItems: CartItem[] = [];
            let syncedCount = 0;
            let failedCount = 0;
            let hasUnsupportedTicketMix = false;

            for (const it of items) {
                if (it.tickets.filter((ticket) => ticket.quantity > 0).length !== 1) {
                    remainingItems.push(it);
                    failedCount += 1;
                    hasUnsupportedTicketMix = true;
                    continue;
                }

                const saved: SavedReservation = {
                    id: generateId(),
                    userEmail: email,
                    filmScreeningId: it.filmScreeningId,
                    movieTitle: it.movieTitle,
                    roomId: it.roomId,
                    roomName: it.roomName,
                    date: it.date,
                    seats: it.seats,
                    tickets: it.tickets,
                    createdAt: new Date().toISOString(),
                };

                try {
                    const syncedReservation = await createReservationOnServer(saved);
                    if (syncedReservation) {
                        saved.paymentReservationId = syncedReservation.paymentReservationId;
                        saved.cartId = String(syncedReservation.cartId);
                        saveReservation(saved);
                        clearSelectedSeats(saved.filmScreeningId, saved.seats.map((seat) => seat.seatId));
                        syncedCount += 1;
                    } else {
                        remainingItems.push(it);
                        failedCount += 1;
                    }
                } catch {
                    remainingItems.push(it);
                    failedCount += 1;
                }
            }

            saveCartItems(remainingItems);

            const flash = syncedCount > 0 && failedCount === 0
                ? { message: 'Foglalás sikeresen elmentve és szinkronizálva.', isError: false }
                : (syncedCount > 0 && failedCount > 0
                    ? { message: hasUnsupportedTicketMix ? 'A sikeres foglalások bekerültek a Foglalásaim közé. A sikertelen tételeknél egyszerre csak egy jegytípus támogatott.' : 'A sikeres foglalások bekerültek a Foglalásaim közé, a sikertelen tételek a kosárban maradtak.', isError: true }
                    : { message: hasUnsupportedTicketMix ? 'A szerveres foglaláshoz egy tételen belül egyszerre csak egy jegytípust válassz.' : 'A foglalás nem került a szerverre, ezért nem jelent meg a Foglalásaim között.', isError: true });

            renderCartPage();
            showReservationMessage(flash.message, flash.isError);
        });
    }
}

function initializeMovieFilters(): void {
    locationFilter?.addEventListener("change", applyMovieFilters);
    genreFilter?.addEventListener("change", applyMovieFilters);
    movieFilter?.addEventListener("change", applyMovieFilters);
    dateFilter?.addEventListener("change", applyMovieFilters);
    movieSearchInput?.addEventListener("input", applyMovieFilters);
}

function initializeScreeningButtons(): void {
    movieList?.addEventListener("click", (event) => {
        const target = event.target as HTMLElement | null;
        const screeningButton = target?.closest("[data-screening-id]") as HTMLButtonElement | null;

        if (!screeningButton) {
            return;
        }

        const screeningId = Number(screeningButton.dataset.screeningId);
        if (!screeningId) {
            return;
        }

        const selectedScreening = findScreeningById(screeningId);
        if (!selectedScreening) {
            return;
        }

        setSelectedScreeningState(selectedScreening);
        window.location.href = "Terem.html";
    });
}

async function renderRoomPage(): Promise<void> {
    if (!roomDetails) {
        return;
    }

    const selectedScreening = getSelectedScreeningState();
    if (!selectedScreening) {
        window.location.replace("Cinema.html");
        return;
    }

    await ensureRoomsLoaded();

    const room = getRoomById(selectedScreening.roomId);
    const roomName = getRoomLabel(selectedScreening.roomId, selectedScreening.roomName);
    const formattedDate = new Date(selectedScreening.date).toLocaleString("hu-HU");
    const bookingTarget = getCurrentUserEmail().trim() ? "Kosar.html" : "Bejelentkezes.html";
    const bookingLabel = getCurrentUserEmail().trim() ? "Kosárba" : "Bejelentkezés a kosárhoz";
    let seats: SeatDto[] = [];

    try {
        seats = await fetchSeatsForRoom(selectedScreening.roomId, selectedScreening.filmScreeningId);
    } catch (error) {
        console.error(error);
        seats = room?.seats ?? [];
    }

    seats = mergeReservedSeatsForScreening(seats, selectedScreening.filmScreeningId);

    const ticketTypes = await ensureTicketTypesLoaded();
    const availableTickets = getAllowedTicketsForRoom(roomName, ticketTypes);
    const availableSeatCount = seats.filter((seat) => !seat.isReserved).length;
    let selectedTickets = clampSelectedTicketQuantities(
        getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets),
        availableSeatCount,
    );
    saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);

    const selectedSeatIds = getAvailableSelectedSeatIds(
        selectedScreening.filmScreeningId,
        seats,
        getSelectedTicketQuantityTotal(selectedTickets),
    );
    const seatsMarkup = renderRoomSeatsMarkup(seats, selectedSeatIds);
    const ticketsMarkup = renderRoomTicketSelectionMarkup(availableTickets, selectedTickets);

    roomDetails.innerHTML = `
        <section class="container py-4">
            <div class="card bg-dark text-light border-secondary room-details-card">
                <div class="card-body">
                    <h1 class="h3 mb-3">${roomName}</h1>
                    <p class="mb-2"><strong>Film:</strong> ${selectedScreening.movieTitle}</p>
                    <p class="mb-4"><strong>Időpont:</strong> ${formattedDate}</p>
                    <div class="mb-4">
                        ${ticketsMarkup}
                    </div>
                    <div class="mb-4 room-seat-section">
                        <h2 class="h5 mb-3">Székek</h2>
                        ${seatsMarkup}
                    </div>
                    <div class="text-start mt-2">
                        <button id="addToCartButton" class="btn btn-success room-add-to-cart" type="button">${bookingLabel}</button>
                    </div>
                </div>
            </div>
        </section>
    `;

    const addToCartButton = document.getElementById("addToCartButton") as HTMLButtonElement | null;
    const roomTicketSummary = document.getElementById('roomTicketSelectionSummary') as HTMLElement | null;
    const roomSeatSummary = document.getElementById('roomSeatSelectionSummary') as HTMLElement | null;

    const updateRoomSelectionState = (): void => {
        selectedTickets = clampSelectedTicketQuantities(
            getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets),
            availableSeatCount,
        );
        saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);

        const totalTickets = getSelectedTicketQuantityTotal(selectedTickets);
        const limitedSelectedSeatIds = getAvailableSelectedSeatIds(
            selectedScreening.filmScreeningId,
            seats,
            totalTickets,
        );

        for (const ticket of availableTickets) {
            const ticketTypeId = getTicketTypeId(ticket);
            if (ticketTypeId === null) {
                continue;
            }

            const currentQuantity = selectedTickets.find((selectedTicket) => selectedTicket.ticketTypeId === ticketTypeId)?.quantity ?? 0;
            const decrementButton = roomDetails.querySelector<HTMLButtonElement>(`[data-ticket-action="decrement"][data-ticket-type-id="${ticketTypeId}"]`);
            const incrementButton = roomDetails.querySelector<HTMLButtonElement>(`[data-ticket-action="increment"][data-ticket-type-id="${ticketTypeId}"]`);
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

        const seatButtons = roomDetails.querySelectorAll<HTMLButtonElement>('.room-seat-button[data-seat-id]');
        for (const seatButton of seatButtons) {
            const seatId = Number(seatButton.dataset.seatId);
            const isSelected = limitedSelectedSeatIds.has(seatId);
            const isSeatSelectionEnabled = totalTickets > 0;

            seatButton.disabled = !isSeatSelectionEnabled;
            seatButton.classList.toggle('room-seat-disabled', !isSeatSelectionEnabled);
            seatButton.classList.toggle('room-seat-selected', isSelected);
            seatButton.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            seatButton.setAttribute('aria-disabled', seatButton.disabled ? 'true' : 'false');
        }

        if (roomTicketSummary) {
            roomTicketSummary.textContent = totalTickets > 0
                ? `Kiválasztott jegyek: ${getTicketSummaryText(selectedTickets)}`
                : 'Előbb válassz jegytípust és darabszámot.';
        }

        if (roomSeatSummary) {
            roomSeatSummary.textContent = totalTickets > 0
                ? `Kiválasztott székek: ${limitedSelectedSeatIds.size}/${totalTickets}`
                : 'Jegyválasztás után tudsz székeket kijelölni.';
        }

        if (addToCartButton) {
            addToCartButton.disabled = totalTickets === 0 || limitedSelectedSeatIds.size !== totalTickets;
        }
    };

    initializeRoomSeatSelection(
        selectedScreening.filmScreeningId,
        () => getSelectedTicketQuantityTotal(selectedTickets),
        updateRoomSelectionState,
    );

    const ticketStepperButtons = roomDetails.querySelectorAll<HTMLButtonElement>('[data-ticket-action][data-ticket-type-id]');
    for (const button of ticketStepperButtons) {
        button.addEventListener('click', () => {
            const ticketTypeId = Number(button.dataset.ticketTypeId);
            const ticketAction = button.dataset.ticketAction;

            if (!ticketTypeId || !ticketAction) {
                return;
            }

            const currentQuantities = new Map<number, number>(
                selectedTickets.map((ticket) => [ticket.ticketTypeId, ticket.quantity]),
            );
            const currentQuantity = currentQuantities.get(ticketTypeId) ?? 0;
            const currentTotal = getSelectedTicketQuantityTotal(selectedTickets);

            if (ticketAction === 'increment') {
                if (currentTotal >= availableSeatCount) {
                    return;
                }

                currentQuantities.set(ticketTypeId, currentQuantity + 1);
            }

            if (ticketAction === 'decrement') {
                if (currentQuantity <= 1) {
                    currentQuantities.delete(ticketTypeId);
                } else {
                    currentQuantities.set(ticketTypeId, currentQuantity - 1);
                }
            }

            selectedTickets = availableTickets
                .map((ticket) => {
                    const nextTicketTypeId = getTicketTypeId(ticket);
                    if (nextTicketTypeId === null) {
                        return null;
                    }

                    const quantity = currentQuantities.get(nextTicketTypeId) ?? 0;
                    if (quantity <= 0) {
                        return null;
                    }

                    return {
                        ticketTypeId: nextTicketTypeId,
                        ticketName: getTicketName(ticket),
                        unitPrice: getTicketPrice(ticket),
                        quantity,
                    };
                })
                .filter((ticket): ticket is SelectedTicketQuantity => Boolean(ticket));

            saveSelectedTicketQuantities(selectedScreening.filmScreeningId, selectedTickets);
            updateRoomSelectionState();
        });
    }

    updateRoomSelectionState();

    if (addToCartButton) {
        addToCartButton.addEventListener("click", () => {
            const selectedIds = getSelectedSeatIds(selectedScreening.filmScreeningId);
            if (!selectedIds || selectedIds.length === 0) {
                alert("Nincsenek kiválasztott székek.");
                return;
            }

            const ticketsForCart = getSelectedTicketQuantities(selectedScreening.filmScreeningId, availableTickets);
            const totalSelectedTickets = getSelectedTicketQuantityTotal(ticketsForCart);
            if (totalSelectedTickets === 0) {
                alert('Előbb válassz jegytípust és darabszámot.');
                return;
            }

            if (selectedIds.length !== totalSelectedTickets) {
                alert('A kiválasztott székek száma meg kell egyezzen a kiválasztott jegyek számával.');
                return;
            }

            const seatsForCart: CartSeat[] = seats
                .filter(s => selectedIds.includes(s.seatId))
                .map(s => ({ seatId: s.seatId, rowNumber: s.rowNumber, seatNumber: s.seatNumber }));

            const cartItem: CartItem = {
                filmScreeningId: selectedScreening.filmScreeningId,
                movieTitle: selectedScreening.movieTitle,
                roomId: selectedScreening.roomId,
                roomName: selectedScreening.roomName,
                date: selectedScreening.date,
                seats: seatsForCart,
                tickets: ticketsForCart,
            };

            addSeatsToCart(cartItem);
            clearSelectedSeats(selectedScreening.filmScreeningId, selectedIds);
            clearSelectedTicketQuantities(selectedScreening.filmScreeningId);
            void renderRoomPage();
            showReservationMessage(`A kiválasztott jegyek bekerültek a kosárba. Tovább: ${bookingTarget}`, false);
        });
    }
}

// AUTHENTICATION
function getStoredProfiles(): StoredUserProfile[] {
    const rawProfiles = localStorage.getItem(userProfilesStorageKey);
    if (!rawProfiles) return [];

    try {
        return JSON.parse(rawProfiles) as StoredUserProfile[];
    } catch {
        return [];
    }
}

function saveStoredProfile(email: string, fullName: string, billingAddress: string): void {
    const profiles = getStoredProfiles();
    const existingIndex = profiles.findIndex((item) => item.email.toLowerCase() === email.toLowerCase());
    const existingProfile = existingIndex >= 0 ? profiles[existingIndex] : null;
    const mergedProfile: StoredUserProfile = {
        email,
        fullName: fullName || existingProfile?.fullName || "",
        billingAddress: billingAddress || existingProfile?.billingAddress || "",
    };

    if (existingIndex >= 0) {
        profiles[existingIndex] = mergedProfile;
    } else {
        profiles.push(mergedProfile);
    }

    localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
}

function updateStoredProfile(oldEmail: string, newEmail: string, fullName: string, billingAddress: string): void {
    const profiles = getStoredProfiles().filter((item) => item.email.toLowerCase() !== oldEmail.toLowerCase());
    localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
    saveStoredProfile(newEmail, fullName, billingAddress);
}

function getStoredProfile(email: string): StoredUserProfile | null {
    const profiles = getStoredProfiles();
    return profiles.find((item) => item.email.toLowerCase() === email.toLowerCase()) || null;
}

function setCurrentUserEmail(email: string): void {
    if (email) {
        localStorage.setItem(currentUserStorageKey, email);
        return;
    }

    localStorage.removeItem(currentUserStorageKey);
}

function getCurrentUserEmail(): string {
    return localStorage.getItem(currentUserStorageKey) || "";
}

function updateFloatingCartButton(): void {
    const existingButton = document.getElementById(cartButtonId);

    if (existingButton) {
        refreshFloatingCartBadge();
        return;
    }

    const cartButton = document.createElement("button");
    cartButton.id = cartButtonId;
    cartButton.className = "floating-cart-button";
    cartButton.type = "button";
    cartButton.setAttribute("aria-label", "Kosár megnyitása");
    cartButton.textContent = "🛒";
    cartButton.addEventListener("click", () => {
        window.location.href = "Kosar.html";
    });

    document.body.appendChild(cartButton);
    refreshFloatingCartBadge();
}

function applyLoginState(): void {
    const email = getCurrentUserEmail().trim();
    const currentPage = window.location.pathname.split("/").pop() || "Cinema.html";
    const navProfileArea = document.getElementById("navProfileArea");
    const authLink = navProfileArea?.querySelector('a[href="Bejelentkezes.html"]') as HTMLAnchorElement | null;

    if (authLink) {
        authLink.href = email ? "Profile.html" : "Bejelentkezes.html";
        authLink.textContent = email ? "Profil" : "Bejelentkezés/Regisztráció";
    }

    if (email && currentPage === "Bejelentkezes.html") {
        window.location.replace("Profile.html");
        return;
    }

    if (!email && currentPage === "Profile.html") {
        window.location.replace("Bejelentkezes.html");
        return;
    }

    updateFloatingCartButton();
}

function fillProfileFields(email: string, fullName: string, billingAddress: string): void {
    const emailField = document.getElementById("profileEmail") as HTMLInputElement | null;
    const fullNameField = document.getElementById("profileFullName") as HTMLInputElement | null;
    const billingField = document.getElementById("profileBilling") as HTMLInputElement | null;

    if (!emailField || !fullNameField || !billingField) return;

    emailField.value = email;
    fullNameField.value = fullName;
    billingField.value = billingAddress;
}

function showProfileMessage(message: string, isError: boolean): void {
    const profileMessage = document.getElementById("profileMessage");

    if (!profileMessage) return;

    profileMessage.textContent = message;
    profileMessage.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}

async function handleProfileSave(event: Event): Promise<void> {
    event.preventDefault();

    const oldEmail = getCurrentUserEmail();
    const emailField = document.getElementById("profileEmail") as HTMLInputElement | null;
    const fullNameField = document.getElementById("profileFullName") as HTMLInputElement | null;
    const billingField = document.getElementById("profileBilling") as HTMLInputElement | null;

    if (!oldEmail || !emailField || !fullNameField || !billingField) {
        showProfileMessage("A profil mentése most nem sikerült.", true);
        return;
    }

    const newEmail = emailField.value.trim();
    const fullName = fullNameField.value.trim();
    const billingAddress = billingField.value.trim();

    if (!newEmail) {
        showProfileMessage("Az email cím megadása kötelező.", true);
        return;
    }

    updateStoredProfile(oldEmail, newEmail, fullName, billingAddress);
    setCurrentUserEmail(newEmail);

    fillProfileFields(newEmail, fullName, billingAddress);
    showProfileMessage("A profil adatai elmentve.", false);
}

async function handleLoginSubmit(event: Event) {
    event.preventDefault();
    const emailInput = document.getElementById("loginEmail") as HTMLInputElement;
    const passwordInput = document.getElementById("loginPassword") as HTMLInputElement;
    const loginMessage = document.getElementById("loginMessage") as HTMLElement | null;
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value;
    const password = passwordInput.value;

    if (loginMessage) {
        loginMessage.className = "mb-3";
        loginMessage.textContent = "";
    }

    try {
        const response = await fetch(`${API_BASE}/api/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });

        if (!response.ok) {
            const text = await response.text();
            if (loginMessage) {
                loginMessage.className = "text-danger mb-3";
                loginMessage.textContent = text || "Hibás email vagy jelszó.";
            }
            return;
        }

        if (loginMessage) {
            loginMessage.className = "text-success mb-3";
            loginMessage.textContent = "Sikeres bejelentkezés!";
        }
        const payload = await response.json().catch(() => null) as LoginResponseDto | null;
        const userId = parseNumericId(payload?.userId ?? payload?.UserId);
        if (userId) {
            setCurrentUserId(userId);
        }
        setCurrentUserEmail(email);
        window.location.replace("Profile.html");
        return;
    } catch (err) {
        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = "Hiba a bejelentkezés során.";
        }
    }
}

async function handleRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailInput = document.getElementById("registerEmail") as HTMLInputElement;
    const fullNameInput = document.getElementById("registerFullName") as HTMLInputElement;
    const addressInput = document.getElementById("registerAddress") as HTMLInputElement;
    const passwordInput = document.getElementById("registerPassword") as HTMLInputElement;
    const passwordConfirmInput = document.getElementById("registerPasswordConfirm") as HTMLInputElement;
    const registerMessage = document.getElementById("registerMessage") as HTMLElement | null;

    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput) return;

    if (registerMessage) {
        registerMessage.className = "mb-3";
        registerMessage.textContent = "";
    }

    if (passwordInput.value !== passwordConfirmInput.value) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "A két jelszó nem egyezik.";
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/user/Regist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Email: emailInput.value,
                FullName: fullNameInput.value,
                Password: passwordInput.value,
                BillingAddress: addressInput.value,
            }),
            credentials: "include"
        });

        if (!response.ok) {
            const text = await response.text();
            if (registerMessage) {
                registerMessage.className = "text-danger mb-3";
                registerMessage.textContent = response.status === 409 || /letezik|exists/i.test(text)
                    ? "Ez a felhasználó már létezik."
                    : (text || "Sikertelen regisztráció.");
            }
            return;
        }

        if (registerMessage) {
            registerMessage.className = "text-success mb-3";
            registerMessage.textContent = "Sikeres regisztráció! Az adatok elmentve.";
        }
        saveStoredProfile(emailInput.value, fullNameInput.value, addressInput.value);
        emailInput.value = "";
        fullNameInput.value = "";
        addressInput.value = "";
        passwordInput.value = "";
        passwordConfirmInput.value = "";
    } catch (err) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "Hiba történt a regisztráció során.";
        }
    }
}

async function handleLogout(): Promise<void> {
    setCurrentUserEmail("");
    setCurrentUserId(null);

    try {
        await fetch(`${API_BASE}/api/user/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
    }

    window.location.href = "Bejelentkezes.html";
}

async function loadProfileData(): Promise<void> {
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");

    if (!emailField || !fullNameField || !billingField) return;

    try {
        const authUser = await fetchAuthenticatedUserData();
        if (!authUser) {
            const storedEmail = getCurrentUserEmail();
            const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;

            if (storedProfile) {
                fillProfileFields(storedProfile.email, storedProfile.fullName, storedProfile.billingAddress);
            } else {
                fillProfileFields(storedEmail, "", "");
            }
            return;
        }

        const storedEmail = getCurrentUserEmail();
        const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;

        const userId = parseNumericId(authUser.userId ?? authUser.UserId);
        const email = authUser.email || authUser.Email || storedEmail || "";
        let fullName = authUser.fullName || authUser.FullName || storedProfile?.fullName || "";
        let billingAddress = authUser.billingAddress || authUser.BillingAddress || storedProfile?.billingAddress || "";

        if (userId) {
            setCurrentUserId(userId);

            const profileResponse = await fetch(`${API_BASE}/api/user/viewprofile?userId=${encodeURIComponent(String(userId))}`, {
                credentials: 'include'
            });

            if (profileResponse.ok) {
                const payload = await profileResponse.json().catch(() => null) as { value?: CurrentUserDto[] } | CurrentUserDto[] | null;
                const profile = Array.isArray(payload)
                    ? payload[0]
                    : (payload && Array.isArray(payload.value) ? payload.value[0] : null);

                if (profile) {
                    fullName = profile.fullName || profile.FullName || fullName;
                    billingAddress = profile.billingAddress || profile.BillingAddress || billingAddress;
                }
            }
        }

        if (email) {
            setCurrentUserEmail(email);
            saveStoredProfile(email, fullName, billingAddress);
        }

        fillProfileFields(email, fullName, billingAddress);
    } catch (error) {
        const storedEmail = getCurrentUserEmail();
        const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;

        if (storedProfile) {
            fillProfileFields(storedProfile.email, storedProfile.fullName, storedProfile.billingAddress);
            return;
        }

        fillProfileFields(storedEmail, "", "");
    }
}

Object.assign(window, {
    handleDeleteReservation,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout,
    handleProfileSave,
    renderSavedReservations,
});

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    applyLoginState();

    if (jegyekTbody) {
        renderjegyekTable();
    }
    if (movieList) {
        initializeMovieFilters();
        initializeScreeningButtons();
        renderMoviesList();
    }
    if (categoriesGrid) {
        renderCategoriesPage();
    }
    if (roomDetails) {
        await renderRoomPage();
    }
    const currentPageName = window.location.pathname.split("/").pop() || "";
    if (currentPageName.toLowerCase() === "kosar.html") {
        renderCartPage();
    }

    if (currentPageName.toLowerCase() === "foglalasok.html") {
        renderSavedReservations();
    }

    await loadProfileData();
});