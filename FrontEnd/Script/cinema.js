"use strict";
const API_BASE = "http://localhost:5067";
const jegyekTbody = document.getElementById("jegyekTbody");
const movieList = document.getElementById("movieList");
const screeningsTbody = document.getElementById("screeningsTbody");
const locationFilter = document.getElementById("locationFilter");
const genreFilter = document.getElementById("genreFilter");
const movieFilter = document.getElementById("movieFilter");
const dateFilter = document.getElementById("dateFilter");
const categoriesGrid = document.getElementById("categoriesGrid");
const roomDetails = document.getElementById("roomDetails");
let allMovies = [];
let allRooms = [];
let allCategories = [];
const currentUserStorageKey = "cinemaCurrentUserEmail";
const userProfilesStorageKey = "cinemaUserProfiles";
const cartButtonId = "floatingCartButton";
const selectedScreeningStorageKey = "cinemaSelectedScreening";
const moviePosterFallbacks = {
    inception: "inception.jpg",
    interstellar: "interstellar.jpg",
    "the dark knight": "thedarkknight.jpg",
};
function getTicketName(ticket) {
    return (ticket.ticketName ?? ticket.name ?? "").trim();
}
function getCategoryName(category) {
    return (category.categoryName ?? category.categName ?? category.name ?? "").trim();
}
function getCategoryDescription(category) {
    return (category.categoryDescription ?? category.description ?? "").trim();
}
function getMovieFallbackPoster(movie) {
    const normalizedTitle = movie.movieTitle.trim().toLowerCase();
    return moviePosterFallbacks[normalizedTitle] ?? "Logo.png";
}
function getRoomLabel(roomId, roomName) {
    if (roomName && roomName.trim()) {
        return roomName;
    }
    const matchingRoom = allRooms.find((room) => room.roomId === roomId);
    return matchingRoom?.roomName ?? `Terem #${roomId}`;
}
function getRoomById(roomId) {
    return allRooms.find((room) => room.roomId === roomId);
}
function renderRoomSeatsMarkup(seats) {
    if (seats.length === 0) {
        return `
            <div class="alert alert-secondary mb-0" role="alert">
                Ehhez a teremhez most nem érkezett ülésadat az API-ból.
            </div>
        `;
    }
    const seatsByRow = new Map();
    for (const seat of seats) {
        const rowSeats = seatsByRow.get(seat.rowNumber) ?? [];
        rowSeats.push(seat);
        seatsByRow.set(seat.rowNumber, rowSeats);
    }
    const sortedRows = Array.from(seatsByRow.entries()).sort((left, right) => left[0] - right[0]);
    return sortedRows.map(([rowNumber, rowSeats]) => {
        const seatButtons = rowSeats
            .sort((left, right) => left.seatNumber - right.seatNumber)
            .map((seat) => {
            const buttonClass = seat.isReserved ? "btn-outline-danger" : "btn-outline-light";
            const stateLabel = seat.isReserved ? "foglalt" : "szabad";
            return `<span class="btn ${buttonClass} btn-sm disabled">${rowNumber}.${seat.seatNumber} (${stateLabel})</span>`;
        })
            .join("");
        return `
            <div class="mb-3">
                <div class="small text-uppercase text-secondary mb-2">${rowNumber}. sor</div>
                <div class="d-flex flex-wrap gap-2">${seatButtons}</div>
            </div>
        `;
    }).join("");
}
function normalizeMovieScreenings(movie) {
    const normalizedScreenings = [];
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
function getSelectedScreeningState() {
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
function setSelectedScreeningState(screening) {
    sessionStorage.setItem(selectedScreeningStorageKey, JSON.stringify(screening));
}
function findScreeningById(screeningId) {
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
function getStoredProfiles() {
    const rawProfiles = localStorage.getItem(userProfilesStorageKey);
    if (!rawProfiles)
        return [];
    try {
        return JSON.parse(rawProfiles);
    }
    catch {
        return [];
    }
}
function saveStoredProfile(email, fullName, billingAddress) {
    const profiles = getStoredProfiles();
    const existingIndex = profiles.findIndex((item) => item.email.toLowerCase() === email.toLowerCase());
    const existingProfile = existingIndex >= 0 ? profiles[existingIndex] : null;
    const mergedProfile = {
        email,
        fullName: fullName || existingProfile?.fullName || "",
        billingAddress: billingAddress || existingProfile?.billingAddress || "",
    };
    if (existingIndex >= 0) {
        profiles[existingIndex] = mergedProfile;
    }
    else {
        profiles.push(mergedProfile);
    }
    localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
}
function updateStoredProfile(oldEmail, newEmail, fullName, billingAddress) {
    const profiles = getStoredProfiles().filter((item) => item.email.toLowerCase() !== oldEmail.toLowerCase());
    localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
    saveStoredProfile(newEmail, fullName, billingAddress);
}
function getStoredProfile(email) {
    const profiles = getStoredProfiles();
    return profiles.find((item) => item.email.toLowerCase() === email.toLowerCase()) || null;
}
function setCurrentUserEmail(email) {
    if (email) {
        localStorage.setItem(currentUserStorageKey, email);
        return;
    }
    localStorage.removeItem(currentUserStorageKey);
}
function getCurrentUserEmail() {
    return localStorage.getItem(currentUserStorageKey) || "";
}
function updateFloatingCartButton() {
    const existingButton = document.getElementById(cartButtonId);
    const email = getCurrentUserEmail().trim();
    if (!email) {
        existingButton?.remove();
        return;
    }
    if (existingButton) {
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
}
function applyLoginState() {
    const email = getCurrentUserEmail().trim();
    const currentPage = window.location.pathname.split("/").pop() || "Cinema.html";
    const navProfileArea = document.getElementById("navProfileArea");
    const authLink = navProfileArea?.querySelector('a[href="Bejelentkezes.html"]');
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
function fillProfileFields(email, fullName, billingAddress) {
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");
    if (!emailField || !fullNameField || !billingField)
        return;
    emailField.value = email;
    fullNameField.value = fullName;
    billingField.value = billingAddress;
}
function showProfileMessage(message, isError) {
    const profileMessage = document.getElementById("profileMessage");
    if (!profileMessage)
        return;
    profileMessage.textContent = message;
    profileMessage.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}
async function handleProfileSave(event) {
    event.preventDefault();
    const oldEmail = getCurrentUserEmail();
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");
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
async function fetchJegyekList() {
    const response = await fetch(`${API_BASE}/api/cinema/getalltickettype`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a jegyek listát.");
    return await response.json();
}
async function renderjegyekTable() {
    if (!jegyekTbody)
        return;
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
                <td>${getTicketName(jegy)}</td>
                <td>${jegy.price} Ft</td>
            `;
            jegyekTbody.appendChild(row);
        }
    }
    catch (error) {
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
async function fetchMoviesList() {
    const response = await fetch(`${API_BASE}/api/cinema/getallmovies`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a filmek listáját.");
    return await response.json();
}
async function fetchRoomsList() {
    const response = await fetch(`${API_BASE}/api/cinema/getallrooms`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a termek listáját.");
    return await response.json();
}
async function ensureRoomsLoaded() {
    if (allRooms.length === 0) {
        allRooms = await fetchRoomsList();
    }
    return allRooms;
}
async function fetchCategoriesList() {
    const response = await fetch(`${API_BASE}/api/cinema/getallcateg`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a kategóriák listáját.");
    return await response.json();
}
async function ensureMoviesLoaded() {
    if (allMovies.length === 0) {
        const [movies, rooms, categories] = await Promise.all([fetchMoviesList(), fetchRoomsList(), fetchCategoriesList()]);
        const normalizedMovies = [];
        allRooms = rooms;
        allCategories = categories;
        for (const movie of movies) {
            normalizedMovies.push(normalizeMovieScreenings(movie));
        }
        allMovies = normalizedMovies;
    }
    return allMovies;
}
function renderMovieOptions(select, values, defaultLabel, getLabel) {
    if (!select)
        return;
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
function populateMovieFilters(movies) {
    const roomIdSet = new Set();
    const movieTitleSet = new Set();
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
function getFilteredMovies() {
    const selectedLocation = locationFilter?.value ?? "";
    const selectedGenre = genreFilter?.value ?? "";
    const selectedMovie = movieFilter?.value ?? "";
    const selectedDate = dateFilter?.value ?? "";
    const filteredMovies = [];
    for (const movie of allMovies) {
        if (selectedGenre && movie.genre !== selectedGenre) {
            continue;
        }
        if (selectedMovie && movie.movieTitle !== selectedMovie) {
            continue;
        }
        const filteredScreenings = [];
        for (const screening of movie.screenings) {
            const matchesLocation = !selectedLocation || String(screening.roomId) === selectedLocation;
            const matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;
            if (matchesLocation && matchesDate) {
                filteredScreenings.push(screening);
            }
        }
        if (filteredScreenings.length > 0 || !selectedDate) {
            filteredMovies.push({
                ...movie,
                screenings: filteredScreenings,
            });
        }
    }
    return filteredMovies;
}
async function fetcImages(id) {
    const response = await fetch(`${API_BASE}/api/cinema/getimage?movieId=${id}`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a képet.");
    return await response.json();
}
function baseimages(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        const chunk = bytes.slice(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}
function getImageSource(imageData, fallbackSource) {
    if (!imageData)
        return fallbackSource;
    const image = Array.isArray(imageData) ? imageData[0] : imageData;
    if (!image?.imageContent)
        return fallbackSource;
    if (typeof image.imageContent === "string") {
        const trimmedContent = image.imageContent.trim();
        if (!trimmedContent || trimmedContent.length < 100)
            return fallbackSource;
        return trimmedContent.startsWith("data:image")
            ? trimmedContent
            : `data:image/jpeg;base64,${trimmedContent}`;
    }
    if (image.imageContent.length < 64)
        return fallbackSource;
    return `data:image/jpeg;base64,${baseimages(image.imageContent)}`;
}
async function getMovieImageSource(movie) {
    const fallbackSource = getMovieFallbackPoster(movie);
    try {
        return getImageSource(await fetcImages(movie.movieId), fallbackSource);
    }
    catch {
        return fallbackSource;
    }
}
function getScreeningsButtonsHtml(screenings) {
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
async function renderMoviesList(moviesToRender) {
    if (!movieList)
        return;
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
                    <h3>Cím: ${movie.movieTitle}</h3>
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
    }
    catch (error) {
        console.error(error);
        if (movieList) {
            movieList.innerHTML = `
                <div class="alert alert-danger">Hiba történt a filmek betöltésekor.</div>
            `;
        }
    }
}
async function renderCategoriesPage() {
    if (!categoriesGrid)
        return;
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
    }
    catch (error) {
        console.error(error);
        categoriesGrid.innerHTML = '<div class="category-empty card-like-panel">Hiba történt a kategóriák betöltésekor.</div>';
    }
}
function applyMovieFilters() {
    void renderMoviesList(getFilteredMovies());
}
function initializeMovieFilters() {
    locationFilter?.addEventListener("change", applyMovieFilters);
    genreFilter?.addEventListener("change", applyMovieFilters);
    movieFilter?.addEventListener("change", applyMovieFilters);
    dateFilter?.addEventListener("change", applyMovieFilters);
}
function initializeScreeningButtons() {
    movieList?.addEventListener("click", (event) => {
        const target = event.target;
        const screeningButton = target?.closest("[data-screening-id]");
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
async function renderRoomPage() {
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
    const bookingLabel = getCurrentUserEmail().trim() ? "Foglalás" : "Bejelentkezés a foglaláshoz";
    const seatsMarkup = renderRoomSeatsMarkup(room?.seats ?? []);
    roomDetails.innerHTML = `
        <section class="container py-4">
            <div class="card bg-dark text-light border-secondary">
                <div class="card-body">
                    <h1 class="h3 mb-3">${roomName}</h1>
                    <p class="mb-2"><strong>Film:</strong> ${selectedScreening.movieTitle}</p>
                    <p class="mb-4"><strong>Időpont:</strong> ${formattedDate}</p>
                    <div class="mb-4">
                        <h2 class="h5 mb-3">Székek</h2>
                        ${seatsMarkup}
                    </div>
                    <a class="btn btn-success" href="${bookingTarget}">${bookingLabel}</a>
                </div>
            </div>
        </section>
    `;
}
// SCREENINGS
async function fetchScreeningsList() {
    const response = await fetch(`${API_BASE}/api/cinema/getallscreenings`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a vetítéseket.");
    return await response.json();
}
async function renderScreeningsTable() {
    if (!screeningsTbody)
        return;
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
    }
    catch (error) {
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
async function handleLoginSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginMessage = document.getElementById("loginMessage");
    if (!emailInput || !passwordInput)
        return;
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
    }
    catch (err) {
        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = "Hiba a bejelentkezés során.";
        }
    }
}
async function handleRegisterSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById("registerEmail");
    const fullNameInput = document.getElementById("registerFullName");
    const addressInput = document.getElementById("registerAddress");
    const passwordInput = document.getElementById("registerPassword");
    const passwordConfirmInput = document.getElementById("registerPasswordConfirm");
    const registerMessage = document.getElementById("registerMessage");
    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput)
        return;
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
    }
    catch (err) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "Hiba történt a regisztráció során.";
        }
    }
}
async function handleLogout() {
    setCurrentUserEmail("");
    try {
        await fetch(`${API_BASE}/api/user/logout`, {
            method: "POST",
            credentials: "include"
        });
    }
    catch (error) {
    }
    window.location.href = "Bejelentkezes.html";
}
async function loadProfileData() {
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");
    if (!emailField || !fullNameField || !billingField)
        return;
    try {
        const response = await fetch(`${API_BASE}/api/user/current`, {
            credentials: "include"
        });
        if (!response.ok) {
            const storedEmail = getCurrentUserEmail();
            const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;
            if (storedProfile) {
                fillProfileFields(storedProfile.email, storedProfile.fullName, storedProfile.billingAddress);
            }
            else {
                fillProfileFields(storedEmail, "", "");
            }
            return;
        }
        const user = await response.json();
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
    }
    catch (error) {
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
    await loadProfileData();
});
