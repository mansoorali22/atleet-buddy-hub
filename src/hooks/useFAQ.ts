import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { faqService } from "@/services/faq.service";

export function useFAQList(page: number) {
  return useQuery({
    queryKey: ["faq-list", page],
    queryFn: () => faqService.list(page),
  });
}

export function useFAQStats() {
  return useQuery({
    queryKey: ["faq-stats"],
    queryFn: () => faqService.stats(),
  });
}

export function useUpdateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answer_text }: { id: number; answer_text: string }) =>
      faqService.update(id, answer_text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faq-list"] }),
  });
}

export function useDeleteFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => faqService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faq-list"] });
      qc.invalidateQueries({ queryKey: ["faq-stats"] });
    },
  });
}
