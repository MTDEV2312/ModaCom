import type { ApiResponse, ContactForm } from '@/types';
import { mergeJsonHeaders, requestJson, shouldUseBackend } from '@/lib/services/http-client';
import { apiNotConfiguredMessage } from '@/lib/services/http-client';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function createContactMessage(data: ContactForm): Promise<ApiResponse<ContactMessage>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as ContactMessage,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await requestJson<ApiResponse<ContactMessage>>('/contact/messages', {
      method: 'POST',
      headers: mergeJsonHeaders(),
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      data: null as unknown as ContactMessage,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo enviar el mensaje de contacto.',
    };
  }
}
