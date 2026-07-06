// RFP endpoints — these map 1:1 to the FastAPI routes we built:
//   GET  /rfps/  -> list of RFPs (newest first)
//   POST /rfps/  -> create one and return it
//
// Used by the dashboard (next screen). The login page does not call these.

import { api } from "./client";

export function getRFPs(vendorId = null) {
  const url = vendorId ? `/rfps/?vendor_id=${encodeURIComponent(vendorId)}` : '/rfps/';
  return api.get(url);
}

export function sendToVendors(rfpId, vendorIds) {
  return api.post(`/rfps/${rfpId}/send-to-vendors`, { vendor_ids: vendorIds });
}

// payload shape expected by the backend's RFPCreate schema:
// { title, description, industry, budget, status? }
export function createRFP(payload) {
  return api.post("/rfps/", payload);
}

export function updateRFP(rfpId, payload) {
  return api.patch(`/rfps/${rfpId}`, payload);
}

export function closeRFP(rfpId, winnerVendorId = null) {
  return api.patch(`/rfps/${rfpId}/close`, { winner_vendor_id: winnerVendorId });
}

export function deleteRFP(rfpId) {
  return api.delete(`/rfps/${rfpId}`);
}
