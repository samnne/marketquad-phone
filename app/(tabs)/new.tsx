import { ErrorBoundary } from "@/components/ErrorBoundary";
import ListingFormPage from "@/components/Listings/ListingFormPage";
import { useLocalSearchParams } from "expo-router";

import { KeyboardAvoidingView, Platform } from "react-native";

const NewPage = () => {
  const params = useLocalSearchParams<{ type: "edit" | "new" }>();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ListingFormPage type={params.type === "edit" ? "edit" : "new"} />
    </KeyboardAvoidingView>
  );
};

export default function NewEdit() {
  return (
    <ErrorBoundary>
      <NewPage />
    </ErrorBoundary>
  );
}
