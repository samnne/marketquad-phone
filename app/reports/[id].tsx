import { View, Text } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView as RNSAV } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { ReportUserSheet } from "@/components/ReportUserSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
const SafeAreaView = styled(RNSAV);
const NEWREPORTPAGE = () => {
  const ref = useRef<BottomSheet>(null);
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const name = params.name as string | undefined;
  const type = params.type as string | undefined;
  const router = useRouter()
  const [reportModal, setReportModal] = useState(true);
  function openReportModal(val: boolean) {
    setReportModal(val);
  }

  useEffect(()=>{
    if(!reportModal){
      router.back()
    }
  }, [reportModal, router])
  return (
    <SafeAreaView className="flex-1 items-center ">
      <View className="pt-5">
        <Text className="text-2xl font-semibold text-text">Pull down to go back.</Text>
        <Text className="text-sm text-center text-text">Trust me lol.</Text>
      </View>
      {reportModal && (
        <ReportUserSheet
          targetName={name?.split(" ")[0]!}
          targetUserId={id!}
          onClose={() => openReportModal(false)}
          bottomSheetRef={ref}
          itemReported={{ id: id!, item: type! }}
        />
      )}
    </SafeAreaView>
  );
};

export default NEWREPORTPAGE;
