import { api } from './client';

export function sendChatMessage(message, rfpContext = {}) {
  return api.post('/chat/', { message, rfp_context: rfpContext });
}
