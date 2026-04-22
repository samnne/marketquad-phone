
import { styled } from "nativewind";
import React from "react";
import { Text } from "react-native";
import {
  SafeAreaView as RNSAV,

} from "react-native-safe-area-context";

import { db } from "@/db/db";
import { Redirect } from "expo-router";

const SafeAreaView = styled(RNSAV);


const ONBOARDING_KEY = "ONBOARDING";
const ONBOARDING_VALUE = "true";

const Index = () => {
  

  const val = db.getItem(ONBOARDING_KEY);
  if (val === ONBOARDING_VALUE) {
    return <Redirect href={"/home"} />;
  }

 
  return (
    <SafeAreaView>
      <Text>Hmm...</Text>
    </SafeAreaView>
  );
};

export default Index;
