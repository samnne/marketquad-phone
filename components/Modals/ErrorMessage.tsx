import { useMessage } from "@/store/zustand";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ErrorMessageProps = {
  message?: string;
};

const ErrorMessage = ({ message = "An error occurred" }: ErrorMessageProps) => {
  const { setError } = useMessage();
  const insets = useSafeAreaInsets();

  return (
    <MotiView
      from={{ opacity: 0, translateX: 12, scale: 0.95 }}
      animate={{ opacity: 1, translateX: 0, scale: 1 }}
      exit={{ opacity: 0, translateX: 12, scale: 0.95 }}
      transition={{ type: "spring", damping: 18, stiffness: 200 }}
      style={{ top: insets.top + 8, right: 16, position: "absolute", zIndex: 50 }}
    >
      <MotiView
        from={{ backgroundColor: "#ef4444" }}
        animate={{ backgroundColor: "#ef4444" }}
        className="flex-row items-center gap-2 rounded-full px-4 py-2"
      >
        <MaterialIcons name="error-outline" size={14} color="white" />
        <Text className="text-white text-sm font-semibold">{message}</Text>
        <TouchableOpacity onPress={() => setError(false)} activeOpacity={0.7}>
          <AntDesign name="close" size={14} color="white" />
        </TouchableOpacity>
      </MotiView>
    </MotiView>
  );
};

export default ErrorMessage;