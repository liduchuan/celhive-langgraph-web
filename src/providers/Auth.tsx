'use client'
import { logout as logoutAction } from '@/action/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "celhive:auth:token";
const USER_STORAGE_KEY = "celhive:auth:user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 检查Token是否过期
  const isTokenExpired = (token: string): boolean => {
    try {
      // 尝试解析JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < currentTime;
    } catch {
      // 如果不是JWT格式，假设不过期
      return false;
    }
  };

  // 从localStorage恢复认证状态
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUser) {
        // 检查token是否过期
        if (isTokenExpired(storedToken)) {
          console.log("Token已过期，清除认证状态");
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          toast.error("登录已过期", {
            description: "请重新登录",
          });
          return;
        }

        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Failed to restore auth state:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (token: string, user: User) => {
    try {
      // 验证token格式
      if (!token || typeof token !== 'string') {
        throw new Error("无效的Token格式");
      }

      // 验证用户信息
      if (!user || !user.id || !user.name || !user.email) {
        throw new Error("用户信息不完整");
      }

      localStorage.setItem(AUTH_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success("登录成功", {
        description: `欢迎回来，${user.name}！`,
      });
    } catch (error) {
      console.error("Failed to save auth state:", error);
      const errorMessage = error instanceof Error ? error.message : "登录过程中发生未知错误";
      toast.error("登录失败", {
        description: errorMessage,
      });
    }
  };

  const logout = async () => {
    try {
      // 调用 server action 删除服务端 cookie
      await logoutAction();

      // 清除本地存储
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);

      // 更新状态
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast.success("已退出登录");
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to clear auth state:", error);
      toast.error("退出登录失败");
    }
  };

  const setToken = (token: string) => {
    setAuthState(prev => ({
      ...prev,
      token,
      isAuthenticated: true,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
