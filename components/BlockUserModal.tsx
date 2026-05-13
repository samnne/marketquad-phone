import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { BASE_URL } from "@/constants/constants";
import { useMessage, useUser } from "@/store/zustand";
import { useRouter } from "expo-router";

const BlockUserModal = ({
  showModal,
  setShowModal,
  userToBlock,
  type,
}: {
  showModal: boolean;
  userToBlock?: { name: string; id: string; blockId?: string };
  setShowModal: (val: boolean) => void;
  type?: "block" | "unblock";
}) => {
  const [cantBlock, setCantBlock] = useState(false);
  const { setSuccess, setMessage, setError } = useMessage();
  const { user, setUser } = useUser();
  const router = useRouter();

  function closeModal() {
    setShowModal(false);
  }

  async function handleBlockUser() {
    if (!user?.app_user?.uid || !userToBlock) {
      return;
    }
    setCantBlock(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userToBlock.id}`, {
        method: "PUT",
        headers: {
          Authorization: user?.app_user?.uid,
        },
        body: JSON.stringify({
          type: type,
          blockId: userToBlock?.blockId || null,
        }),
      }).then((res) => res.json());

      if (res?.data) {
        setSuccess(true);
        setMessage(res?.message);

        setUser({
          ...user,
          app_user: {
            ...user.app_user,
            Blocker:
              type === "block"
                ? [...user.app_user.Blocker, res.data]
                : user?.app_user.Blocker.filter(
                    (block) => block.id !== userToBlock?.blockId,
                  ),
          },
        });
        if (router.canGoBack()) {
          router.back();
        }
        setShowModal(false);
      }
    } catch (error) {
      console.log(error);
      setError(true);
      setMessage("Failed to block user");
    } finally {
      setCantBlock(false);
    }
  }
  const blockOrUnblock = type === "block" ? "block" : "unblock";
  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <TouchableOpacity
        className="flex-1 justify-center items-center bg-text/20 px-6"
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-pill  rounded-4xl transition-all p-6 w-full gap-5"
        >
          <View className=" rounded-4xl items-start justify-center ">
            <Text className="font-bold text-2xl">
              Do you want to {blockOrUnblock}
              {"\n"}
              {userToBlock?.name}?
            </Text>

            {type === "block" && (
              <Text className=" text-lg">
                You can unblock {userToBlock?.name} in settings at any time.
              </Text>
            )}
          </View>
          <View className="gap-2 flex-row justify-center w-full ">
            <TouchableOpacity
              onPress={closeModal}
              activeOpacity={0.6}
              className="bg-[#f0fdf8]  border flex-1 border-[#c8f5e8] py-3.5 rounded-full items-center"
            >
              <Text className="text-[#6b9e8a] text-[14px] font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBlockUser}
              className={`${cantBlock ? "opacity-50" : "opacity-100"} flex-1  bg-primary py-3.5 rounded-full items-center`}
              disabled={cantBlock}
            >
              {cantBlock ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-[14px] font-bold">
                  {type === "block" ? "Block" : "Unblock"} User
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default BlockUserModal;
