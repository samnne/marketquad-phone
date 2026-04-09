import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConvos, useMessage, useUser } from "@/store/zustand";
import { deleteConvo, fetchConvos, getUserSupabase } from "@/utils/functions";
import { getConvos } from "@/lib/conversations.lib";
import { colors, components } from "@/constants/theme";
import { useRefresh } from "@/hooks/useRefresh";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";

const AVATAR_COLORS = [
  { bg: colors.text, text: colors.primary },
  { bg: colors.primary, text: colors.pill },
  { bg: colors.secondary, text: colors.text },
  { bg: colors.accent, text: colors.pill },
  { bg: colors.pill, text: colors.primary, border: colors.secondary },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(date: string | Date) {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(date).toLocaleDateString("en", { weekday: "short" });
}

const ConversationsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomClearance = components.tabBar.height + insets.bottom;

  const { convos, setConvos, setSelectedConvo, removeConvo } = useConvos();
  const { setError } = useMessage();
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useUser();
  const [query, setQuery] = useState("");
  const { refreshing, onRefresh } = useRefresh({
    func: async () => {
      await fetchConvos({ setter: setConvos });
    },
  });
  const getConvosClient = async () => {
    setLoading(true);

    const data = await getUserSupabase();
    if (!data.user) {
      setError(true);
      router.replace("/sign-in");
      return;
    }
    try {
      const tempConvos = await getConvos(data.user.id);
      setConvos(tempConvos);
    } catch (error) {
      setError(true);
      setLoading(false);
    } finally {
      setLoading(false);
      setUser({ user: data.user, app_user: data.app_user });
    }
  };

  useEffect(() => {
    if (convos?.length > 0) {
      setLoading(false);
      return;
    }
    getConvosClient();
  }, []);

  const handleDelete = (cid: string) => {
    Alert.alert(
      "Delete conversation",
      "This will remove the conversation from your inbox. The other person won't be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteConvo(cid, user?.id);
              if (res?.success) {
                removeConvo(cid); // remove from zustand immediately
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
  const filtered = query.trim()
    ? convos?.filter((convo) => {
        const title = convo.listing?.title ?? "";
        const lastMsg = convo.messages?.[convo.messages.length - 1]?.text ?? "";
        return (
          title.toLowerCase().includes(query.toLowerCase()) ||
          lastMsg.toLowerCase().includes(query.toLowerCase())
        );
      })
    : (convos ?? []);

  return (
    <TabScreenWrapper>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: bottomClearance }}
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: insets.top }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Search ── */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="px-4 pt-4 pb-3"
        >
          <View className="bg-pill border border-secondary/50 rounded-2xl px-4 py-2.5 flex-row items-center gap-2.5">
            <Text className="text-text opacity-40 text-base">⌕</Text>
            <TextInput
              className="flex-1 text-[13px] text-text"
              value={query}
              onChangeText={setQuery}
              placeholder="Search conversations…"
              placeholderTextColor={colors.secondary}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Text className="text-secondary text-sm">✕</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── Loading skeletons ── */}
        {loading ? (
          <View>
            {[1, 2, 3, 4].map((n) => (
              <View
                key={n}
                className="flex-row items-center gap-3 px-4 py-3.5 border-b border-secondary/20"
              >
                <View className="w-12 h-12 rounded-full bg-pill border border-secondary/20 opacity-60" />
                <View className="flex-1 gap-2">
                  <View className="h-3 w-2/3 bg-pill rounded-full opacity-60" />
                  <View className="h-2.5 w-1/2 bg-secondary/20 rounded-full opacity-60" />
                </View>
                <View className="h-2.5 w-10 bg-secondary/20 rounded-full opacity-60" />
              </View>
            ))}
          </View>
        ) : filtered?.length > 0 ? (
          <>
            {/* ── Section header ── */}
            <View className="flex-row justify-between items-center px-4 pt-2 pb-2">
              <Text className="text-[11px] font-medium text-secondary uppercase tracking-widest">
                {query.trim()
                  ? `${filtered?.length} result${filtered?.length !== 1 ? "s" : ""}`
                  : "Recent"}
              </Text>
              <Pressable
                onPress={getConvosClient}
                className="w-10 h-10 items-center justify-center"
              >
                <Text className="text-secondary text-lg">↻</Text>
              </Pressable>
            </View>

            {/* ── Convo rows ── */}
            {filtered?.map((convo, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const title = convo.listing?.title || "Unknown listing";
              const initials = getInitials(title);
              const lastMsg = convo.messages?.[convo.messages.length - 1];
              const unread = convo.unreadCount ?? 0;
              const timestamp = convo.updatedAt ?? convo.createdAt;

              return (
                <Animated.View
                  key={convo.cid}
                  entering={FadeInDown.duration(300).delay(i * 80)}
                >
                  <Pressable
                    onLongPress={() => handleDelete(convo.cid)}
                    onPress={() => {
                      setSelectedConvo(convo);
                      router.push(`/convos/${convo.cid}`);
                    }}
                    className="flex-row items-center gap-3 px-4 py-3.5 border-b border-secondary/20 active:bg-secondary/10"
                  >
                    {/* Avatar */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: color.bg,
                        borderWidth: color.border ? 1.5 : 0,
                        borderColor: color.border ?? "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: color.text,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {initials}
                      </Text>
                    </View>

                    {/* Text */}
                    <View className="flex-1 gap-0.5 min-w-0">
                      <Text
                        className="text-[14px] font-semibold text-text"
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      <Text
                        className="text-[12px] text-secondary"
                        numberOfLines={1}
                      >
                        {lastMsg?.text ?? "Most recent message"}
                      </Text>
                    </View>

                    {/* Timestamp + unread */}
                    <View className="items-end gap-1 shrink-0">
                      <Text className="text-[11px] text-secondary/70">
                        {timeAgo(timestamp)}
                      </Text>
                      {unread > 0 ? (
                        <View className="w-5 h-5 bg-primary rounded-full items-center justify-center">
                          <Text className="text-[10px] font-bold text-text">
                            {unread}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-[11px] text-secondary/50">
                          Delivered
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        ) : (
          /* ── Empty state ── */
          <View className="items-center justify-center px-6 py-20 gap-4">
            <View className="w-14 h-14 bg-secondary/20 rounded-2xl items-center justify-center">
              <Text className="text-2xl">💬</Text>
            </View>
            <Text className="text-[14px] text-secondary text-center leading-relaxed">
              {query.trim()
                ? `No conversations match "${query}".`
                : "No conversations yet."}
            </Text>
            <Pressable
              onPress={() =>
                query.trim() ? setQuery("") : router.push("/listings")
              }
              className="mt-1"
            >
              <Text className="text-text font-semibold underline text-[13px]">
                {query.trim() ? "Clear search" : "Browse listings"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </TabScreenWrapper>
  );
};

export default ConversationsScreen;
