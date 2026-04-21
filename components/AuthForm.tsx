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

const AuthForm = ({ type }: { type: "sign-in" | "sign-up" | "otp" }) => {
  const router = useRouter();
  const { setError, setSuccess, setMessage } = useMessage();
  const { setUser } = useUser();
  const { changeType } = useType();
  const inputRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOTP] = useState("");
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

        options: {
          shouldCreateUser: val,
          data: {
            name: formData.name,
          },
        },
      });
      if (error) {
        setError(true);
        setMessage("Failed to send OTP. Please try again.");
        return 
      }
      changeType("otp");
    } catch (err) {
      console.error(err);
    }
  };

  // ── Handlers ──
  const handleLogin = async () => {
    setLoadingLogin(true);
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
      if (!userData){
        
        setError(true);
        setMessage("User doesn't match our records.");
        return;
      }
      if (userData?.isVerified) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) {
          setError(true);
          setMessage("Email or Password is incorrect");
          return;
        }
        return router.replace("/(tabs)/profile");
      }

      // unverified — send OTP then go to OTP screen
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

      await sendOTP(true); // shouldCreateUser: true — only on sign-up
      setCounter(60);
      changeType("otp"); // ← this was missing
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
      } = await supabase.auth.verifyOtp({
        email: formData.email,

        token: otp,
        type: "email",
      });

      if (error || !supabaseUser) {
        setError(true);
        setMessage("No User");
        return;
      }

      // 2. Sync with your Backend
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: supabaseUser.id,
          email: email,
          name: name,
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(true);
        setMessage("Verification failed. Please try again.");
        return;
      }

      // 3. Update Zustand with BOTH Auth and DB data
      // Assuming 'res.user' or 'res.app_user' contains your DB record
      setUser({ ...supabaseUser, app_user: res.app_user });

      // 4. Navigate ONLY after state is set
      setSuccess(true);
      setMessage("Verification successful!");
      router.replace("/home");
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage("Invalid OTP. Please try again.");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: `${process.env.EXPO_PUBLIC_BASE_URL}/update-password`,
      },
    );
    if (error) {
      setError(true);
      setMessage("Failed to send password reset email.");
      console.error(error);
    } else {
      setSuccess(true);
      setMessage("Password reset email sent.");
    }
  };

  const handleSubmit = () => {
    type === "sign-in" ? handleLogin() : handleSignUp();
  };

  // ── OTP View ──
  if (type === "otp") {
    return (
      <ScrollView
        contentContainerClassName="flex-grow justify-center gap-6 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-4xl font-bold text-text">
              Verification Code
            </Text>
            <Text className="text-sm text-secondary font-light">
              We&apos;ve sent a verification code to your UVic address
            </Text>
          </View>

          {/* ── OTP boxes (visual) + single hidden real input ── */}
          <Pressable onPress={() => inputRef.current?.focus()}>
            <View className="flex-row justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="flex-row items-center">
                  {i === 3 && (
                    <Text className="text-secondary text-lg mx-1">—</Text>
                  )}
                  <View
                    style={[
                      otpStyles.box,
                      otp.length === i
                        ? otpStyles.focused
                        : otp.length > i
                          ? otpStyles.filled
                          : otpStyles.unfocused,
                    ]}
                  >
                    <Text style={otpStyles.digit}>{otp[i] ?? ""}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Single real input — visually hidden but focusable */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(val) => {
                const clean = val.replace(/\D/g, "").slice(0, 6);
                setOTP(clean);
                if (clean.length === 6) {
                  inputRef.current?.blur();
                }
              }}
              keyboardType="number-pad"
              textContentType="oneTimeCode" // ← triggers Apple SMS autocomplete
              autoComplete="one-time-code" // ← triggers Android/Google autocomplete
              autoFocus
              style={otpStyles.hiddenInput}
              caretHidden
              maxLength={6}
            />
          </Pressable>

          <SpringButton
            onPress={handleOTP}
            disabled={loadingOtp || otp.length < 6}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            {loadingOtp ? (
              <ActivityIndicator color={colors.pill} />
            ) : (
              <Text className="text-pill font-bold text-base">Confirm</Text>
            )}
          </SpringButton>

          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-secondary font-light text-sm">
              Send another OTP
            </Text>
            <Pressable
              onPress={async () => {
                if (counter > 0) return;
                setCounter(60);
                await sendOTP();
              }}
              className="bg-accent/50 px-3 py-1.5 rounded-lg"
              disabled={counter > 0}
            >
              <Text className="text-pill font-bold text-sm">
                {counter > 0 ? `Resend (${counter})` : "Resend"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => changeType("sign-in")}
            className="self-center bg-secondary/30 mt-2 px-4 py-2 rounded-2xl"
          >
            <Text className="text-text text-sm">Go back to Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Login / Sign up View ──
  return (
    <View className="gap-4">
      {/* Name field (sign-up only) */}
      {type === "sign-up" && (
        <View className="gap-1">
          <Text className="font-bold text-text px-1">Name</Text>
          <TextInput
            className="w-full p-4 border border-secondary/50 rounded-xl bg-pill text-text"
            placeholder="Name"
            placeholderTextColor={colors.secondary}
            value={formData.name}
            onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
            autoCapitalize="words"
          />
        </View>
      )}

      {/* Email */}
      <View className="gap-1">
        <Text className="font-bold text-text px-1">Email</Text>
        <View className="relative">
          <TextInput
            className="w-full p-4 border border-secondary/50 rounded-xl bg-pill text-text pr-12"
            placeholder="...@uvic.ca"
            placeholderTextColor={colors.secondary}
            value={formData.email}
            onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text className="absolute right-4 top-4 text-secondary text-lg">
            ✉
          </Text>
        </View>
      </View>

      {/* Password */}
      <View className="gap-1">
        <Text className="font-bold text-text px-1">Password</Text>
        <View className="relative">
          <TextInput
            className="w-full p-4 border border-secondary/50 rounded-xl bg-pill text-text pr-12"
            placeholder="Password"
            placeholderTextColor={colors.secondary}
            value={formData.password}
            onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowPassword((p) => !p)}
            className="absolute right-4 top-4"
          >
            <Text className="text-secondary text-lg">
              {showPassword ? (
                <FontAwesome6 name="eye-slash" size={15} color="black" />
              ) : (
                <FontAwesome6 name="eye" size={15} color="black" />
              )}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Submit + switch */}
      <View className="flex-row items-center justify-center gap-3 mt-2">
        <SpringButton
          onPress={handleSubmit}
          disabled={loadingLogin || loadingSignup}
          className="bg-primary px-6 py-2.5 rounded-xl"
        >
          {loadingLogin || loadingSignup ? (
            <ActivityIndicator color={colors.pill} size="small" />
          ) : (
            <Text className="text-pill font-bold text-sm">
              {type === "sign-in" ? "Sign In" : "Sign Up"}
            </Text>
          )}
        </SpringButton>

        <Pressable
          onPress={() => changeType(type === "sign-in" ? "sign-up" : "sign-in")}
          className="bg-secondary/30 px-4 py-2.5 rounded-xl"
        >
          <Text className="text-text text-sm">
            {type === "sign-in" ? "Sign Up" : "Sign In"}
          </Text>
        </Pressable>
      </View>

      {/* Forgot password */}
      <Pressable onPress={handleForgotPassword} className="self-center mt-1">
        <Text className="text-secondary text-sm border-b border-secondary">
          Forgot Password
        </Text>
      </Pressable>
    </View>
  );
};

const SpringButton = ({
  children,
  onPress,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => {
        scale.value = withSpring(0.9, { stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400 });
      }}
      onPress={onPress}
      disabled={disabled}
      className={`${className} ${disabled ? "opacity-60" : ""}`}
    >
      {children}
    </AnimatedPressable>
  );
};

export default AuthForm;
const otpStyles = StyleSheet.create({
  box: {
    width: 44,
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pill,
  },
  digit: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  focused: {
    borderColor: colors.primary,
  },
  filled: {
    borderColor: colors.secondary + "80",
  },
  unfocused: {
    borderColor: colors.secondary + "40",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
