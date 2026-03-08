import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";

export class MessagingRepo {
  // === CREATE ===
  static async createMessage(
    content: string,
    senderId: string,
    receiverId: string,
    type: Database["public"]["Enums"]["message_types"] = "standard",
  ) {
    const { data } = await supabase
      .from("messages")
      .insert({
        content,
        sender_id: senderId,
        reciever_id: receiverId,
        type,
      })
      .select("*")
      .single();
    return data;
  }

  // === READ ===
  static async getMessagesBetweenUsers(userId1: string, userId2: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId1},reciever_id.eq.${userId2}),and(sender_id.eq.${userId2},reciever_id.eq.${userId1})`,
      )
      .order("created_at", { ascending: true });
    return data;
  }

  static async getMessagesToUser(userId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("reciever_id", userId)
      .order("created_at", { ascending: true });
    return data;
  }
}
