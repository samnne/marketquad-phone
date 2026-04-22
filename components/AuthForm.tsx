import { useMessage, useType, useUser } from "@/store/zustand";
import { supabase } from "@/supabase/authHelper";
import { signUpUser } from "@/supabase/supabase";
import { getUserSupabase, matchUVIC } from "@/utils/functions";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors } from "@/constants/theme";
import { BASE_URL } from "@/constants/constants";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LoginUserForm {
  email: string;
  password: string;
  name: string;
}

// ─────────────────────────────────────────────
// Reusable field wrapper
// ─────────────────────────────────────────────
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>{label}</Text>
    {children}
  </View>
);

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.secondary,
    paddingHorizontal: 2,
  },
});

// ─────────────────────────────────────────────
// Spring button
// ─────────────────────────────────────────────
const SpringButton = ({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[animStyle, style, disabled && { opacity: 0.55 }]}
      onPressIn={() => (scale.value = withSpring(0.94, { stiffness: 500 }))}
      onPressOut={() => (scale.value = withSpring(1, { stiffness: 500 }))}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </AnimatedPressable>
  );
};

// ─────────────────────────────────────────────
// Main AuthForm — AUTH LOGIC UNCHANGED
// ─────────────────────────────────────────────
const AuthForm = ({ type }: { type: "sign-in" | "sign-up" | "otp" }) => {
  const router = useRouter();
  const { setError, setSuccess, setMessage } = useMessage();
  const { setUser } = useUser();
  const { changeType } = useType();
  const inputRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOTP] = useState("");
  const [loggingIn, setLoggingIn] = useState(false)
  const [counter, setCounter] = useState(0);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [formData, setFormData] = useState<LoginUserForm>({
    email: "",
    password: "",
    name: "",
  });

  // ── Mount: check existing session ──
  useEffect(() => {
    const mountSession = async () => {
      const { user, app_user } = await getUserSupabase();
      if (user) {
        setUser({ ...user, app_user });
        router.replace("/home");
      }
    };
    mountSession();
  }, []);

  // ── OTP resend countdown ──
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendOTP = async (val = false) => {
    if (!formData.email) {
      setError(true);
      setMessage("Email is required.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: { shouldCreateUser: val, data: { name: formData.name } },
      });
      if (error) {
        setError(true);
        setMessage("Failed to send OTP. Please try again.");
        return;
      }
      changeType("otp");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    setLoadingLogin(true);
    setLoggingIn(true)
    try {
      if (!formData.email || !matchUVIC(formData.email)) {
        setError(true);
        setMessage("Please enter a valid UVic email address.");
        return;
      }
      const { data: userData } = await supabase
        .from("User")
        .select("*")
        .eq("email", formData.email)
        .single();
      if (!userData) {
        setError(true);
        setMessage("User doesn't match our records.");
        return;
      }
      console.log(userData)
      if (userData?.isVerified) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) {
          setError(true);
          setMessage(error.message);
          return;
        }
        return router.replace("/(tabs)/profile");
      }
      await sendOTP();
      setCounter(60);
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("An unexpected error occurred during login.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleSignUp = async () => {
    setLoadingSignup(true);
    try {
      const { email, password, name } = formData;
      if (!email || !password || !name) {
        setError(true);
        setMessage("Please fill in all required fields.");
        return;
      }
      if (!matchUVIC(email)) {
        setError(true);
        setMessage("Please use a valid UVic email address.");
        return;
      }
      await sendOTP(true);
      setCounter(60);
      changeType("otp");
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("An unexpected error occurred during sign up.");
    } finally {
      setLoadingSignup(false);
    }
  };

  const handleOTP = async () => {
    const email = formData.email;
    const name = formData.name;
    if (!otp || otp.length !== 6) {
      setError(true);
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }
    if (!email) {
      setError(true);
      setMessage("Email is required.");
      return;
    }
    setLoadingOtp(true);
    try {
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (error || !supabaseUser) {
        setError(true);
        setMessage("No User");
        return;
      }
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: supabaseUser.id, email, name }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(true);
        setMessage("Verification failed. Please try again.");
        return;
      }
      setUser({ ...supabaseUser, app_user: res.app_user });
      setSuccess(true);
      setMessage("Verification successful!");
      if (loggingIn){
        router.replace("/home");
      } else {
        router.push('/onboarding')
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("Invalid OTP. Please try again.");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${process.env.EXPO_PUBLIC_BASE_URL}/update-password`,
    });
    if (error) {
      setError(true);
      setMessage("Failed to send password reset email.");
    } else {
      setSuccess(true);
      setMessage("Password reset email sent.");
    }
  };

  const handleSubmit = () => {
    type === "sign-in" ? handleLogin() : handleSignUp();
  };

  // ─── OTP View ───────────────────────────────
  if (type === "otp") {
    return (
      <ScrollView
        contentContainerStyle={s.otpScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.otpContainer}>
          {/* Header */}
          <View style={s.otpHeader}>
            <Text style={s.otpTitle}>Check your inbox</Text>
            <Text style={s.otpSubtitle}>
              A 6-digit code was sent to your UVic address
            </Text>
          </View>

          {/* OTP digit boxes */}
          <Pressable onPress={() => inputRef.current?.focus()} style={s.otpBoxRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={s.otpBoxGroup}>
                {i === 3 && <View style={s.otpSpacer} />}
                <View
                  style={[
                    s.otpBox,
                    otp.length === i
                      ? s.otpBoxFocused
                      : otp.length > i
                      ? s.otpBoxFilled
                      : s.otpBoxEmpty,
                  ]}
                >
                  <Text style={s.otpDigit}>{otp[i] ?? ""}</Text>
                </View>
              </View>
            ))}

            {/* Hidden real input */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(val) => {
                const clean = val.replace(/\D/g, "").slice(0, 6);
                setOTP(clean);
                if (clean.length === 6) inputRef.current?.blur();
              }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              style={s.hiddenInput}
              caretHidden
              maxLength={6}
            />
          </Pressable>

          {/* Confirm button */}
          <SpringButton
            onPress={handleOTP}
            disabled={loadingOtp || otp.length < 6}
            style={s.primaryBtn}
          >
            {loadingOtp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Confirm</Text>
            )}
          </SpringButton>

          {/* Resend row */}
          <View style={s.resendRow}>
            <Text style={s.resendLabel}>Didn't receive it?</Text>
            <Pressable
              onPress={async () => {
                if (counter > 0) return;
                setCounter(60);
                await sendOTP();
              }}
              disabled={counter > 0}
              style={[s.resendBtn, counter > 0 && s.resendBtnDisabled]}
            >
              <Text style={[s.resendBtnText, counter > 0 && s.resendBtnTextDisabled]}>
                {counter > 0 ? `Resend in ${counter}s` : "Resend"}
              </Text>
            </Pressable>
          </View>

          {/* Back */}
          <Pressable onPress={() => changeType("sign-in")} style={s.backBtn}>
            <FontAwesome6 name="arrow-left" size={12} color={colors.secondary} />
            <Text style={s.backBtnText}>Back to sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ─── Sign-in / Sign-up View ──────────────────
  const isSignIn = type === "sign-in";
  const loading = loadingLogin || loadingSignup;

  return (
    <View style={s.formContainer}>
      {type === "sign-up" && (
        <Field label="Full name">
          <TextInput
            style={s.input}
            placeholder="Jane Smith"
            placeholderTextColor={colors.secondary + "80"}
            value={formData.name}
            onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
            autoCapitalize="words"
          />
        </Field>
      )}

      <Field label="Email">
        <View style={s.inputWrapper}>
          <TextInput
            style={[s.input, s.inputWithIcon]}
            placeholder="netlink@uvic.ca"
            placeholderTextColor={colors.secondary + "80"}
            value={formData.email}
            onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FontAwesome6
            name="envelope"
            size={14}
            color={colors.secondary}
            style={s.inputIcon}
          />
        </View>
      </Field>

      <Field label="Password">
        <View style={s.inputWrapper}>
          <TextInput
            style={[s.input, s.inputWithIcon]}
            placeholder="••••••••"
            placeholderTextColor={colors.secondary + "80"}
            value={formData.password}
            onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowPassword((p) => !p)}
            style={s.inputIcon}
            hitSlop={8}
          >
            <FontAwesome6
              name={showPassword ? "eye-slash" : "eye"}
              size={14}
              color={colors.secondary}
            />
          </Pressable>
        </View>
      </Field>

      {/* Forgot password */}
      {isSignIn && (
        <Pressable onPress={handleForgotPassword} style={s.forgotBtn}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </Pressable>
      )}

      {/* Primary action */}
      <SpringButton
        onPress={handleSubmit}
        disabled={loading}
        style={[s.primaryBtn, { marginTop: 4 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryBtnText}>
            {isSignIn ? "Sign in" : "Create account"}
          </Text>
        )}
      </SpringButton>

      {/* Toggle sign-in / sign-up */}
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>
          {isSignIn ? "New to the app?" : "Already have an account?"}
        </Text>
        <Pressable
          onPress={() => changeType(isSignIn ? "sign-up" : "sign-in")}
          hitSlop={8}
        >
          <Text style={s.toggleLink}>
            {isSignIn ? "Sign up" : "Sign in"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AuthForm;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const INPUT_HEIGHT = 52;
const RADIUS = 14;

const s = StyleSheet.create({
  // ── Form layout ──
  formContainer: {
    gap: 16,
  },

  // ── Inputs ──
  input: {
    height: INPUT_HEIGHT,
    borderWidth: 1.5,
    borderColor: colors.secondary + "30",
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.pill,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  inputIcon: {
    position: "absolute",
    right: 16,
  },

  // ── Buttons ──
  primaryBtn: {
    height: INPUT_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: colors.pill,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Forgot password ──
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: colors.secondary,
    textDecorationLine: "underline",
  },

  // ── Toggle row ──
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 13,
    color: colors.secondary,
  },
  toggleLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  // ── OTP ──
  otpScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  otpContainer: {
    gap: 28,
  },
  otpHeader: {
    gap: 8,
  },
  otpTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  otpSubtitle: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
  },
  otpBoxRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  otpBoxGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  otpSpacer: {
    width: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 2,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pill,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: colors.secondary + "60",
  },
  otpBoxEmpty: {
    borderColor: colors.secondary + "30",
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },

  // ── Resend ──
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  resendLabel: {
    fontSize: 13,
    color: colors.secondary,
  },
  resendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  resendBtnDisabled: {
    backgroundColor: colors.secondary + "20",
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.pill,
  },
  resendBtnTextDisabled: {
    color: colors.secondary,
  },

  // ── Back button ──
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    color: colors.secondary,
  },
});