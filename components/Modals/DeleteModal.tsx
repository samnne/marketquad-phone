import { useConvos, useListings, useUser } from "@/store/zustand";
import { supabase } from "@/supabase/authHelper";
import { cleanUP } from "@/utils/functions";
import { useRouter } from "expo-router";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const DeleteModal = ({
  deleteUser,
  setDeleteUser,
  session,
}: {
  deleteUser: boolean;
  setDeleteUser: Function;
  session: UserSession;
}) => {
  const { reset: lisReset } = useListings();
  const { reset: userReset } = useUser();
  const { reset: convoReset } = useConvos();
  const router = useRouter();

  function closeModal() {
    setDeleteUser(false);
  }

  async function handleDeleteUser() {
    if (session?.id) {
      await supabase.auth.admin.deleteUser(session?.uid, true);
    }
    cleanUP({ reset: lisReset }, { reset: userReset }, { reset: convoReset });
    setDeleteUser(false);
    router.push("/(auth)/sign-in");
  }

  return (
    <Modal
      visible={deleteUser}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeModal}
        className="flex-1 bg-black/50 items-center justify-center px-6"
      >stop press from bubbling to backdrop 
        {/* Modal Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-pill border-primary border rounded-3xl p-6 w-full gap-5"
        >
          {/* Warning Icon */}
          <View className="w-13 h-13 bg-red-50 border border-red-200 rounded-2xl items-center justify-center mx-auto">
            <Text className="text-2xl">⚠️</Text>
          </View>

          {/* Copy */}
          <View className="items-center gap-1">
            <Text className="text-[17px] font-extrabold text-[#011d16]">
              Delete your account?
            </Text>
            <Text className="text-[13px] text-[#6b9e8a] leading-relaxed text-center">
              This will permanently remove all your listings, conversations, and
              data.{" "}
              <Text className="text-red-600 font-bold">
                This cannot be undone.
              </Text>
            </Text>
          </View>

          {/* Actions */}
          <View className="gap-2">
            <TouchableOpacity
              onPress={handleDeleteUser}
              className="bg-red-500 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white text-[14px] font-bold">
                Yes, delete my account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeModal}
              className="bg-[#f0fdf8] border border-[#c8f5e8] py-3.5 rounded-2xl items-center"
            >
              <Text className="text-[#6b9e8a] text-[14px] font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default DeleteModal;