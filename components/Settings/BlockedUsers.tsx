import { View, Text, Pressable, TouchableOpacity, Modal } from "react-native";
import React, { useState } from "react";
import { Image, ScrollView } from "moti";
import { MotiPressable } from "moti/interactions";
import { SymbolView } from "expo-symbols";
import { colors } from "@/constants/theme";
import BlockUserModal from "../BlockUserModal";
import { useUser } from "@/store/zustand";
type Props = {
  open: boolean;
  blockedUsers: BlockedUser[];
  save: (newPassword: string) => void;
  loading: boolean;
  onDeleteAccount: () => void;
};

const BlockedUsers = (props: Props) => {
  const [active, setActive] = useState(false);
  const [blockedUser, setBlockedUser] = useState<BlockedUser>();

  if (!props.open) return null;

 
  async function handleUnblock(userToBlock: BlockedUser) {
    setBlockedUser(userToBlock);
  }

  return (
    <ScrollView>
      {props.blockedUsers?.map((blockedUser) => {
        return (
          <TouchableOpacity
            activeOpacity={0.75}
            key={blockedUser?.id}
            onPress={() => {
              setActive(true);
              handleUnblock(blockedUser);
            }}
            className="p-5 flex-row gap-2 justify-between items-center"
          >
            <View className="flex-row items-center gap-2">
              <View className="w-12 h-12 rounded-2xl bg-primary">
                <Image
                  className="w-full flex-1 rounded-2xl"
                  source={{ uri: blockedUser.blocked.profileURL }}
                />
              </View>
              <Text className="font-bold ">{blockedUser?.blocked.name}</Text>
            </View>
            <MotiPressable containerStyle={{}}>
              <SymbolView name="slash.circle" tintColor={colors.text} />
            </MotiPressable>
          </TouchableOpacity>
        );
      })}
      <BlockUserModal
        setShowModal={setActive}
        showModal={active}
        type="unblock"
        userToBlock={
          blockedUser && { name: blockedUser.blocked.name, id: blockedUser.blocked.uid, blockId:  blockedUser.id }
        }
      />
    </ScrollView>
  );
};

export default BlockedUsers;
