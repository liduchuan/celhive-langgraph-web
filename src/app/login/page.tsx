
'use client';
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";
import { useRouter } from "next/navigation";

const LoginButton = () => {
  const router = useRouter();
  return (
    <EmailLoginForm
      onLoginSuccess={() => router.replace('/chat')}
    />
  );
};

export default LoginButton;
