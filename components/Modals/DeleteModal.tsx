import { BASE_URL } from "@/constants/constants";
import { useConvos, useListings, useMessage, useType, useUser } from "@/store/zustand";
import { supabase } from "@/supabase/authHelper";
import { cleanUP } from "@/utils/functions";
import { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const DeleteModal = ({
  deleteUser,
  setDeleteUser,
  session,
}: {
  deleteUser: boolean;
  setDeleteUser: Function;
  session: User | null;
}) => {
  const { reset: lisReset } = useListings();
  const {changeType} = useType()
  const { reset: userReset } = useUser();
  const { reset: convoReset } = useConvos();
  const { setError, setMessage } = useMessage();
  const router = useRouter();
  const [cantDelete, setCantDelete] = useState(true);

  useEffect(() => {
    const canEvenDelete = async () => {
      if(!session){
        return
      }
      try {
        const response = await fetch(`${BASE_URL}/api/auth`, {
          headers: {
            Authorization: session.id,
          },
        });
        
        const data = await response.json();
      
        const reports = data.reports;
        
        const notResolved = reports?.filter(
          (report: {status: string}) => report?.status !== "RESOLVED",
        );
        if (notResolved?.length === 0) {
          setCantDelete(false);
        }
      } catch (err) {
        console.error(err)
      }
    };
    canEvenDelete();
  }, []);
  function closeModal() {
    setDeleteUser(false);
  }

  async function handleDeleteUser() {
    if (cantDelete) return;
    if (session) {
      try {
        const response = await fetch(`${BASE_URL}/api/auth`, {
          method: "DELETE",
          headers: {
            Authorization: session.id,
          },
        });
        const data = await response.json();
        const success = data.success;
        
        if (!success) {
          setError(true);
          setMessage(
            "Error deleting account,\nplease contact us at \ncontact@market-quad.com!",
          );
          return;
        }
        if (success) {
          await supabase.auth.admin.deleteUser(session.id);
          await supabase.auth.signOut();
        }
        cleanUP(
          { reset: lisReset },
          { reset: userReset },
          { reset: convoReset },
        );
        setDeleteUser(false);
        changeType("sign-up")
        router.replace("/(auth)/sign-in");
      } catch (err) {
        setError(true);
        setMessage(
          "Error deleting account,\nplease contact us at \ncontact@market-quad.com!",
        );
        console.error(err)
      }
    }
  }

  return (
    <Modal
      visible={deleteUser}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeModal}
        className="flex-1 bg-black/50 items-center justify-center px-6"
      >
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
              className={`${cantDelete ? "opacity-50" : "opacity-100"} bg-red-500 py-3.5 rounded-2xl items-center`}
              disabled={cantDelete}
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
