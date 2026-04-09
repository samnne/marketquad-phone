import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import clsx from "clsx";
import { supabase } from "@/supabase/authHelper";
import { signUpUser } from "@/supabase/supabase";
import { getUserSupabase, matchUVIC } from "@/utils/functions";
import { useMessage, useType, useUser } from "@/store/zustand";

import { colors } from "@/constants/theme";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BASE_URL } from "@/constants/constants";

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
  const otpRefs = useRef<(TextInput | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

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
        router.replace("/");
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

  // ── Handlers ──
  const handleLogin = async () => {
    setLoadingLogin(true);
    try {
      if (!formData.email || !matchUVIC(formData.email)) {
        setError(true);
        return;
      }
      const user = await supabase
        .from("User")
        .select("*")
        .eq("email", formData.email);
      console.log(user.error);
      if (user.data && user.data[0]?.isVerified) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) {
          console.log(formData.email, formData.password)
          setError(true);
          setMessage("Email or Password is incorrect");
          console.log(error)
          return;
        }
        return router.push("/(tabs)/profile");
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        console.log(error);
        setError(true);
        setMessage("Email or Password is incorrect");
        return;
      }
      handleLogin()
    } catch (err) {
      console.error(err);
      setError(true);
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
        return;
      }
      const { error } = await signUpUser(email, password, name);
      if (error) {
        setError(true);
        return;
      }
      changeType("otp");
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoadingSignup(false);
    }
  };

  const handleOTP = async () => {
    if (counter !== 0 || !otp || otp.length !== 6) {
      setError(true);
      return;
    }
    if (!formData.email) {
      setError(true);
      return;
    }

    setLoadingOtp(true);
    let veriUser;
    try {
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: "email",
      });

      if (error || !supabaseUser) throw new Error("Invalid OTP");

      // 2. Sync with your Backend
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "PUT",
        body: JSON.stringify({ uid: supabaseUser.id }),
      }).then((r) => r.json());

      if (!res.success) {
        setError(true);
        return;
      }

      // 3. Update Zustand with BOTH Auth and DB data
      // Assuming 'res.user' or 'res.app_user' contains your DB record
      setUser({ ...supabaseUser, app_user: res.app_user });

      // 4. Navigate ONLY after state is set
      setSuccess(true);
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoadingOtp(false);
    }
  };
  // router.push('/profile')
  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: `${process.env.EXPO_PUBLIC_BASE_URL}/update-password`,
      },
    );
    if (error) {
      setError(true);
      console.error(error);
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
              We've sent a verification code to your UVic address
            </Text>
          </View>

          {/* OTP input boxes */}
          <View className="flex-row justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const isFocused = otp.length === i;
              const borderClass = isFocused
                ? "border-primary"
                : "border-secondary/50";

              return (
                <View key={i} className="flex-row items-center">
                  {i === 3 && (
                    <Text className="text-secondary text-lg mx-1">—</Text>
                  )}
                  <TextInput
                    ref={(el) => (otpRefs.current[i] = el)}
                    style={[
                      otpStyles.box,
                      otp.length === i
                        ? otpStyles.focused
                        : otpStyles.unfocused,
                    ]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={otp[i] ?? ""}
                    autoFocus={i === 0}
                    onChangeText={(val) => {
                      const clean = val.replace(/\D/g, "");

                      // Update OTP string
                      const digits = otp.split("");
                      digits[i] = clean;
                      const next = digits.join("").slice(0, 6);
                      setOTP(next);

                      // Advance to next box
                      if (clean && i < 5) {
                        otpRefs.current[i + 1]?.focus();
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      // On backspace, go back to previous box
                      if (nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
                        const digits = otp.split("");
                        digits[i - 1] = "";
                        setOTP(digits.join(""));
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                  />
                </View>
              );
            })}
          </View>

          {/* Confirm button */}
          <SpringButton
            onPress={handleOTP}
            disabled={loadingOtp}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            {loadingOtp ? (
              <ActivityIndicator color={colors.pill} />
            ) : (
              <Text className="text-pill font-bold text-base">Confirm</Text>
            )}
          </SpringButton>

          {/* Resend */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-secondary font-light text-sm">
              Send another OTP
            </Text>
            <Pressable
              onPress={() => {
                if (counter === 0) setCounter(60);
                handleLogin();
              }}
              className="bg-accent/50 px-3 py-1.5 rounded-lg"
              disabled={counter > 0}
            >
              <Text className="text-pill font-bold text-sm">
                {counter > 0 ? `Resend (${counter})` : "Resend"}
              </Text>
            </Pressable>
          </View>

          {/* Back to login */}
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
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: colors.pill,
    color: colors.text,
  },
  focused: {
    borderColor: colors.primary,
  },
  unfocused: {
    borderColor: colors.secondary + "80",
  },
});
