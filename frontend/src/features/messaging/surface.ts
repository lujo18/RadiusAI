import { messagingApi } from "./services";

export const MessagesSurface = {
  async createMessage(
    content: string,
    senderId: string,
    receiverId: string,
    type: string = "standard",
  ) {
    return await messagingApi.createMessage(
      content,
      senderId,
      receiverId,
      type,
    );
  },

  async getMessagesBetweenUsers(userId1: string, userId2: string) {
    return await messagingApi.getMessagesBetweenUsers(userId1, userId2);
  },

  async getMessagesToUser(userId: string) {
    return await messagingApi.getMessagesToUser(userId);
  },
};
