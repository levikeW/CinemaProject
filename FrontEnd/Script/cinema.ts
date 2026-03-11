const API_BASE = "http://localhost:5067";

// DTO
interface TicketTypeDto {
    ticketId: number;
    ticketType: string;
    ticketPrice: number;
}

interface FilmScreeningDto {
    filmScreeningId: number;
    movieId: number;
    movieTitle: string;
    roomId: number;
    roomName: string;
    date: string;
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

interface CurrentUserDto {
    email?: string;
    fullName?: string;
    billingAddress?: string;
    Email?: string;
    FullName?: string;
    BillingAddress?: string;
}

interface StoredUserProfile {
    email: string;
    fullName: string;
    billingAddress: string;
}


const jegyekTbody = document.getElementById("jegyekTbody") as HTMLTableSectionElement | null;
const movieList = document.getElementById("movieList") as HTMLElement | null;
const screeningsTbody = document.getElementById("screeningsTbody") as HTMLTableSectionElement | null;
const locationFilter = document.getElementById("locationFilter") as HTMLSelectElement | null;
const genreFilter = document.getElementById("genreFilter") as HTMLSelectElement | null;
const movieFilter = document.getElementById("movieFilter") as HTMLSelectElement | null;
const dateFilter = document.getElementById("dateFilter") as HTMLInputElement | null;

let allMovies: MovieDto[] = [];

const currentUserStorageKey = "cinemaCurrentUserEmail";
const userProfilesStorageKey = "cinemaUserProfiles";

const actorNamedRooms = [
    "Morgan Freeman",
    "Anne Hathaway",
    "Leonardo DiCaprio",
];

function getActorRoomValue(roomLabel: string): string {
    return roomLabel.toLowerCase().replace(/\s+/g, "-");
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
    }
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

function getStaticRoomOptions(): string[] {
    return actorNamedRooms.map((roomLabel) => getActorRoomValue(roomLabel));
}

// TICKETS
async function fetchJegyekList(): Promise<TicketTypeDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getalltickettype`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a jegyek listát.");
    return await response.json() as TicketTypeDto[];
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
            row.innerHTML = `
                <td>${jegy.ticketType}</td>
                <td>${jegy.ticketPrice} Ft</td>
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
    const genres = Array.from(new Set(movies.map((movie) => movie.genre).filter(Boolean))).sort((left, right) => left.localeCompare(right, "hu"));
    const movieTitles = Array.from(new Set(movies.map((movie) => movie.movieTitle).filter(Boolean))).sort((left, right) => left.localeCompare(right, "hu"));

    renderMovieOptions(locationFilter, getStaticRoomOptions(), "Összes terem", (roomValue) => actorNamedRooms[getStaticRoomOptions().indexOf(roomValue)] || roomValue);
    renderMovieOptions(genreFilter, genres, "Összes kategória");
    renderMovieOptions(movieFilter, movieTitles, "Összes film");
}

function getFilteredMovies(): MovieDto[] {
    const selectedLocation = locationFilter?.value ?? "";
    const selectedGenre = genreFilter?.value ?? "";
    const selectedMovie = movieFilter?.value ?? "";
    const selectedDate = dateFilter?.value ?? "";

    return allMovies
        .filter((movie) => !selectedGenre || movie.genre === selectedGenre)
        .filter((movie) => !selectedMovie || movie.movieTitle === selectedMovie)
        .map((movie) => {
            const filteredScreenings = movie.screenings.filter((screening) => {
                const matchesLocation = !selectedLocation || true;
                const matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;
                return matchesLocation && matchesDate;
            });

            return {
                ...movie,
                screenings: filteredScreenings,
            };
        })
        .filter((movie) => movie.screenings.length > 0 || !selectedDate);
}

async function renderMoviesList(moviesToRender?: MovieDto[]): Promise<void> {
    if (!movieList) return;

    try {
        if (allMovies.length === 0) {
            allMovies = await fetchMoviesList();
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
            const movieCard = document.createElement("div");
            movieCard.className = "row movie-card my-3";
            movieCard.innerHTML = `
                <div class="col">
                    <img src="cinemaniabackground1.png" alt="${movie.movieTitle}" style="width: 100%; height: 250px; object-fit: cover;">
                </div>
                <div class="col">
                    <h3>Cím: ${movie.movieTitle}</h3>
                    <p><strong>Rendező:</strong> ${movie.director}</p>
                    <p><strong>Időtartam:</strong> ${movie.duration} perc</p>
                    <p><strong>Műfaj:</strong> ${movie.genre}</p>
                    <p><strong>Leírás:</strong> ${movie.description}</p>
                    <div class="screenings-buttons">
                        ${movie.screenings.length > 0 
                            ? movie.screenings.map((screening, index) => `
                                <button class="btn btn-primary btn-sm me-2" data-screening-id="${screening.filmScreeningId}">
                                    Vetítés ${index + 1} (${new Date(screening.date).toLocaleString('hu-HU')})
                                </button>
                            `).join('') 
                            : '<p class="text-muted">Nincs elérhető vetítés</p>'
                        }
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

function applyMovieFilters(): void {
    void renderMoviesList(getFilteredMovies());
}

function initializeMovieFilters(): void {
    locationFilter?.addEventListener("change", applyMovieFilters);
    genreFilter?.addEventListener("change", applyMovieFilters);
    movieFilter?.addEventListener("change", applyMovieFilters);
    dateFilter?.addEventListener("change", applyMovieFilters);
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
        const screenings = await fetchScreeningsList();
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
            
            row.innerHTML = `
                <td>${screening.movieTitle}</td>
                <td>${screening.roomName}</td>
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
        const response = await fetch(`${API_BASE}/api/user/register`, {
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
        renderMoviesList();
    }
    if (screeningsTbody) {
        renderScreeningsTable();
    }

    await loadProfileData();
});