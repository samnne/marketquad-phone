
import { BASE_URL } from "@/constants/constants";
import {  getUserSupabase } from "@/utils/functions";

interface NewMessageProps {
  conversationId: string;
  text: string;
  senderId: string;
}

export async function sendMessage(newMessage: NewMessageProps, user: User) {
  if (!newMessage.conversationId) throw new Error("conversationId is required");
  

  if (user) {
    const message = await fetch(`${BASE_URL}/api/message/${newMessage.conversationId}`, {
      method: "POST",
      headers: {
        Authorization: newMessage.senderId,
      },
      body: JSON.stringify({
        ...newMessage,
        user,
      }),
    }).then((res) => res.json());

    if (!message) {
      console.error("Error sending message:");
      return {
        error: "Failed to send message",
        success: false,
        new_message: null,
        message_text: newMessage.text,
      };
    }
    console.log(message)
    return {
      success: true,
      message: "Message Sent",
      new_message: message.new_message,
    };
  }

  return { error: "User not authenticated", new_message: null };
}

export async function getMessagesForConvo(cid: string) {
  const { user } = await getUserSupabase();
  if (!user) return;
  const messages = await fetch(`${BASE_URL}/api/message?cid=${cid}`, {
    headers: {
      Authorization: user?.id!,
    },
  
  }).then((res) => res.json());

  if (!messages) {
    return false;
  }
  return messages.messages;
}
