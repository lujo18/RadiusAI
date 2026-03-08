import { MessagingRepo } from "./repo";

export const messagingApi = {
  async createMessage(
    content: string,
    senderId: string,
    receiverId: string,
    type: string = "standard",
  ) {
    return await MessagingRepo.createMessage(
      content,
      senderId,
      receiverId,
      type as any,
    );
  },

  async getMessagesBetweenUsers(userId1: string, userId2: string) {
    return await MessagingRepo.getMessagesBetweenUsers(userId1, userId2);
  },

  async getMessagesToUser(userId: string) {
    return await MessagingRepo.getMessagesToUser(userId);
  },
};
