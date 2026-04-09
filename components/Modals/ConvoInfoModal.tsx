// components/Modals/ConvoInfoModal.tsx
import { View, Text, ScrollView, Pressable, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/constants/theme";
import { deleteConvo } from "@/utils/functions";
import { useConvos, useMessage, useUser } from "@/store/zustand";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenReview: () => void;
  cid: string;
  listing: any;
  otherUser: any;
  isBuyer: boolean;
};

const ConvoInfoModal = ({
  visible,
  onClose,
  onOpenReview,
  cid,
  listing,
  otherUser,
  isBuyer,
}: Props) => {
  const router = useRouter();
  const { removeConvo } = useConvos();
  const { setError } = useMessage();
  const { user } = useUser();
  
  const handleDelete = () => {
    Alert.alert(
      "Delete conversation",
      "This removes it from your inbox only. The other person won't be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteConvo(cid, user.id);
              if (res?.success) {
                console.log(res)
                // removeConvo(cid);
                onClose();
                router.replace("/convos");
              } else {
                setError(true);
              }
            } catch (err) {
              console.error(err);
              setError(true);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-secondary/15 bg-pill">
          <Text className="text-[17px] font-extrabold text-text">
            Conversation info
          </Text>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-[10px] bg-background border border-secondary/25 items-center justify-center"
          >
            <FontAwesome name="times" size={14} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 gap-4"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Listing ── */}
          {listing && (
            <View className="bg-pill rounded-[20px] border border-secondary/25 p-4 gap-2">
              <Text className="text-[11px] font-medium text-secondary uppercase tracking-widest">
                Listing
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-secondary/20 rounded-xl items-center justify-center">
                  <Text>📦</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[14px] font-bold text-text"
                    numberOfLines={1}
                  >
                    {listing.title}
                  </Text>
                  <Text className="text-[12px] text-secondary">
                    ${listing.price}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Other user ── */}
          {otherUser && (
            <View className="bg-pill rounded-[20px] border border-secondary/25 p-4 gap-3">
              <Text className="text-[11px] font-medium text-secondary uppercase tracking-widest">
                {isBuyer ? "Seller" : "Buyer"}
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-secondary items-center justify-center">
                  <Text className="text-[15px] font-bold text-text">
                    {otherUser.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View>
                  <Text className="text-[14px] font-bold text-text">
                    {otherUser.name}
                  </Text>
                  <Text className="text-[12px] text-secondary">
                    {otherUser.email}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Actions ── */}
          <View className="bg-pill rounded-[20px] border border-secondary/25 overflow-hidden">
            {/* Review */}
            <Pressable
              onPress={onOpenReview}
              className="flex-row items-center gap-3 px-4 py-3.5 border-b border-secondary/15 active:bg-secondary/10"
            >
              <View className="w-9 h-9 rounded-[10px] bg-secondary/20 items-center justify-center">
                <FontAwesome name="star-o" size={15} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-medium text-text">
                  Leave a review
                </Text>
                <Text className="text-[11px] text-secondary">
                  Rate your experience with{" "}
                  {otherUser?.name?.split(" ")[0] ?? "this user"}
                </Text>
              </View>
              <FontAwesome
                name="chevron-right"
                size={12}
                color={colors.secondary}
              />
            </Pressable>

            {/* Delete */}
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-red-50"
            >
              <View className="w-9 h-9 rounded-[10px] bg-red-50 border border-red-200 items-center justify-center">
                <FontAwesome name="trash-o" size={15} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-medium text-red-600">
                  Delete conversation
                </Text>
                <Text className="text-[11px] text-secondary">
                  Removes it from your inbox only
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ConvoInfoModal;
