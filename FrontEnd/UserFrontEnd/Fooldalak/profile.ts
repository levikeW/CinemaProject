import { fetchAuthenticatedUserData, fetchUserProfile, updateUserProfile } from "../Core/api.js";
import { ensureCurrentUserIdLoaded, setCurrentUserEmail, setCurrentUserId, applyLoginState } from "./auth.js";

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

export async function loadProfileData(): Promise<void> {
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");
    if (!emailField || !fullNameField || !billingField) return;

    const authUser = await fetchAuthenticatedUserData();
    if (!authUser) {
        fillProfileFields("", "", "");
        return;
    }

    const userId = Number(authUser.userId ?? authUser.UserId) || null;
    const email = (authUser.email ?? authUser.Email ?? "").trim();

    if (email) setCurrentUserEmail(email);

    if (!userId) {
        fillProfileFields(
            email,
            authUser.fullName ?? authUser.FullName ?? "",
            authUser.billingAddress ?? authUser.BillingAddress ?? "",
        );
        return;
    }

    setCurrentUserId(userId);

    const profile = await fetchUserProfile(userId);
    fillProfileFields(
        profile?.email ?? profile?.Email ?? email,
        profile?.fullName ?? profile?.FullName ?? "",
        profile?.billingAddress ?? profile?.BillingAddress ?? "",
    );
}

export async function handleProfileSave(event: Event): Promise<void> {
    event.preventDefault();

    const userId = await ensureCurrentUserIdLoaded();
    const emailField = document.getElementById("profileEmail") as HTMLInputElement | null;
    const fullNameField = document.getElementById("profileFullName") as HTMLInputElement | null;
    const billingField = document.getElementById("profileBilling") as HTMLInputElement | null;

    if (!userId || !emailField || !fullNameField || !billingField) {
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

    const response = await updateUserProfile({
        userId,
        email: newEmail,
        fullName,
        billingAddress,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        showProfileMessage(errorText || "A profil mentése most nem sikerült.", true);
        return;
    }

    setCurrentUserEmail(newEmail);
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
