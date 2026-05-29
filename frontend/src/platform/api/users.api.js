import platformClient from "./platformClient.js";

function unwrap(response) {
    return response.data?.data || response.data || {};
}

export async function getPlatformUsers(params = {}) {
    const res = await platformClient.get("/admins", { params });
    return unwrap(res);
}

export async function getPlatformUser(id) {
    const res = await platformClient.get(`/admins/${id}`);
    return unwrap(res);
}

export async function createPlatformUser(payload) {
    const res = await platformClient.post("/admins", payload);
    return unwrap(res);
}

export async function updatePlatformUser(id, payload) {
    const res = await platformClient.patch(`/admins/${id}`, payload);
    return unwrap(res);
}

export async function disablePlatformUser(id) {
    const res = await platformClient.delete(`/admins/${id}`);
    return unwrap(res);
}
