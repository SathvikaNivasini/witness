import type { Metadata } from "next";
import { Profile } from "@/components/layout/profile";

export const metadata: Metadata = { title: "Profile & privacy" };
export default function ProfilePage() {
  return <Profile />;
}
