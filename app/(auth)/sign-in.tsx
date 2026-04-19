
import React from "react";

import { useType } from "@/store/zustand";
import AuthForm from "@/components/AuthForm";


const SignIn = () => {
  const { type } = useType();
 
  return <AuthForm type={type} />;
};

export default SignIn;
