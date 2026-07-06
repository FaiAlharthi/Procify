import { api } from './client';

export function getEmployee(employeeId) {
  return api.get(`/employees/${employeeId}`);
}
