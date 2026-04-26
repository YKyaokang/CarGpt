"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/store/auth";

export default function AuthInitializer() {
  const { fetchMe } = useAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return null;
}
