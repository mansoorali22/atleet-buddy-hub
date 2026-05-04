import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import type { SendMessageBody, UpdateDatesBody, UpdatePlanBody, UpdateStatusBody } from "@/types/user";

export function useUpdateUserPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ whatsappNumber, body }: { whatsappNumber: string; body: UpdatePlanBody }) =>
      usersService.updatePlan(whatsappNumber, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.invalidateQueries({ queryKey: ["user-detail"] });
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ whatsappNumber, body }: { whatsappNumber: string; body: UpdateStatusBody }) =>
      usersService.updateStatus(whatsappNumber, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.invalidateQueries({ queryKey: ["user-detail"] });
    },
  });
}

export function useUpdateUserDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ whatsappNumber, body }: { whatsappNumber: string; body: UpdateDatesBody }) =>
      usersService.updateDates(whatsappNumber, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.invalidateQueries({ queryKey: ["user-detail"] });
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (whatsappNumber: string) => usersService.block(whatsappNumber),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.invalidateQueries({ queryKey: ["user-detail"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (whatsappNumber: string) => usersService.unblock(whatsappNumber),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      await qc.invalidateQueries({ queryKey: ["user-detail"] });
    },
  });
}

export function useSendUserMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ whatsappNumber, body }: { whatsappNumber: string; body: SendMessageBody }) =>
      usersService.sendMessage(whatsappNumber, body),
    onSuccess: async (_, { whatsappNumber }) => {
      await qc.invalidateQueries({ queryKey: ["user-detail", whatsappNumber] });
    },
  });
}
