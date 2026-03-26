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
    email?: string;
    fullName?: string;
    billingAddress?: string;
    Email?: string;
    FullName?: string;
    BillingAddress?: string;
}

interface SelectedScreeningState {
    filmScreeningId: number;
    movieId: number;
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


const jegyekTbody = document.getElementById("jegyekTbody") as HTMLTableSectionElement | null;
const movieList = document.getElementById("movieList") as HTMLElement | null;
const screeningsTbody = document.getElementById("screeningsTbody") as HTMLTableSectionElement | null;
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

const currentUserStorageKey = "cinemaCurrentUserEmail";
const userProfilesStorageKey = "cinemaUserProfiles";
const cartButtonId = "floatingCartButton";
const selectedScreeningStorageKey = "cinemaSelectedScreening";
const selectedSeatStorageKeyPrefix = "cinemaSelectedSeats";
const cartStorageKey = "cinemaCartItems";

const moviePosterFallbacks: Record<string, string> = {
    avatar: "avatar.jpg",
    inception: "inception.jpg",
    interstellar: "interstellar.jpg",
    "the dark knight": "thedarkknight.jpg",
};

function getTicketName(ticket: TicketTypeDto): string {
    const t = ticket as any;
    const keys = ['ticketType', 'ticket_type', 'ticketName', 'tickettype', 'name', 'Name'];
    for (const k of keys) {
        const v = t[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    // Fallback to previously defined properties
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
}

function getCartItems(): CartItem[] {
    const raw = localStorage.getItem(cartStorageKey);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed as CartItem[] : [];
    } catch {
        return [];
    }
}

function saveCartItems(items: CartItem[]): void {
    localStorage.setItem(cartStorageKey, JSON.stringify(items));
    refreshFloatingCartBadge();
}

function addSeatsToCart(item: CartItem): void {
    const items = getCartItems();
    const existing = items.find((it) => it.filmScreeningId === item.filmScreeningId);

    if (existing) {
        const existingSeatIds = new Set(existing.seats.map(s => s.seatId));
        for (const s of item.seats) {
            if (!existingSeatIds.has(s.seatId)) existing.seats.push(s);
        }
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

function initializeRoomSeatSelection(screeningId: number): void {
    if (!roomDetails) {
        return;
    }

    const selectedSeatIds = new Set<number>(getSelectedSeatIds(screeningId));
    const seatButtons = roomDetails.querySelectorAll<HTMLButtonElement>(".room-seat-button");

    for (const seatButton of seatButtons) {
        seatButton.addEventListener("click", () => {
            const seatId = Number(seatButton.dataset.seatId);
            if (!seatId) {
                return;
            }

            if (selectedSeatIds.has(seatId)) {
                selectedSeatIds.delete(seatId);
            } else {
                selectedSeatIds.add(seatId);
            }

            const isSelected = selectedSeatIds.has(seatId);
            seatButton.classList.toggle("room-seat-selected", isSelected);
            seatButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
            saveSelectedSeatIds(screeningId, Array.from(selectedSeatIds));
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
                    movieId: movie.movieId,
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

    // Try common properties
    if (payload && Array.isArray(payload.data)) {
        return payload.data as TicketTypeDto[];
    }

    throw new Error('Váratlan API válasz: jegyek lista nem található.');
}

async function renderjegyekTable(): Promise<void> {
    if (!jegyekTbody) return;
    
    try {
        const jegyek = await fetchJegyekList();
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
                    <p><strong>Leírás:</strong> ${movie.description}</p>
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
                <div>Székek: ${item.seats.map(s => `${s.rowNumber}.${s.seatNumber}`).join(', ')}</div>
            </div>
        `;
    }

    const totalSeats = items.reduce((sum, it) => sum + (it.seats?.length ?? 0), 0);

    const storedCartId = localStorage.getItem('paymentCartId') || '';

    content += `
                    <hr />
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Összesen: <strong>${totalSeats} db szék</strong>
                        ${storedCartId ? `<div class="text-muted small">Cart id: ${storedCartId}</div>` : `<div class="text-danger small">Cart id missing</div>`}
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
    const selectedSeatIds = new Set<number>(getSelectedSeatIds(selectedScreening.filmScreeningId));
    let seats: SeatDto[] = [];

    try {
        seats = await fetchSeatsForRoom(selectedScreening.roomId, selectedScreening.filmScreeningId);
    } catch (error) {
        console.error(error);
        seats = room?.seats ?? [];
    }

    const seatsMarkup = renderRoomSeatsMarkup(seats, selectedSeatIds);

    roomDetails.innerHTML = `
        <section class="container py-4">
            <div class="card bg-dark text-light border-secondary room-details-card">
                <div class="card-body">
                    <h1 class="h3 mb-3">${roomName}</h1>
                    <p class="mb-2"><strong>Film:</strong> ${selectedScreening.movieTitle}</p>
                    <p class="mb-4"><strong>Időpont:</strong> ${formattedDate}</p>
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

    initializeRoomSeatSelection(selectedScreening.filmScreeningId);

    const addToCartButton = document.getElementById("addToCartButton") as HTMLButtonElement | null;
    if (addToCartButton) {
        addToCartButton.addEventListener("click", () => {
            const selectedIds = getSelectedSeatIds(selectedScreening.filmScreeningId);
            if (!selectedIds || selectedIds.length === 0) {
                alert("Nincsenek kiválasztott székek.");
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
            };

            addSeatsToCart(cartItem);
        });
    }
}

// SCREENINGS
async function fetchScreeningsList(): Promise<FilmScreeningDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallscreenings`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a vetítéseket.");
    return await response.json() as FilmScreeningDto[];
}

async function renderScreeningsTable(): Promise<void> {
    if (!screeningsTbody) return;

    try {
        const [screenings, rooms] = await Promise.all([fetchScreeningsList(), fetchRoomsList()]);
        allRooms = rooms;
        screeningsTbody.innerHTML = "";

        if (screenings.length === 0) {
            screeningsTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">Nincs megjeleníthető vetítés.</td>
                </tr>
            `;
            return;
        }

        for (const screening of screenings) {
            const row = document.createElement("tr");
            const date = new Date(screening.date);
            const formattedDate = date.toLocaleString('hu-HU');
            const roomName = getRoomLabel(screening.roomId, screening.roomName);
            
            row.innerHTML = `
                <td>${screening.movieTitle}</td>
                <td>${roomName}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn btn-sm btn-success">Foglalás</button>
                </td>
            `;
            screeningsTbody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        if (screeningsTbody) {
            screeningsTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">Hiba történt a vetítések betöltésekor.</td>
                </tr>
            `;
        }
    }
}

// AUTHENTICATION
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
        const response = await fetch(`${API_BASE}/api/user/current`, {
            credentials: "include"
        });

        if (!response.ok) {
            const storedEmail = getCurrentUserEmail();
            const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;

            if (storedProfile) {
                fillProfileFields(storedProfile.email, storedProfile.fullName, storedProfile.billingAddress);
            } else {
                fillProfileFields(storedEmail, "", "");
            }
            return;
        }

        const user = await response.json() as CurrentUserDto;
        const storedEmail = getCurrentUserEmail();
        const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;

        const email = user.email || user.Email || storedEmail || "";
        const fullName = user.fullName || user.FullName || storedProfile?.fullName || "";
        const billingAddress = user.billingAddress || user.BillingAddress || storedProfile?.billingAddress || "";

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

// @ts-ignore
window.handleLoginSubmit = handleLoginSubmit;
// @ts-ignore
window.handleRegisterSubmit = handleRegisterSubmit;
// @ts-ignore
window.handleLogout = handleLogout;
// @ts-ignore
window.handleProfileSave = handleProfileSave;
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
    if (screeningsTbody) {
        renderScreeningsTable();
    }

    const currentPageName = window.location.pathname.split("/").pop() || "";
    if (currentPageName.toLowerCase() === "kosar.html") {
        renderCartPage();
    }

    await loadProfileData();
});