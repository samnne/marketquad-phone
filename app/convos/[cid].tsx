import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView as RNSAV } from "react-native-safe-area-context";
import { styled } from "nativewind";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  useConvos,
  useListings,
  useMessage,
  useReviewModal,
  useUser,
} from "@/store/zustand";
import { socket } from "@/socketio/socket";
import { getUserSupabase } from "@/utils/functions";
import { getMessagesForConvo, sendMessage } from "@/lib/messages.lib";
import { createConvo, getConvo } from "@/lib/conversations.lib";
import ConvoInfoModal from "@/components/Modals/ConvoInfoModal";
import ReviewModal from "@/components/Modals/ReviewModal";
import { Message } from "@/type";
import TypingIndicator from "@/components/TypingIndicator";

const SafeAreaView = styled(RNSAV);
const StyledText = styled(Text);

// Helper functions for date formatting
function formatTime(date: string | Date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateDivider(date: string | Date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const CID = () => {
  const params = useLocalSearchParams<{ cid: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [typing, setTyping] = useState(false);

  const { selectedConvo, setSelectedConvo } = useConvos();
  const { setReviewModal, reviewModal } = useReviewModal();
  const { setError, setMessage } = useMessage();
  const { user, setUser } = useUser();
  const { setSelectedListing } = useListings();
  const [infoModal, setInfoModal] = useState(false);

  const isBuyer = selectedConvo?.buyerId === user?.id;
  const isSeller = selectedConvo?.sellerId === user?.id;
  const otherUser = isBuyer ? selectedConvo?.seller : selectedConvo?.buyer;

  const [messageError, setMessageError] = useState<{
    success?: boolean;
    message_text?: string;
  }>({});

  // --- Logic ---

  useEffect(() => {
    mountUser();
    mountMessages();
    getListingMetaData();
  }, [params.cid]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      handleOpenConvo();
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("typing", ({ cid, typing }) => {
 
      if (cid !== params.cid) return; 
      setTyping(typing);
    });
    socket.on("message", ({ cid, message }) => {
      if (cid !== params.cid) return;
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message");
      socket.off("typing");
    };
  }, [user]);

  const getListingMetaData = async () => {
    if (!params.cid) return;
    const convo = await getConvo(params.cid as string);
    if (!convo) {
      setError(true);
      setMessage("Couldn't fetch convo");
      router.back();
      return;
    }

    setSelectedConvo(convo);
  };

  const mountMessages = async () => {
    if (!params.cid) return;
    const tempMessages = await getMessagesForConvo(params.cid as string);
    if (tempMessages) setMessages(tempMessages);
  };

  const mountUser = async () => {
    const { user, app_user } = await getUserSupabase();
    if (user) {
      setUser({ ...user, app_user });
      socket.emit("open-convo", { cid: params.cid, uid: user.id });
    }
  };

  function handleOpenConvo() {
    if (user?.id && params.cid) {
      socket.emit("open-convo", { cid: params.cid, uid: user.id });
    }
  }

  const handleChangeText = (text: string) => {
    setMessageText(text);
    
    if (text.length > 3) {
      
      socket.emit("typing", { cid: params.cid, typing: true });
      return 
    }
    
    socket.emit("typing", { cid: params.cid, typing: false });
   
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id) return;

    const tempText = messageText;
    setMessageText("");
    socket.emit("typing", { cid: params.cid, typing: false });

    // Optimistic Socket Emit
    socket.emit("message", {
      cid: params.cid,
      message: { senderId: user.id, text: tempText },
    });

    const isNullBuyerOrSeller =
      !selectedConvo?.buyerId || !selectedConvo?.sellerId;
    const otherId = messages.find(
      (msg) => msg?.buyerId !== user.id || msg?.sellerId !== user.id,
    );

    if (isNullBuyerOrSeller) {
      const newCon = await createConvo(
        {
          listingId: selectedConvo?.listingId,
          buyerId: isBuyer ? user.id : otherId.senderId,
          initialMessage: tempText,
          sellerId: isSeller ? user.id : otherId.senderId,
        },
        selectedConvo,
      );
      setSelectedConvo(newCon?.convo);
    }

    const response = await sendMessage(
      {
        conversationId: params.cid as string,
        senderId: user.id,
        text: tempText,
      },
      user?.app_user,
    );

    if (response.new_message) {
      setMessages((prev) => [...prev, response.new_message]);
    } else {
      setMessageError({ success: false, message_text: tempText });
    }
  };

  const listing = selectedConvo?.listing;

  // --- Render Helpers ---

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item?.senderId === user?.id;

    const prevMsg = messages[index - 1];
    const showDivider =
      index === 0 ||
      (prevMsg &&
        new Date(item.createdAt).toDateString() !==
          new Date(prevMsg.createdAt).toDateString());

    const hasError =
      !messageError?.success && item.text === messageError?.message_text;
    const seller = selectedConvo?.seller;
    const buyer = selectedConvo?.buyer;
    const curUser =
      buyer?.uid === user.id
        ? buyer
        : seller?.uid === user.id
          ? seller
          : "Temp";
    return (
      <View className="mb-2">
        {showDivider && item.createdAt && (
          <Text className="text-center text-[11px] text-secondary my-3">
            {formatDateDivider(item.createdAt)}
          </Text>
        )}
        <View
          className={`flex-row items-end ${isMine ? "justify-end" : "justify-start"}`}
        >
          {!isMine && (
            <View className="w-6 h-6 rounded-full bg-gray-300 items-center justify-center mr-1 mb-1">
              <Text className="text-[10px] font-bold">
                {curUser.name?.[0].toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View className="flex-col">
            <View
              className={`px-4 py-2 max-w-70 rounded-[18px] ${
                isMine
                  ? "bg-text text-primary rounded-br-sm"
                  : "bg-primary/25 border border-primary/25 rounded-bl-sm"
              } ${hasError ? "border-red-500" : ""}`}
            >
              <Text
                className={`${isMine ? "text-white" : "text-black"} text-[14px]`}
              >
                {item.text}
              </Text>
            </View>
            <View
              className={`flex-row items-center mt-1 ${isMine ? "justify-end" : "justify-start"}`}
            >
              <Text className="text-[10px] text-gray-400">
                {formatTime(item.createdAt)}
              </Text>
              {hasError && (
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color="red"
                  className="ml-1"
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      {/* Navbar */}
      <View className=" px-4 py-3  border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 mr-2 bg-gray-50 rounded-xl"
          >
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="font-bold text-[14px]" numberOfLines={1}>
              {listing?.title || "Conversation"}
            </Text>
            <View className="flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full mr-1 ${isConnected ? "bg-green-500" : "bg-gray-300"}`}
              />
              <Text className="text-[11px] text-gray-500">
                {isConnected ? "Connected" : "Offline"}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setInfoModal(true)}
          className="p-2 bg-gray-50 rounded-xl"
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#6b9e8a"
          />
        </TouchableOpacity>
        <ConvoInfoModal
          visible={infoModal}
          onClose={() => setInfoModal(false)}
          onOpenReview={() => {
            setInfoModal(false);
            setReviewModal(true);
          }}
          cid={params.cid as string}
          listing={listing}
          otherUser={otherUser}
          isBuyer={isBuyer}
        />

        <ReviewModal
          visible={reviewModal}
          onClose={() => setReviewModal(false)}
          otherUser={otherUser}
          isBuyer={isBuyer}
          role={isBuyer ? "BUYER" : "SELLER"}
        />
      </View>

      {/* Listing Pill */}
      {listing && (
        <View className="m-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-row items-center">
          <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-3">
            <Text>📦</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[12px] font-bold">{listing.title}</Text>
            <Text className="text-[11px] text-gray-500">${listing.price}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedListing(listing);

              router.navigate(`/listings/${listing?.lid}`);
            }}
            className="bg-green-600 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white text-[11px] font-bold">View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.mid?.toString() || index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={
          typing ? (
            <View className=" rounded-full px-4 py-1 w-16 items-center mt-2">
              <TypingIndicator />
            </View>
          ) : null
        }
      />

      {/* Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View className="p-3  border-t border-gray-100 flex-row items-end bg-white">
          <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-2">
            <Ionicons name="add" size={24} color="#6b9e8a" />
          </TouchableOpacity>

          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-[14px] max-h-24"
            placeholder="Message..."
            multiline
            value={messageText}
            onChangeText={handleChangeText}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            className={`w-10 h-10 rounded-xl items-center justify-center ml-2 ${
              messageText.trim() ? "bg-green-600" : "bg-gray-200"
            }`}
          >
            <Ionicons name="arrow-up" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CID;
