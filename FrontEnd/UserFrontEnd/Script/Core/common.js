export const API_BASE = "https://localhost:7199";
export const cartButtonId = "floatingCartButton";
export const moviePosterFallbacks = {
    avatar: "avatar.jpg",
    inception: "inception.jpg",
    interstellar: "interstellar.jpg",
    "the dark knight": "thedarkknight.jpg",
};
export const movieDescriptionTranslations = {
    inception: "Egy tolvaj álmokba lép be, hogy titkokat lopjon.",
    interstellar: "Egy csapat egy űrbéli féreglyukon keresztül utazik.",
    "the dark knight": "Batman Gotham városában szembenéz Jokerrel.",
    avatar: "Egy tengerészgyalogos felfedezi Pandora világát.",
};
export function parseNumericId(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }
    if (typeof value === "string") {
        const normalized = Number(value);
        return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
    }
    return null;
}
export function normalizeCollectionPayload(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && Array.isArray(payload.value)) {
        return payload.value;
    }
    return [];
}
export function formatPrice(amount) {
    return `${amount.toLocaleString("hu-HU")} Ft`;
}
export function getImageSource(imageData, fallbackSource) {
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
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < image.imageContent.length; index += chunkSize) {
        const chunk = image.imageContent.slice(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
}
export function showReservationMessage(message, isError = false) {
    const mainSection = document.querySelector("main.page-section");
    if (!mainSection)
        return;
    let container = mainSection.querySelector("#reservationsMessage");
    if (!container) {
        container = document.createElement("div");
        container.id = "reservationsMessage";
        mainSection.prepend(container);
    }
    container.textContent = message;
    container.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
    setTimeout(() => {
        if (container)
            container.className = "";
    }, 5000);
}
