var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const API_BASE = "http://localhost:5067";
const jegyekTbody = document.getElementById("jegyekTbody");
const movieList = document.getElementById("movieList");
const screeningsTbody = document.getElementById("screeningsTbody");
const locationFilter = document.getElementById("locationFilter");
const genreFilter = document.getElementById("genreFilter");
const movieFilter = document.getElementById("movieFilter");
const dateFilter = document.getElementById("dateFilter");
let allMovies = [];
const currentUserStorageKey = "cinemaCurrentUserEmail";
const userProfilesStorageKey = "cinemaUserProfiles";
const actorNamedRooms = [
    "Morgan Freeman",
    "Anne Hathaway",
    "Leonardo DiCaprio",
];
function getActorRoomValue(roomLabel) {
    return roomLabel.toLowerCase().replace(/\s+/g, "-");
}
function getStoredProfiles() {
    const rawProfiles = localStorage.getItem(userProfilesStorageKey);
    if (!rawProfiles)
        return [];
    try {
        return JSON.parse(rawProfiles);
    }
    catch (_a) {
        return [];
    }
}
function saveStoredProfile(email, fullName, billingAddress) {
    const profiles = getStoredProfiles();
    const existingIndex = profiles.findIndex((item) => item.email.toLowerCase() === email.toLowerCase());
    const existingProfile = existingIndex >= 0 ? profiles[existingIndex] : null;
    const mergedProfile = {
        email,
        fullName: fullName || (existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.fullName) || "",
        billingAddress: billingAddress || (existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.billingAddress) || "",
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
function applyLoginState() {
    const email = getCurrentUserEmail().trim();
    const currentPage = window.location.pathname.split("/").pop() || "Cinema.html";
    const navProfileArea = document.getElementById("navProfileArea");
    const authLink = navProfileArea === null || navProfileArea === void 0 ? void 0 : navProfileArea.querySelector('a[href="Bejelentkezes.html"]');
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
function handleProfileSave(event) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
function getStaticRoomOptions() {
    return actorNamedRooms.map((roomLabel) => getActorRoomValue(roomLabel));
}
// TICKETS
function fetchJegyekList() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`${API_BASE}/api/cinema/getalltickettype`);
        if (!response.ok)
            throw new Error("Nem sikerült lekérni a jegyek listát.");
        return yield response.json();
    });
}
function renderjegyekTable() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!jegyekTbody)
            return;
        try {
            const jegyek = yield fetchJegyekList();
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
                <td>${jegy.ticketName}</td>
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
    });
}
// MOVIES
function fetchMoviesList() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`${API_BASE}/api/cinema/getallmovies`);
        if (!response.ok)
            throw new Error("Nem sikerült lekérni a filmek listáját.");
        return yield response.json();
    });
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
    const genres = Array.from(new Set(movies.map((movie) => movie.genre).filter(Boolean))).sort((left, right) => left.localeCompare(right, "hu"));
    const movieTitles = Array.from(new Set(movies.map((movie) => movie.movieTitle).filter(Boolean))).sort((left, right) => left.localeCompare(right, "hu"));
    renderMovieOptions(locationFilter, getStaticRoomOptions(), "Összes terem", (roomValue) => actorNamedRooms[getStaticRoomOptions().indexOf(roomValue)] || roomValue);
    renderMovieOptions(genreFilter, genres, "Összes kategória");
    renderMovieOptions(movieFilter, movieTitles, "Összes film");
}
function getFilteredMovies() {
    var _a, _b, _c, _d;
    const selectedLocation = (_a = locationFilter === null || locationFilter === void 0 ? void 0 : locationFilter.value) !== null && _a !== void 0 ? _a : "";
    const selectedGenre = (_b = genreFilter === null || genreFilter === void 0 ? void 0 : genreFilter.value) !== null && _b !== void 0 ? _b : "";
    const selectedMovie = (_c = movieFilter === null || movieFilter === void 0 ? void 0 : movieFilter.value) !== null && _c !== void 0 ? _c : "";
    const selectedDate = (_d = dateFilter === null || dateFilter === void 0 ? void 0 : dateFilter.value) !== null && _d !== void 0 ? _d : "";
    return allMovies
        .filter((movie) => !selectedGenre || movie.genre === selectedGenre)
        .filter((movie) => !selectedMovie || movie.movieTitle === selectedMovie)
        .map((movie) => {
        const filteredScreenings = movie.screenings.filter((screening) => {
            const matchesLocation = !selectedLocation || true;
            const matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;
            return matchesLocation && matchesDate;
        });
        return Object.assign(Object.assign({}, movie), { screenings: filteredScreenings });
    })
        .filter((movie) => movie.screenings.length > 0 || !selectedDate);
}
function fetcImages(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`${API_BASE}/api/cinema/getimage?movieId=${id}`);
        if (!response.ok)
            throw new Error("Nem sikerült lekérni a képet.");
        return yield response.json();
    });
}
function renderMoviesList(moviesToRender) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!movieList)
            return;
        try {
            if (allMovies.length === 0) {
                allMovies = yield fetchMoviesList();
                populateMovieFilters(allMovies);
            }
            const movies = moviesToRender !== null && moviesToRender !== void 0 ? moviesToRender : allMovies;
            movieList.innerHTML = "";
            if (movies.length === 0) {
                movieList.innerHTML = `
                <div class="alert alert-info">Nincs megjeleníthető film.</div>
            `;
                return;
            }
            for (const movie of movies) {
                var image = yield fetcImages(movie.movieId);
                const movieCard = document.createElement("div");
                movieCard.className = "row movie-card my-3";
                movieCard.innerHTML = `
                <div class="col">
                    <img src=${image} alt="${movie.movieTitle}" style="width: 100%; height: 250px; object-fit: cover;">
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
                    : '<p class="text-muted">Nincs elérhető vetítés</p>'}
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
    });
}
function applyMovieFilters() {
    void renderMoviesList(getFilteredMovies());
}
function initializeMovieFilters() {
    locationFilter === null || locationFilter === void 0 ? void 0 : locationFilter.addEventListener("change", applyMovieFilters);
    genreFilter === null || genreFilter === void 0 ? void 0 : genreFilter.addEventListener("change", applyMovieFilters);
    movieFilter === null || movieFilter === void 0 ? void 0 : movieFilter.addEventListener("change", applyMovieFilters);
    dateFilter === null || dateFilter === void 0 ? void 0 : dateFilter.addEventListener("change", applyMovieFilters);
}
// SCREENINGS
function fetchScreeningsList() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`${API_BASE}/api/cinema/getallscreenings`);
        if (!response.ok)
            throw new Error("Nem sikerült lekérni a vetítéseket.");
        return yield response.json();
    });
}
function renderScreeningsTable() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!screeningsTbody)
            return;
        try {
            const screenings = yield fetchScreeningsList();
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
    });
}
// AUTHENTICATION
function handleLoginSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield fetch(`${API_BASE}/api/user/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include"
            });
            if (!response.ok) {
                const text = yield response.text();
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
    });
}
function handleRegisterSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield fetch(`${API_BASE}/api/user/Regist`, {
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
                const text = yield response.text();
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
    });
}
function handleLogout() {
    return __awaiter(this, void 0, void 0, function* () {
        setCurrentUserEmail("");
        try {
            yield fetch(`${API_BASE}/api/user/logout`, {
                method: "POST",
                credentials: "include"
            });
        }
        catch (error) {
        }
        window.location.href = "Bejelentkezes.html";
    });
}
function loadProfileData() {
    return __awaiter(this, void 0, void 0, function* () {
        const emailField = document.getElementById("profileEmail");
        const fullNameField = document.getElementById("profileFullName");
        const billingField = document.getElementById("profileBilling");
        if (!emailField || !fullNameField || !billingField)
            return;
        try {
            const response = yield fetch(`${API_BASE}/api/user/current`, {
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
            const user = yield response.json();
            const storedEmail = getCurrentUserEmail();
            const storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;
            const email = user.email || user.Email || storedEmail || "";
            const fullName = user.fullName || user.FullName || (storedProfile === null || storedProfile === void 0 ? void 0 : storedProfile.fullName) || "";
            const billingAddress = user.billingAddress || user.BillingAddress || (storedProfile === null || storedProfile === void 0 ? void 0 : storedProfile.billingAddress) || "";
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
    });
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
document.addEventListener('DOMContentLoaded', () => __awaiter(this, void 0, void 0, function* () {
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
    yield loadProfileData();
}));
