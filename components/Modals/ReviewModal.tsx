import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/constants/theme";
import { useMessage, useUser } from "@/store/zustand";

import StarRating from "@/components/StarRating";
import { BASE_URL } from "@/constants/constants";

type Props = {
  visible: boolean;
  onClose: () => void;
  otherUser: any;
  isBuyer: boolean;
  role: "BUYER" | "SELLER";
};

const ReviewModal = ({ visible, onClose, otherUser, isBuyer, role }: Props) => {
  const { user } = useUser();
  const { setError, setMessage } = useMessage();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ratingLabel = [
    "Tap a star to rate",
    "Poor",
    "Fair",
    "Good",
    "Great",
    "Excellent!",
  ][rating];

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert("Rating required", "Please select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: user.id,
        },
        body: JSON.stringify({
          rating,
          comment: reviewText,
          revieweeId: otherUser?.uid,
          role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onClose();
        setRating(0);
        setReviewText("");
        Alert.alert("Review submitted", "Thanks for your feedback!");
      } else {
        setError(true);
        setMessage("Review Error");
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("Something went wrong...");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-secondary/15 bg-pill">
          <Text className="text-[17px] font-extrabold text-text">
            Leave a review
          </Text>
          <Pressable
            onPress={handleClose}
            className="w-9 h-9 rounded-[10px] bg-background border border-secondary/25 items-center justify-center"
          >
            <FontAwesome name="times" size={14} color={colors.text} />
          </Pressable>
        </View>

        <View className="p-4 gap-5">
          {/* Who you're reviewing */}
          {otherUser && (
            <View className="flex-row items-center gap-3 bg-pill border border-secondary/25 rounded-[20px] p-4">
              <View className="w-11 h-11 rounded-full bg-secondary items-center justify-center">
                <Text className="text-[15px] font-bold text-text">
                  {otherUser.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View>
                <Text className="text-[14px] font-bold text-text">
                  {otherUser.name}
                </Text>
                <Text className="text-[11px] text-secondary">
                  {isBuyer ? "Seller" : "Buyer"}
                </Text>
              </View>
            </View>
          )}

          {/* Stars */}
          <View className="bg-pill border border-secondary/25 rounded-[20px] p-4 gap-3">
            <Text className="text-[13px] font-medium text-text">
              How was your experience?
            </Text>
            <View className="flex-row justify-center">
              <StarRating value={rating} setValue={setRating} />
            </View>
            <Text className="text-center text-[12px] text-secondary">
              {ratingLabel}
            </Text>
          </View>

          {/* Comment */}
          <View className="gap-1.5">
            <Text className="text-[13px] font-medium text-text px-1">
              Comment (optional)
            </Text>
            <TextInput
              style={styles.textArea}
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Describe your experience…"
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            className={`w-full py-3.5 rounded-2xl items-center ${
              rating > 0 ? "bg-text" : "bg-text/30"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                className={`font-bold text-[15px] ${
                  rating > 0 ? "text-primary" : "text-primary/40"
                }`}
              >
                Submit review
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  textArea: {
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.secondary + "40",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
});

export default ReviewModal;
