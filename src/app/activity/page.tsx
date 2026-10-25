import type { Metadata } from "next";
import { Activity } from "@/components/observations/activity";

export const metadata: Metadata = { title: "My Activity" };
export default function ActivityPage() {
  return <Activity />;
}
