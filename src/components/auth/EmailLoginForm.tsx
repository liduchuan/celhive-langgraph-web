import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/Auth";
import { Loader2, Mail } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface EmailLoginFormProps {
  onLoginSuccess?: () => void;
  className?: string;
}

export const EmailLoginForm: React.FC<EmailLoginFormProps> = ({
  onLoginSuccess,
  className
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch('/api/auth/email/sendCaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type: 1 }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeSent(true);
        setCountdown(60); // 60秒倒计时
        toast.success("验证码已发送", {
          description: `验证码已发送到 ${email}`,
        });
      } else {
        toast.error("发送失败", {
          description: data.msg || "发送验证码失败，请重试",
        });
      }
    } catch (error) {
      console.error('Send captcha error:', error);
      toast.error("发送失败", {
        description: "网络错误，请检查网络连接",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // 登录
  const handleLogin = async () => {
    if (!email.trim() || !code.trim()) {
      toast.error("请填写邮箱和验证码");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/email/regLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          inviteCode: inviteCode.trim()
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        // 创建用户信息（从邮箱推断用户名）
        const username = email.split('@')[0];
        const user = {
          id: `email_${Date.now()}`,
          name: username,
          email: email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=007bff&color=fff`
        };

        // 登录
        login(data.data.token, user);
        onLoginSuccess?.();

        toast.success("登录成功", {
          description: `欢迎回来，${username}！`,
        });
      } else {
        toast.error("登录失败", {
          description: data.msg || "验证码错误或已过期",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("登录失败", {
        description: "网络错误，请检查网络连接",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          登录到 Celhive
        </CardTitle>
        <CardDescription>
          使用邮箱验证码快速登录
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">邮箱地址</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSendingCode || isLoading}
            />
            <Button
              onClick={handleSendCode}
              disabled={isSendingCode || countdown > 0 || !email.trim()}
              variant="outline"
              className="whitespace-nowrap"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发送中
                </>
              ) : countdown > 0 ? (
                `${countdown}s`
              ) : (
                "发送验证码"
              )}
            </Button>
          </div>
        </div>

        {codeSent && (
          <div className="space-y-2">
            <Label htmlFor="code">验证码</Label>
            <Input
              id="code"
              type="text"
              placeholder="请输入6位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              maxLength={6}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="inviteCode">邀请码（可选）</Label>
          <Input
            id="inviteCode"
            type="text"
            placeholder="请输入邀请码"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {codeSent && (
          <Button
            onClick={handleLogin}
            disabled={isLoading || !code.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              "登录"
            )}
          </Button>
        )}

        {!codeSent && (
          <div className="text-center text-sm text-muted-foreground">
            请先发送验证码
          </div>
        )}
      </CardContent>
    </Card>
  );
};
