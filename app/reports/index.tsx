import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { colors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessage, useType, useUser } from "@/store/zustand";
import { useRouter } from "expo-router";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; emoji: string }
> = {
  PENDING: { label: "Pending", color: "#92620a", bg: "#fef3e2", emoji: "🕐" },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "#1a4fa8",
    bg: "#e8f0fe",
    emoji: "🔍",
  },
  RESOLVED: { label: "Resolved", color: "#166534", bg: "#dcfce7", emoji: "✅" },
  DISMISSED: {
    label: "Dismissed",
    color: "#6b7280",
    bg: "#f3f4f6",
    emoji: "✗",
  },
};

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  SCAM: "Scam or Fraud",
  HARASSMENT: "Harassment",
  FAKE_LISTING: "Fake Listing",
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  OTHER: "Other",
};

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  adminNote?: string;
  targetUser: { id: string; name: string };
}

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const {setError, setMessage} = useMessage()
  const { user } = useUser();
  const {changeType} = useType()
  const router = useRouter()
  const fetchReports = async () => {
    if (!user) {
        setError(true)
        changeType("sign-in")
        setMessage("Please Sign In.")
        router.replace("/sign-in")
        return
    }
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/reports`,
        {
          method: "get",
          headers: {
            Authorization: user.id,
          },
        },
      );
      const data = await res.json();
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-10 gap-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchReports();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View
            className="mb-2 pb-4 border-b"
            style={{ borderBottomColor: "#d4ece4" }}
          >
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              My Reports
            </Text>
            <Text className="text-sm mt-1" style={{ color: "#6b9e8f" }}>
              {reports.length} report{reports.length !== 1 ? "s" : ""} filed
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-16 gap-3">
            <Text className="text-5xl">🏳️</Text>
            <Text
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              No reports yet
            </Text>
            <Text
              className="text-sm text-center px-8 leading-5"
              style={{ color: "#6b9e8f" }}
            >
              Reports you file will appear here with live status updates.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
          const date = new Date(item.createdAt).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return (
            <View
              className="rounded-2xl p-4 gap-3"
              style={{
                backgroundColor: colors.pill,
                shadowColor: colors.text,
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              {/* Card header */}
              <View className="flex-row items-center gap-3">
                {/* Avatar */}
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#e6f4ef" }}
                >
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.primary }}
                  >
                    {item.targetUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Name + date */}
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                  >
                    {item.targetUser.name}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: "#6b9e8f" }}>
                    {date}
                  </Text>
                </View>

                {/* Status badge */}
                <View
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: status.bg }}
                >
                  <Text className="text-xs">{status.emoji}</Text>
                  <Text
                    className="text-xs font-bold"
                    style={{ color: status.color }}
                  >
                    {status.label}
                  </Text>
                </View>
              </View>

              {/* Reason chip */}
              <View
                className="self-start px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: "#e6f4ef", borderColor: "#d4ece4" }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: "#6b9e8f" }}
                >
                  {REASON_LABELS[item.reason] ?? item.reason}
                </Text>
              </View>

              {/* Admin note */}
              {item.adminNote && (
                <View
                  className="rounded-xl p-3 border-l-4"
                  style={{
                    backgroundColor: "#f5f0fa",
                    borderLeftColor: colors.secondary,
                  }}
                >
                  <Text
                    className="text-xs font-bold mb-1"
                    style={{ color: colors.secondary }}
                  >
                    📋 Admin note
                  </Text>
                  <Text
                    className="text-sm leading-5"
                    style={{ color: colors.text }}
                  >
                    {item.adminNote}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

