const Admin_API_BASE = " https://localhost:7199";

function Admin_escapeJs(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ");
}

async function Admin_apiGet<T>(url: string): Promise<T> {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        credentials: "include"
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `GET hiba: ${url}`);
    }

    return await response.json() as T;
}

async function Admin_apiPost<TBody, TResult = void>(url: string, body: TBody): Promise<TResult> {
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
        return await response.json() as TResult;
    }

    return undefined as TResult;
}

async function Admin_apiPut<TBody, TResult = void>(url: string, body?: TBody): Promise<TResult> {
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
        return await response.json() as TResult;
    }

    return undefined as TResult;
}

async function Admin_apiDelete(url: string): Promise<void> {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "DELETE",
        credentials: "include"
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `DELETE hiba: ${url}`);
    }
}