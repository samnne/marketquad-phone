import { useUser, useMessage } from "@/store/zustand";
import { BASE_URL, YEARS } from "@/constants/constants";
import { colors } from "@/constants/theme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/supabase/authHelper";

import { SectionRow, SpringButton } from "@/components/Onboarding";
import ProfileSection from "@/components/Settings/Profile";
import StudentInfoSection from "@/components/Settings/StudentInfo";
import PreferencesSection from "@/components/Settings/Prefs";
import NotificationsSection from "@/components/Settings/Notification";
import AccountSection from "@/components/Settings/Account";
import AboutSection from "@/components/Settings/Legal";
import DeleteModal from "@/components/Modals/DeleteModal";

type Section =
  | "profile"
  | "student"
  | "preferences"
  | "account"
  | "notifications"
  | "about"
  | null;
type Intent = "buying" | "selling" | "both";

const SettingsPage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
  const [deleteUser, setDeleteUser] = useState(false)
  const { setError, setSuccess, setMessage } = useMessage();
  const u = user?.app_user;

  const [open, setOpen] = useState<Section>(null);
  const toggle = (s: Section) => setOpen((prev) => (prev === s ? null : s));

  // ── Profile state ──
  const [name, setName] = useState(u?.name ?? "");
  const [username, setUsername] = useState(u?.username ?? "");
  const [bio, setBio] = useState(u?.bio ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Student state ──
  const [faculty, setFaculty] = useState<string | null>(u?.faculty ?? null);
  const [year, setYear] = useState<number | null>(u?.year ?? null);
  const [savingStudent, setSavingStudent] = useState(false);

  // ── Preferences state ──
  const [intent, setIntent] = useState<Intent>(u?.intent ?? "both");
  const [categories, setCategories] = useState<string[]>(
    u?.category_interests ?? [],
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // ── Account state ──
  const [savingPw, setSavingPw] = useState(false);

  // ── Notifications state ──
  const [notifMessages, setNotifMessages] = useState(u?.notif_messages ?? true);
  const [notifListings, setNotifListings] = useState(u?.notif_listings ?? true);
  const [notifSales, setNotifSales] = useState(u?.notif_sales ?? true);
  const [savingNotif, setSavingNotif] = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: user?.id ?? "",
  };

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/onboarding/profile`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ name, username, bio }),
      }).then((r) => r.json());
      console.log(res)
      if (!res.success) {
        setError(true);
        setMessage(res.message ?? "Failed to save.");
        return;
      }
      setUser({ ...user, app_user: { ...u, ...res.user } });
      setSuccess(true);
      setMessage("Profile updated.");
    } catch {
      setError(true);
      setMessage("Network error.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveStudent = async () => {
    setSavingStudent(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/onboarding/verification`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ faculty, year }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(true);
        setMessage(res.message ?? "Failed to save.");
        return;
      }
      setUser({ ...user, app_user: { ...u, ...res.user } });
      setSuccess(true);
      setMessage("Student info updated.");
    } catch {
      setError(true);
      setMessage("Network error.");
    } finally {
      setSavingStudent(false);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/onboarding/intent`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ intent }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(true);
        setMessage(res.message ?? "Failed to save.");
        return;
      }
      const secondRes = await fetch(
        `${BASE_URL}/api/users/onboarding/categories`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ categories }),
        },
      ).then((r) => r.json());
      if (!secondRes.success) {
        setError(true);
        setMessage(res.message ?? "Failed to save.");
        return;
      }
      setUser({ ...user, app_user: { ...u, ...res.user } });
      setSuccess(true);
      setMessage("Preferences updated.");
    } catch {
      setError(true);
      setMessage("Network error.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const savePassword = async (newPassword: string) => {
    if (!newPassword) return;
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setError(true);
        setMessage(error.message);
        return;
      }
      setSuccess(true);
      setMessage("Password updated.");
    } catch {
      setError(true);
      setMessage("Network error.");
    } finally {
      setSavingPw(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotif(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/notifications`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          notif_messages: notifMessages,
          notif_listings: notifListings,
          notif_sales: notifSales,
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(true);
        setMessage(res.message ?? "Failed to save.");
        return;
      }
      setUser({ ...user, app_user: { ...u, ...res.user } });
      setSuccess(true);
      setMessage("Notification preferences saved.");
    } catch {
      setError(true);
      setMessage("Network error.");
    } finally {
      setSavingNotif(false);
    }
  };

  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const USERNAME_OK = /^[a-z0-9._]{3,20}$/.test(username);

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* ── Nav bar ── */}
      <View
        className="flex-row items-center gap-3 px-4 pb-3 border-b border-secondary/10"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-8 h-8 rounded-xl bg-secondary/10 items-center justify-center"
        >
          <FontAwesome6 name="arrow-left" size={13} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text flex-1">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-5 gap-3"
      >
        {/* ── Profile ── */}
        <View className="bg-pill rounded-2xl border border-secondary/15 overflow-hidden">
          <SectionRow
            icon="user"
            label="Profile"
            sublabel={u?.username ? `@${u.username}` : u?.name}
            open={open === "profile"}
            onPress={() => toggle("profile")}
            iconBg="bg-primary/10"
          />
          <ProfileSection
            open={open === "profile"}
            name={name}
            username={username}
            bio={bio}
            setName={setName}
            setUsername={setUsername}
            setBio={setBio}
            save={saveProfile}
            loading={savingProfile}
            USERNAME_OK={USERNAME_OK}
          />
        </View>

        {/* ── Student info ── */}
        <View className="bg-pill rounded-2xl border border-secondary/15 overflow-hidden">
          <SectionRow
            icon="graduation-cap"
            label="Student info"
            sublabel={
              [
                u?.year ? YEARS.find((y) => y.value === u.year)?.label : null,
                u?.faculty,
              ]
                .filter(Boolean)
                .join(" · ") || "Not set"
            }
            open={open === "student"}
            onPress={() => toggle("student")}
            iconBg="bg-primary/10"
          />
          <StudentInfoSection
            open={open === "student"}
            faculty={faculty}
            year={year}
            setFaculty={setFaculty}
            setYear={setYear}
            save={saveStudent}
            loading={savingStudent}
          />
        </View>

        {/* ── Preferences ── */}
        <View className="bg-pill rounded-2xl border border-secondary/15 overflow-hidden">
          <SectionRow
            icon="sliders"
            label="Preferences"
            sublabel={`${intent.charAt(0).toUpperCase() + intent.slice(1)} · ${categories.length} categories`}
            open={open === "preferences"}
            onPress={() => toggle("preferences")}
            iconBg="bg-primary/10"
          />
          <PreferencesSection
            open={open === "preferences"}
            intent={intent}
            categories={categories}
            setIntent={setIntent}
            setCategories={setCategories}
            save={savePreferences}
            loading={savingPrefs}
          />
        </View>

        {/* ── Notifications ── */}
        <View className="bg-pill rounded-2xl border border-secondary/15 overflow-hidden">
          <SectionRow
            icon="bell"
            label="Notifications"
            sublabel="Manage what alerts you receive"
            open={open === "notifications"}
            onPress={() => toggle("notifications")}
            iconBg="bg-primary/10"
          />
          <NotificationsSection
            open={open === "notifications"}
            notifMessages={notifMessages}
            notifListings={notifListings}
            notifSales={notifSales}
            setNotifMessages={setNotifMessages}
            setNotifListings={setNotifListings}
            setNotifSales={setNotifSales}
            save={saveNotifications}
            loading={savingNotif}
          />
        </View>

        {/* ── Account ── */}
        <View className="bg-pill rounded-2xl border border-secondary/15 overflow-hidden">
          <SectionRow
            icon="lock"
            label="Account"
            sublabel={user?.email ?? ""}
            open={open === "account"}
            onPress={() => toggle("account")}
            iconBg="bg-primary/10"
          />
          <AccountSection
            open={open === "account"}
            email={user?.email ?? ""}
            save={savePassword}
            loading={savingPw}
            onDeleteAccount={()=>setDeleteUser(true)}
          />
        </View>

        {/* ── About ── */}
        <View className="bg-pill rounded-2xl border border-secondary/15 overflow-hidden">
          <SectionRow
            icon="circle-info"
            label="About"
            sublabel="Legal, version info"
            open={open === "about"}
            onPress={() => toggle("about")}
            iconBg="bg-primary/10"
          />
          <AboutSection open={open === "about"} />
        </View>

        {/* ── Sign out ── */}
        <SpringButton
          onPress={handleSignOut}
          className="h-12 border border-secondary/20 rounded-2xl items-center justify-center flex-row gap-2 mt-1"
        >
          <FontAwesome6
            name="arrow-right-from-bracket"
            size={13}
            color={colors.secondary}
          />
          <Text className="text-sm font-semibold text-secondary">Sign out</Text>
        </SpringButton>

        <View className="h-4" />
      </ScrollView>
      {deleteUser && (
        <DeleteModal
          session={user}
          setDeleteUser={setDeleteUser}
          deleteUser={deleteUser}
        />
      )}
    </View>
  );
};

export default SettingsPage;
