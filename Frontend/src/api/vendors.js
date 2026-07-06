import { api } from './client';

export function getVendors() {
  return api.get('/vendors/');
}

export function getVendor(vendorId) {
  return api.get(`/vendors/${vendorId}`);
}

export function getSuggestedVendors(rfpId) {
  return api.get(`/rfps/${rfpId}/suggested-vendors`);
}
