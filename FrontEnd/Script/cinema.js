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
// TICKETS
function fetchJegyekList() {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/api/cinema/getallticket"))];
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
                        jegyekTbody.innerHTML = "\n                <tr>\n                    <td colspan=\"5\" class=\"text-center text-muted\">Nincs megjelen\u00EDthet\u0151 Jegy.</td>\n                </tr>\n            ";
                        return [2 /*return*/];
                    }
                    for (_i = 0, jegyek_1 = jegyek; _i < jegyek_1.length; _i++) {
                        jegy = jegyek_1[_i];
                        row = document.createElement("tr");
                        row.innerHTML = "\n                <td>".concat(jegy.ticketType, "</td>\n                <td>").concat(jegy.ticketPrice, " Ft</td>\n                <td></td>\n            ");
                        jegyekTbody.appendChild(row);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error(error_1);
                    if (jegyekTbody) {
                        jegyekTbody.innerHTML = "\n                <tr>\n                    <td colspan=\"5\" class=\"text-center text-danger\">Hiba t\u00F6rt\u00E9nt a lista bet\u00F6lt\u00E9sekor.</td>\n                </tr>\n            ";
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
function renderMoviesList() {
    return __awaiter(this, void 0, void 0, function () {
        var movies, _i, movies_1, movie, movieCard, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!movieList)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchMoviesList()];
                case 2:
                    movies = _a.sent();
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
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error(error_2);
                    if (movieList) {
                        movieList.innerHTML = "\n                <div class=\"alert alert-danger\">Hiba t\u00F6rt\u00E9nt a filmek bet\u00F6lt\u00E9sekor.</div>\n            ";
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
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
// Bejelentkezés űrlap submit handler
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
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("http://localhost:5067/api/user/login", {
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
                    if (loginMessage)
                        loginMessage.textContent = text || "Hibás email vagy jelszó.";
                    return [2 /*return*/];
                case 4:
                    // Sikeres bejelentkezés után átirányítás
                    window.location.href = "Cinema.html";
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    if (loginMessage)
                        loginMessage.textContent = "Hiba a bejelentkezés során.";
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// INITIALIZATION
document.addEventListener('DOMContentLoaded', function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (jegyekTbody) {
            renderjegyekTable();
        }
        if (movieList) {
            renderMoviesList();
        }
        if (screeningsTbody) {
            renderScreeningsTable();
        }
        return [2 /*return*/];
    });
}); });
