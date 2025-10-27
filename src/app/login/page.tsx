
'use client';
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";
import { useRouter } from "next/navigation";

const LoginButton = () => {
  const router = useRouter();
  return (
    <EmailLoginForm
      onLoginSuccess={() => {
        const redirectUrl = new URL(window.location.href).searchParams.get('redirect');
        router.replace(redirectUrl || '/chat');
      }}
    />
  );
};

export default LoginButton;
