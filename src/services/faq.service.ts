import { apiRequest } from "@/services/api";
import type { FAQListResponse, FAQStats, FAQItem } from "@/types/faq";

export const faqService = {
  list(page = 1, perPage = 20) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    return apiRequest<FAQListResponse>(`/faq?${params}`);
  },
  stats() {
    return apiRequest<FAQStats>("/faq/stats");
  },
  update(id: number, answer_text: string) {
    return apiRequest<FAQItem>(`/faq/${id}`, {
      method: "PATCH",
      body: { answer_text },
    });
  },
  remove(id: number) {
    return apiRequest<void>(`/faq/${id}`, { method: "DELETE" });
  },
};
