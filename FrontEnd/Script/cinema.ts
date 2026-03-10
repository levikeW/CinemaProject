const API_BASE = "http://localhost:5067";

// DTO
interface TicketDto {
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

interface RoomDto {
    roomId: number;
    roomName: string;
}

interface LoginDto {
    email: string;
    password: string;
}

interface RegistDto {
    Email: string;
    FullName: string;
    Password: string;
    BillingAddress: string;
}

interface LoginResponse {
    role: string;
}


const jegyekTbody = document.getElementById("jegyekTbody") as HTMLTableSectionElement | null;
const movieList = document.getElementById("movieList") as HTMLElement | null;
const screeningsTbody = document.getElementById("screeningsTbody") as HTMLTableSectionElement | null;

// TICKETS
async function fetchJegyekList(): Promise<TicketDto[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallticket`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a jegyek listát.");
    return await response.json() as TicketDto[];
}

async function renderjegyekTable(): Promise<void> {
    if (!jegyekTbody) return;
    
    try {
        const jegyek = await fetchJegyekList();
        jegyekTbody.innerHTML = "";

        if (jegyek.length === 0) {
            jegyekTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">Nincs megjeleníthető Jegy.</td>
                </tr>
            `;
            return;
        }

        for (const jegy of jegyek) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${jegy.ticketType}</td>
                <td>${jegy.ticketPrice} Ft</td>
                <td></td>
            `;
            jegyekTbody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        if (jegyekTbody) {
            jegyekTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">Hiba történt a lista betöltésekor.</td>
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

async function renderMoviesList(): Promise<void> {
    if (!movieList) return;

    try {
        const movies = await fetchMoviesList();
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
async function handleLogin(email: string, password: string): Promise<void> {
    const loginContainer = document.getElementById("loginContainer") as HTMLDivElement | null;
    const loginMessage = document.getElementById("loginMessage") as HTMLDivElement | null;
    
    try {
        const response = await fetch(`${API_BASE}/api/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Bejelentkezés sikertelen");
        }

        const data = await response.json() as LoginResponse;
        
        if (loginMessage) {
            loginMessage.className = "alert alert-success";
            loginMessage.textContent = "Sikeres bejelentkezés!";
            loginMessage.style.display = "block";
        }
        
        setTimeout(() => {
            if (data.role === "Admin") {
                window.location.href = "Cinema.html"; // admin page not implemented yet
            } else {
                window.location.href = "Cinema.html";
            }
        }, 2000);
    } catch (error) {
        console.error(error);
        if (loginMessage) {
            loginMessage.className = "alert alert-danger";
            loginMessage.textContent = `Hiba: ${error instanceof Error ? error.message : "Bejelentkezés sikertelen"}`;
            loginMessage.style.display = "block";
        }
    }
}

async function handleRegister(email: string, fullName: string, password: string, passwordConfirm: string, billingAddress: string): Promise<void> {
    const registerContainer = document.getElementById("registerContainer") as HTMLDivElement | null;
    const registerMessage = document.getElementById("registerMessage") as HTMLDivElement | null;
    
    try {
        if (!email || !fullName || !password || !passwordConfirm || !billingAddress) {
            throw new Error("Minden mező kitöltése kötelező!");
        }

        if (password !== passwordConfirm) {
            throw new Error("A jelszavak nem egyeznek!");
        }

        if (password.length < 6) {
            throw new Error("A jelszó legalább 6 karakter hosszú legyen!");
        }

        const response = await fetch(`${API_BASE}/api/user/Regist?IsAdmin=false`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Email: email,
                FullName: fullName,
                Password: password,
                BillingAddress: billingAddress
            } as RegistDto),
            credentials: "include"
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Regisztráció sikertelen");
        }

        if (registerMessage) {
            registerMessage.className = "alert alert-success";
            registerMessage.textContent = "Sikeres regisztráció! Mostantól bejelentkezhetsz.";
            registerMessage.style.display = "block";
        }

        // Clear form
        const form = document.getElementById("registerForm") as HTMLFormElement;
        if (form) {
            form.reset();
        }

        // Switch to login tab
        setTimeout(() => {
            const loginTab = document.getElementById("loginTab") as HTMLElement | null;
            if (loginTab) {
                loginTab.click();
            }
        }, 2000);
    } catch (error) {
        console.error(error);
        if (registerMessage) {
            registerMessage.className = "alert alert-danger";
            registerMessage.textContent = `Hiba: ${error instanceof Error ? error.message : "Regisztráció sikertelen"}`;
            registerMessage.style.display = "block";
        }
    }
}

async function handleLogout(): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/api/user/logout`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            window.location.href = "/";
        }
    } catch (error) {
        console.error(error);
    }
}

// AUTH HELPERS
async function fetchCurrentUser(): Promise<{ userId: number; email: string; fullName: string; billingAddress: string } | null> {
    try {
        const resp = await fetch(`${API_BASE}/api/user/me`, { credentials: 'include' });
        if (!resp.ok) return null;
        return await resp.json();
    } catch {
        return null;
    }
}

function replaceNavWithProfile(userName: string): void {
    const nav = document.querySelector('.navbar-nav');
    if (!nav) return;
    const li = document.createElement('li');
    li.className = 'nav-item dropdown';
    li.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            👤 ${userName}
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
            <li><a class="dropdown-item" href="profile.html">Profil</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="handleLogout();">Kijelentkezés</a></li>
        </ul>
    `;
    // remove previous login/reg links
    nav.querySelectorAll('li.nav-item').forEach(el => {
        const a = el.querySelector('a.nav-link');
        if (a && /Bejelentkezés|Regisztráció/.test(a.textContent || '')) {
            el.remove();
        }
    });
    nav.appendChild(li);
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    if (jegyekTbody) {
        renderjegyekTable();
    }
    if (movieList) {
        renderMoviesList();
    }
    if (screeningsTbody) {
        renderScreeningsTable();
    }
    const user = await fetchCurrentUser();
    if (user) {
        replaceNavWithProfile(user.fullName || user.email);
    }
});