export interface FetchOptions {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: object | null;
  headers?: Record<string, string>;
}

export default async function fetchJson<T>(options: FetchOptions): Promise<T> {
  const { url, method, body, headers } = options;

  const requestHeaders = new Headers();

  if (body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      requestHeaders.set(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: requestHeaders,
  });

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && /application\/.*json/.test(contentType);

  if (!isJson) {
    throw new Error("Request returned non-JSON response");
  }

  const json = await response.json();

  if (!response.ok) {
    console.error("Bad response:", response.status, json);
    throw new Error(`Request failed (${response.status})`);
  }

  return json;
}
