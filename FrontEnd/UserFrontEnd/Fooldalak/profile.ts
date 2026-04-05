import {
    fetchAuthenticatedUserData,
    fetchUserProfile,
    updateUserProfile
} from "../Core/api.js";
import { ensureCurrentUserIdLoaded, setCurrentUserEmail, setCurrentUserId, applyLoginState } from "./auth.js";

// Kitölti a profil mezőket a kapott adatokkal
function fillProfileFields(email: string, fullName: string, billingAddress: string): void {
    const emailField = document.getElementById("profileEmail") as HTMLInputElement | null;
    const fullNameField = document.getElementById("profileFullName") as HTMLInputElement | null;
    const billingField = document.getElementById("profileBilling") as HTMLInputElement | null;

    if (!emailField || !fullNameField || !billingField) {
        return;
    }

    emailField.value = email;
    fullNameField.value = fullName;
    billingField.value = billingAddress;
}

// Kiír egy üzenetet a profil oldalon
// Lehet siker vagy hiba
function showProfileMessage(message: string, isError: boolean): void {
    const profileMessage = document.getElementById("profileMessage");

    if (!profileMessage) {
        return;
    }

    profileMessage.textContent = message;
    profileMessage.className = isError
        ? "alert alert-danger d-block"
        : "alert alert-success d-block";
}

// Betölti a profil adatokat az oldalra
export async function loadProfileData(): Promise<void> {
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");

    if (!emailField || !fullNameField || !billingField) {
        return;
    }

    // Megpróbálja lekérni a bejelentkezett user alapadatait
    const authUser = await fetchAuthenticatedUserData();

    if (!authUser) {
        fillProfileFields("", "", "");
        return;
    }

    const userId = Number(authUser.userId ?? authUser.UserId) || null;
    const email = (authUser.email ?? authUser.Email ?? "").trim();

    // Ha van email, elmentjük helyben is
    if (email) {
        setCurrentUserEmail(email);
    }

    // Ha nincs rendes userId, akkor csak az authUser adatokból tölt
    if (!userId) {
        fillProfileFields(
            email,
            authUser.fullName ?? authUser.FullName ?? "",
            authUser.billingAddress ?? authUser.BillingAddress ?? "",
        );
        return;
    }

    // Ha van userId, elmentjük és lekérjük a teljes profilt is
    setCurrentUserId(userId);

    const profile = await fetchUserProfile(userId);

    fillProfileFields(
        profile?.email ?? profile?.Email ?? email,
        profile?.fullName ?? profile?.FullName ?? "",
        profile?.billingAddress ?? profile?.BillingAddress ?? "",
    );
}

// Profil mentése
export async function handleProfileSave(event: Event): Promise<void> {
    event.preventDefault();

    const userId = await ensureCurrentUserIdLoaded();

    const emailField = document.getElementById("profileEmail") as HTMLInputElement | null;
    const fullNameField = document.getElementById("profileFullName") as HTMLInputElement | null;
    const billingField = document.getElementById("profileBilling") as HTMLInputElement | null;

    // Ha nincs user vagy hiányzik valamelyik mező, nem tudunk menteni
    if (!userId || !emailField || !fullNameField || !billingField) {
        showProfileMessage("A profil mentése most nem sikerült.", true);
        return;
    }

    const newEmail = emailField.value.trim();
    const fullName = fullNameField.value.trim();
    const billingAddress = billingField.value.trim();

    // Email kötelező
    if (!newEmail) {
        showProfileMessage("Az email cím megadása kötelező.", true);
        return;
    }

    const response = await updateUserProfile({
        userId: userId,
        email: newEmail,
        fullName: fullName,
        billingAddress: billingAddress,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        showProfileMessage(errorText || "A profil mentése most nem sikerült.", true);
        return;
    }

    // Sikeres mentés után helyben is frissítjük az emailt
    setCurrentUserEmail(newEmail);

    // Újratöltjük a mezőket a friss értékekkel
    fillProfileFields(newEmail, fullName, billingAddress);

    showProfileMessage("A profil adatai elmentve.", false);
}

Object.assign(window, {
    handleProfileSave,
});

document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    await loadProfileData();
});