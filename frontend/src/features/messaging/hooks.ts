import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagesSurface } from "./surface";

export const messageKeys = {
  allBetweenUsers: (userId1: string, userId2: string) => ['messages', 'between', userId1, userId2] as const,
  toUser: (userId: string) => ['messages', 'to', userId] as const,
};

export function useCreateMessage(senderId: string, receiverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, type = "standard" }: { content: string; type?: string }) => {
      const res = await MessagesSurface.createMessage(content, senderId, receiverId, type);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.toUser(receiverId) });
    }
  })
}

export function useMessagesBetweenUsers(userId1: string, userId2: string) {
  return useQuery({
    queryKey: messageKeys.allBetweenUsers(userId1, userId2),
    queryFn: async () => {
      const res = await MessagesSurface.getMessagesBetweenUsers(userId1, userId2);
      return res;
    },
  })
}

export function useMessagesToUser(userId: string) {
  return useQuery({
    queryKey: messageKeys.toUser(userId),
    queryFn: async () => {
      const res = await MessagesSurface.getMessagesToUser(userId);
      return res;
    },
  })
}