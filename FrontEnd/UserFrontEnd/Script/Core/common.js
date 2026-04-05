// A backend alap címe
export const API_BASE = "https://localhost:7199";
// A lebegő kosár gomb HTML id-ja
export const cartButtonId = "floatingCartButton";
// Ha nincs rendes kép egy filmhez, ezekből próbálunk alapértelmezett képet adni
export const moviePosterFallbacks = {
    avatar: "avatar.jpg",
    inception: "inception.jpg",
    interstellar: "interstellar.jpg",
    "the dark knight": "thedarkknight.jpg",
};
// Megnézi, hogy egy értékből lehet-e normális pozitív szám
// Pl. "12" -> 12
// Pl. 5 -> 5
// Pl. "abc" -> null
export function parseNumericId(value) {
    if (typeof value === "number") {
        if (Number.isFinite(value) && value > 0) {
            return value;
        }
        return null;
    }
    if (typeof value === "string") {
        const numberValue = Number(value);
        if (Number.isFinite(numberValue) && numberValue > 0) {
            return numberValue;
        }
        return null;
    }
    return null;
}
// API válaszokat egységesít tömbbé
export function normalizeCollectionPayload(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && Array.isArray(payload.value)) {
        return payload.value;
    }
    return [];
}
// Ár szépen formázva magyarul
// Pl. 2500 -> "2 500 Ft"
export function formatPrice(amount) {
    return `${amount.toLocaleString("hu-HU")} Ft`;
}
// Képadatból csinál böngészőben használható image src-et
// Ha nincs jó kép, fallback képet ad vissza
export function getImageSource(imageData, fallbackSource) {
    if (!imageData) {
        return fallbackSource;
    }
    // Ha tömb jön, az első képet használjuk
    const image = Array.isArray(imageData) ? imageData[0] : imageData;
    if (!image?.imageContent) {
        return fallbackSource;
    }
    // Ha a képtartalom string
    if (typeof image.imageContent === "string") {
        const trimmedContent = image.imageContent.trim();
        // Túl rövid vagy üres string esetén fallback
        if (!trimmedContent || trimmedContent.length < 100) {
            return fallbackSource;
        }
        // Ha már kész data:image formátum, azt használjuk
        if (trimmedContent.startsWith("data:image")) {
            return trimmedContent;
        }
        // Különben base64 jpeg-ként kezeljük
        return `data:image/jpeg;base64,${trimmedContent}`;
    }
    // Ha byte tömb jön
    if (image.imageContent.length < 64) {
        return fallbackSource;
    }
    let binary = "";
    const chunkSize = 0x8000;
    // Nagyobb tömbök feldolgozása darabonként
    for (let index = 0; index < image.imageContent.length; index += chunkSize) {
        const chunk = image.imageContent.slice(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
}
// Zöld vagy piros üzenetet ír ki az oldal tetejére
// Pl. sikeres foglalás vagy hiba esetén
export function showReservationMessage(message, isError = false) {
    const mainSection = document.querySelector("main.page-section");
    if (!mainSection) {
        return;
    }
    let container = mainSection.querySelector("#reservationsMessage");
    // Ha még nincs üzenet doboz, létrehozzuk
    if (!container) {
        container = document.createElement("div");
        container.id = "reservationsMessage";
        mainSection.prepend(container);
    }
    container.textContent = message;
    container.className = isError
        ? "alert alert-danger d-block"
        : "alert alert-success d-block";
    // 5 másodperc után eltüntetjük a kinézetét
    setTimeout(() => {
        if (container) {
            container.className = "";
        }
    }, 5000);
}
