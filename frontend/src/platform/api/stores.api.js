import platformClient from "./platformClient.js";

function unwrap(response) {
    return response.data?.data || response.data || [];
}

export async function getStores() {
    const res = await platformClient.get("/stores");
    return unwrap(res);
}

export async function createStore(payload) {
    const res = await platformClient.post("/stores", payload);
    return unwrap(res);
}

export async function suspendStore(id) {
    const res = await platformClient.post(`/stores/${id}/suspend`);
    return unwrap(res);
}

export async function resumeStore(id) {
    const res = await platformClient.post(`/stores/${id}/resume`);
    return unwrap(res);
}

// Backend route name stays /archive for compatibility; status becomes inactive.
export async function archiveStore(id) {
    const res = await platformClient.post(`/stores/${id}/archive`);
    return unwrap(res);
}

export async function getStoreDetails(id) {
    const res = await platformClient.get(`/stores/${id}`);
    return unwrap(res);
}

export async function getStoreHealth(id) {
    const res = await platformClient.get(`/stores/${id}/health`);
    return unwrap(res);
}

export async function getStoreActivity(id) {
    const res = await platformClient.get(`/stores/${id}/activity`);
    return unwrap(res);
}
