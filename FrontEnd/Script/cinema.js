var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var API_BASE = "http://localhost:5067";
var jegyekTbody = document.getElementById("jegyekTbody");
var movieList = document.getElementById("movieList");
var screeningsTbody = document.getElementById("screeningsTbody");
var locationFilter = document.getElementById("locationFilter");
var genreFilter = document.getElementById("genreFilter");
var movieFilter = document.getElementById("movieFilter");
var dateFilter = document.getElementById("dateFilter");
var allMovies = [];
var currentUserStorageKey = "cinemaCurrentUserEmail";
var userProfilesStorageKey = "cinemaUserProfiles";
var actorNamedRooms = [
    "Morgan Freeman",
    "Anne Hathaway",
    "Leonardo DiCaprio",
];
function getActorRoomValue(roomLabel) {
    return roomLabel.toLowerCase().replace(/\s+/g, "-");
}
function getStoredProfiles() {
    var rawProfiles = localStorage.getItem(userProfilesStorageKey);
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
    var profiles = getStoredProfiles();
    var existingIndex = profiles.findIndex(function (item) { return item.email.toLowerCase() === email.toLowerCase(); });
    var existingProfile = existingIndex >= 0 ? profiles[existingIndex] : null;
    var mergedProfile = {
        email: email,
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
    var profiles = getStoredProfiles().filter(function (item) { return item.email.toLowerCase() !== oldEmail.toLowerCase(); });
    localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
    saveStoredProfile(newEmail, fullName, billingAddress);
}
function getStoredProfile(email) {
    var profiles = getStoredProfiles();
    return profiles.find(function (item) { return item.email.toLowerCase() === email.toLowerCase(); }) || null;
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
    var email = getCurrentUserEmail().trim();
    var currentPage = window.location.pathname.split("/").pop() || "Cinema.html";
    var navProfileArea = document.getElementById("navProfileArea");
    var authLink = navProfileArea === null || navProfileArea === void 0 ? void 0 : navProfileArea.querySelector('a[href="Bejelentkezes.html"]');
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
    var emailField = document.getElementById("profileEmail");
    var fullNameField = document.getElementById("profileFullName");
    var billingField = document.getElementById("profileBilling");
    if (!emailField || !fullNameField || !billingField)
        return;
    emailField.value = email;
    fullNameField.value = fullName;
    billingField.value = billingAddress;
}
function showProfileMessage(message, isError) {
    var profileMessage = document.getElementById("profileMessage");
    if (!profileMessage)
        return;
    profileMessage.textContent = message;
    profileMessage.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}
function handleProfileSave(event) {
    return __awaiter(this, void 0, void 0, function () {
        var oldEmail, emailField, fullNameField, billingField, newEmail, fullName, billingAddress;
        return __generator(this, function (_a) {
            event.preventDefault();
            oldEmail = getCurrentUserEmail();
            emailField = document.getElementById("profileEmail");
            fullNameField = document.getElementById("profileFullName");
            billingField = document.getElementById("profileBilling");
            if (!oldEmail || !emailField || !fullNameField || !billingField) {
                showProfileMessage("A profil mentése most nem sikerült.", true);
                return [2 /*return*/];
            }
            newEmail = emailField.value.trim();
            fullName = fullNameField.value.trim();
            billingAddress = billingField.value.trim();
            if (!newEmail) {
                showProfileMessage("Az email cím megadása kötelező.", true);
                return [2 /*return*/];
            }
            updateStoredProfile(oldEmail, newEmail, fullName, billingAddress);
            setCurrentUserEmail(newEmail);
            fillProfileFields(newEmail, fullName, billingAddress);
            showProfileMessage("A profil adatai elmentve.", false);
            return [2 /*return*/];
        });
    });
}
function getStaticRoomOptions() {
    return actorNamedRooms.map(function (roomLabel) { return getActorRoomValue(roomLabel); });
}
// TICKETS
function fetchJegyekList() {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/api/cinema/getalltickettype"))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Nem sikerült lekérni a jegyek listát.");
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function renderjegyekTable() {
    return __awaiter(this, void 0, void 0, function () {
        var jegyek, _i, jegyek_1, jegy, row, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!jegyekTbody)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchJegyekList()];
                case 2:
                    jegyek = _a.sent();
                    jegyekTbody.innerHTML = "";
                    if (jegyek.length === 0) {
                        jegyekTbody.innerHTML = "\n                <tr>\n                    <td colspan=\"2\" class=\"text-center text-muted\">Nincs megjelen\u00EDthet\u0151 Jegy.</td>\n                </tr>\n            ";
                        return [2 /*return*/];
                    }
                    for (_i = 0, jegyek_1 = jegyek; _i < jegyek_1.length; _i++) {
                        jegy = jegyek_1[_i];
                        row = document.createElement("tr");
                        row.innerHTML = "\n                <td>".concat(jegy.ticketType, "</td>\n                <td>").concat(jegy.ticketPrice, " Ft</td>\n            ");
                        jegyekTbody.appendChild(row);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error(error_1);
                    if (jegyekTbody) {
                        jegyekTbody.innerHTML = "\n                <tr>\n                    <td colspan=\"2\" class=\"text-center text-danger\">Hiba t\u00F6rt\u00E9nt a lista bet\u00F6lt\u00E9sekor.</td>\n                </tr>\n            ";
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// MOVIES
function fetchMoviesList() {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/api/cinema/getallmovies"))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Nem sikerült lekérni a filmek listáját.");
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function renderMovieOptions(select, values, defaultLabel, getLabel) {
    if (!select)
        return;
    var currentValue = select.value;
    select.innerHTML = "";
    var defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);
    for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
        var value = values_1[_i];
        var option = document.createElement("option");
        option.value = value;
        option.textContent = getLabel ? getLabel(value) : value;
        select.appendChild(option);
    }
    if (values.indexOf(currentValue) !== -1) {
        select.value = currentValue;
    }
}
function populateMovieFilters(movies) {
    var genres = Array.from(new Set(movies.map(function (movie) { return movie.genre; }).filter(Boolean))).sort(function (left, right) { return left.localeCompare(right, "hu"); });
    var movieTitles = Array.from(new Set(movies.map(function (movie) { return movie.movieTitle; }).filter(Boolean))).sort(function (left, right) { return left.localeCompare(right, "hu"); });
    renderMovieOptions(locationFilter, getStaticRoomOptions(), "Összes terem", function (roomValue) { return actorNamedRooms[getStaticRoomOptions().indexOf(roomValue)] || roomValue; });
    renderMovieOptions(genreFilter, genres, "Összes kategória");
    renderMovieOptions(movieFilter, movieTitles, "Összes film");
}
function getFilteredMovies() {
    var _a, _b, _c, _d;
    var selectedLocation = (_a = locationFilter === null || locationFilter === void 0 ? void 0 : locationFilter.value) !== null && _a !== void 0 ? _a : "";
    var selectedGenre = (_b = genreFilter === null || genreFilter === void 0 ? void 0 : genreFilter.value) !== null && _b !== void 0 ? _b : "";
    var selectedMovie = (_c = movieFilter === null || movieFilter === void 0 ? void 0 : movieFilter.value) !== null && _c !== void 0 ? _c : "";
    var selectedDate = (_d = dateFilter === null || dateFilter === void 0 ? void 0 : dateFilter.value) !== null && _d !== void 0 ? _d : "";
    return allMovies
        .filter(function (movie) { return !selectedGenre || movie.genre === selectedGenre; })
        .filter(function (movie) { return !selectedMovie || movie.movieTitle === selectedMovie; })
        .map(function (movie) {
        var filteredScreenings = movie.screenings.filter(function (screening) {
            var matchesLocation = !selectedLocation || true;
            var matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;
            return matchesLocation && matchesDate;
        });
        return __assign(__assign({}, movie), { screenings: filteredScreenings });
    })
        .filter(function (movie) { return movie.screenings.length > 0 || !selectedDate; });
}
function renderMoviesList(moviesToRender) {
    return __awaiter(this, void 0, void 0, function () {
        var movies, _i, movies_1, movie, movieCard, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!movieList)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!(allMovies.length === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchMoviesList()];
                case 2:
                    allMovies = _a.sent();
                    populateMovieFilters(allMovies);
                    _a.label = 3;
                case 3:
                    movies = moviesToRender !== null && moviesToRender !== void 0 ? moviesToRender : allMovies;
                    movieList.innerHTML = "";
                    if (movies.length === 0) {
                        movieList.innerHTML = "\n                <div class=\"alert alert-info\">Nincs megjelen\u00EDthet\u0151 film.</div>\n            ";
                        return [2 /*return*/];
                    }
                    for (_i = 0, movies_1 = movies; _i < movies_1.length; _i++) {
                        movie = movies_1[_i];
                        movieCard = document.createElement("div");
                        movieCard.className = "row movie-card my-3";
                        movieCard.innerHTML = "\n                <div class=\"col\">\n                    <img src=\"cinemaniabackground1.png\" alt=\"".concat(movie.movieTitle, "\" style=\"width: 100%; height: 250px; object-fit: cover;\">\n                </div>\n                <div class=\"col\">\n                    <h3>C\u00EDm: ").concat(movie.movieTitle, "</h3>\n                    <p><strong>Rendez\u0151:</strong> ").concat(movie.director, "</p>\n                    <p><strong>Id\u0151tartam:</strong> ").concat(movie.duration, " perc</p>\n                    <p><strong>M\u0171faj:</strong> ").concat(movie.genre, "</p>\n                    <p><strong>Le\u00EDr\u00E1s:</strong> ").concat(movie.description, "</p>\n                    <div class=\"screenings-buttons\">\n                        ").concat(movie.screenings.length > 0
                            ? movie.screenings.map(function (screening, index) { return "\n                                <button class=\"btn btn-primary btn-sm me-2\" data-screening-id=\"".concat(screening.filmScreeningId, "\">\n                                    Vet\u00EDt\u00E9s ").concat(index + 1, " (").concat(new Date(screening.date).toLocaleString('hu-HU'), ")\n                                </button>\n                            "); }).join('')
                            : '<p class="text-muted">Nincs elérhető vetítés</p>', "\n                    </div>\n                </div>\n            ");
                        movieList.appendChild(movieCard);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error(error_2);
                    if (movieList) {
                        movieList.innerHTML = "\n                <div class=\"alert alert-danger\">Hiba t\u00F6rt\u00E9nt a filmek bet\u00F6lt\u00E9sekor.</div>\n            ";
                    }
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
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
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/api/cinema/getallscreenings"))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Nem sikerült lekérni a vetítéseket.");
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function renderScreeningsTable() {
    return __awaiter(this, void 0, void 0, function () {
        var screenings, _i, screenings_1, screening, row, date, formattedDate, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!screeningsTbody)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchScreeningsList()];
                case 2:
                    screenings = _a.sent();
                    screeningsTbody.innerHTML = "";
                    if (screenings.length === 0) {
                        screeningsTbody.innerHTML = "\n                <tr>\n                    <td colspan=\"6\" class=\"text-center text-muted\">Nincs megjelen\u00EDthet\u0151 vet\u00EDt\u00E9s.</td>\n                </tr>\n            ";
                        return [2 /*return*/];
                    }
                    for (_i = 0, screenings_1 = screenings; _i < screenings_1.length; _i++) {
                        screening = screenings_1[_i];
                        row = document.createElement("tr");
                        date = new Date(screening.date);
                        formattedDate = date.toLocaleString('hu-HU');
                        row.innerHTML = "\n                <td>".concat(screening.movieTitle, "</td>\n                <td>").concat(screening.roomName, "</td>\n                <td>").concat(formattedDate, "</td>\n                <td>\n                    <button class=\"btn btn-sm btn-success\">Foglal\u00E1s</button>\n                </td>\n            ");
                        screeningsTbody.appendChild(row);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error(error_3);
                    if (screeningsTbody) {
                        screeningsTbody.innerHTML = "\n                <tr>\n                    <td colspan=\"6\" class=\"text-center text-danger\">Hiba t\u00F6rt\u00E9nt a vet\u00EDt\u00E9sek bet\u00F6lt\u00E9sekor.</td>\n                </tr>\n            ";
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// AUTHENTICATION
function handleLoginSubmit(event) {
    return __awaiter(this, void 0, void 0, function () {
        var emailInput, passwordInput, loginMessage, email, password, response, text, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    emailInput = document.getElementById("loginEmail");
                    passwordInput = document.getElementById("loginPassword");
                    loginMessage = document.getElementById("loginMessage");
                    if (!emailInput || !passwordInput)
                        return [2 /*return*/];
                    email = emailInput.value;
                    password = passwordInput.value;
                    if (loginMessage) {
                        loginMessage.className = "mb-3";
                        loginMessage.textContent = "";
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/user/login"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: email, password: password }),
                            credentials: "include"
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    text = _a.sent();
                    if (loginMessage) {
                        loginMessage.className = "text-danger mb-3";
                        loginMessage.textContent = text || "Hibás email vagy jelszó.";
                    }
                    return [2 /*return*/];
                case 4:
                    if (loginMessage) {
                        loginMessage.className = "text-success mb-3";
                        loginMessage.textContent = "Sikeres bejelentkezés!";
                    }
                    setCurrentUserEmail(email);
                    window.location.replace("Profile.html");
                    return [2 /*return*/];
                case 5:
                    err_1 = _a.sent();
                    if (loginMessage) {
                        loginMessage.className = "text-danger mb-3";
                        loginMessage.textContent = "Hiba a bejelentkezés során.";
                    }
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function handleRegisterSubmit(event) {
    return __awaiter(this, void 0, void 0, function () {
        var emailInput, fullNameInput, addressInput, passwordInput, passwordConfirmInput, registerMessage, response, text, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    emailInput = document.getElementById("registerEmail");
                    fullNameInput = document.getElementById("registerFullName");
                    addressInput = document.getElementById("registerAddress");
                    passwordInput = document.getElementById("registerPassword");
                    passwordConfirmInput = document.getElementById("registerPasswordConfirm");
                    registerMessage = document.getElementById("registerMessage");
                    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput)
                        return [2 /*return*/];
                    if (registerMessage) {
                        registerMessage.className = "mb-3";
                        registerMessage.textContent = "";
                    }
                    if (passwordInput.value !== passwordConfirmInput.value) {
                        if (registerMessage) {
                            registerMessage.className = "text-danger mb-3";
                            registerMessage.textContent = "A két jelszó nem egyezik.";
                        }
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/user/register"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                Email: emailInput.value,
                                FullName: fullNameInput.value,
                                Password: passwordInput.value,
                                BillingAddress: addressInput.value,
                            }),
                            credentials: "include"
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    text = _a.sent();
                    if (registerMessage) {
                        registerMessage.className = "text-danger mb-3";
                        registerMessage.textContent = response.status === 409 || /letezik|exists/i.test(text)
                            ? "Ez a felhasználó már létezik."
                            : (text || "Sikertelen regisztráció.");
                    }
                    return [2 /*return*/];
                case 4:
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
                    return [3 /*break*/, 6];
                case 5:
                    err_2 = _a.sent();
                    if (registerMessage) {
                        registerMessage.className = "text-danger mb-3";
                        registerMessage.textContent = "Hiba történt a regisztráció során.";
                    }
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function handleLogout() {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setCurrentUserEmail("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/user/logout"), {
                            method: "POST",
                            credentials: "include"
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    window.location.href = "Bejelentkezes.html";
                    return [2 /*return*/];
            }
        });
    });
}
function loadProfileData() {
    return __awaiter(this, void 0, void 0, function () {
        var emailField, fullNameField, billingField, response, storedEmail_1, storedProfile_1, user, storedEmail, storedProfile, email, fullName, billingAddress, error_5, storedEmail, storedProfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    emailField = document.getElementById("profileEmail");
                    fullNameField = document.getElementById("profileFullName");
                    billingField = document.getElementById("profileBilling");
                    if (!emailField || !fullNameField || !billingField)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/user/current"), {
                            credentials: "include"
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        storedEmail_1 = getCurrentUserEmail();
                        storedProfile_1 = storedEmail_1 ? getStoredProfile(storedEmail_1) : null;
                        if (storedProfile_1) {
                            fillProfileFields(storedProfile_1.email, storedProfile_1.fullName, storedProfile_1.billingAddress);
                        }
                        else {
                            fillProfileFields(storedEmail_1, "", "");
                        }
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    user = _a.sent();
                    storedEmail = getCurrentUserEmail();
                    storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;
                    email = user.email || user.Email || storedEmail || "";
                    fullName = user.fullName || user.FullName || (storedProfile === null || storedProfile === void 0 ? void 0 : storedProfile.fullName) || "";
                    billingAddress = user.billingAddress || user.BillingAddress || (storedProfile === null || storedProfile === void 0 ? void 0 : storedProfile.billingAddress) || "";
                    if (email) {
                        setCurrentUserEmail(email);
                        saveStoredProfile(email, fullName, billingAddress);
                    }
                    fillProfileFields(email, fullName, billingAddress);
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    storedEmail = getCurrentUserEmail();
                    storedProfile = storedEmail ? getStoredProfile(storedEmail) : null;
                    if (storedProfile) {
                        fillProfileFields(storedProfile.email, storedProfile.fullName, storedProfile.billingAddress);
                        return [2 /*return*/];
                    }
                    fillProfileFields(storedEmail, "", "");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
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
document.addEventListener('DOMContentLoaded', function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
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
                return [4 /*yield*/, loadProfileData()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
