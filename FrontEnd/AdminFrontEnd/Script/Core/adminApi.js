const Admin_API_BASE = "https://localhost:7199";
function Admin_escapeJs(value) {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ");
}
async function Admin_apiGet(url) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        credentials: "include"
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `GET hiba: ${url}`);
    }
    return await response.json();
}
async function Admin_apiPost(url, body) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `POST hiba: ${url}`);
    }
    if (response.headers.get("content-type")?.includes("application/json")) {
        return await response.json();
    }
    return undefined;
}
async function Admin_apiPut(url, body) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "PUT",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        credentials: "include",
        body: body ? JSON.stringify(body) : null
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `PUT hiba: ${url}`);
    }
    if (response.headers.get("content-type")?.includes("application/json")) {
        return await response.json();
    }
    return undefined;
}
async function Admin_apiDelete(url) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `DELETE hiba: ${url}`);
    }
}
// @ts-ignore
window.Admin_escapeJs = Admin_escapeJs;
