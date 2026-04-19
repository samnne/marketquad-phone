import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { colors } from "@/constants/theme";
import { useUser } from "@/store/zustand";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "SCAM", label: "Scam or Fraud" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "FAKE_LISTING", label: "Fake Listing" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
  { value: "OTHER", label: "Other" },
];

interface Props {
  targetUserId: string;
  targetName: string;
  bottomSheetRef: React.RefObject<BottomSheet> | null;
  onClose: () => void;
}

export function ReportUserSheet({
  targetUserId,
  targetName,
  bottomSheetRef,
  onClose,
}: Props) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useUser();
  const handleSubmit = async () => {
    if (!selectedReason)
      return Alert.alert(
        "Select a reason",
        "Please choose a reason before submitting.",
      );

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/reports`,
        {
          method: "POST",

          headers: {
            Authorization: user.id!,
          },
          body: JSON.stringify({
            targetUserId,
            reason: selectedReason,
            description,
          }),
        },
      );

      if (res.status === 409) {
        Alert.alert(
          "Already Reported",
          "You already have a pending report for this user.",
        );
        return;
      }
     
      if (!res.ok) throw new Error();

      Alert.alert("Report Submitted", "Our team will review it shortly.");
      onClose();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={["60%", "92%"]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        borderRadius: 32,
        backgroundColor: colors.background,
        shadowRadius: 8,
        shadowColor: colors.accent,
        shadowOpacity: 0.1,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.accent, width: 40 }}
    >
      <BottomSheetScrollView contentContainerClassName="px-6 pb-12 gap-4">
        {/* Header */}
        <View className="items-center mb-2">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: "#e6f4ef" }}
          >
            <Text className="text-2xl">🚩</Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Report User
          </Text>
          <Text
            className="text-sm mt-1 text-center"
            style={{ color: "#6b9e8f" }}
          >
            You're reporting{" "}
            <Text className="font-semibold" style={{ color: colors.primary }}>
              {targetName}
            </Text>
          </Text>
        </View>

        {/* Reason */}
        <View className="p-4 gap-2">
          <Text
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6b9e8f" }}
          >
            Reason
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {REASONS.map((r) => {
              const selected = selectedReason === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setSelectedReason(r.value)}
                  activeOpacity={0.75}
                  className="px-4 py-2.5 rounded-full border-2"
                  style={{
                    borderColor: selected ? colors.accent : "#d4ece4",
                    backgroundColor: selected ? "#fdf0f3" : colors.pill,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: selected ? colors.accent : colors.text,
                      fontWeight: selected ? "600" : "400",
                    }}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6b9e8f" }}
          >
            Details{" "}
            <Text className="normal-case tracking-normal font-normal">
              (optional)
            </Text>
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-sm min-h-28 border-2 text-top"
            style={{
              borderColor: "#d4ece4",
              backgroundColor: colors.pill,
              color: colors.text,
              textAlignVertical: "top",
            }}
            placeholder="Describe the issue..."
            placeholderTextColor="#6b9e8f"
            multiline
            maxLength={500}
            value={description}
            onChangeText={setDescription}
          />
          <Text
            className="text-xs text-right -mt-2"
            style={{ color: "#6b9e8f" }}
          >
            {description.length}/500
          </Text>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedReason || loading}
            activeOpacity={0.85}
            className="py-4 rounded-2xl items-center mt-2"
            style={{
              backgroundColor:
                !selectedReason || loading ? "#d4ece4" : colors.primary,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.pill} />
            ) : (
              <Text
                className="text-base font-bold"
                style={{ color: colors.pill }}
              >
                Submit Report
              </Text>
            )}
          </TouchableOpacity>

          <Text
            className="text-xs text-center leading-5"
            style={{ color: "#6b9e8f" }}
          >
            Reports are reviewed within 24–48 hours. False reports may result in
            account action.
          </Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
