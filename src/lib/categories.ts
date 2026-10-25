import { CloudFog, Droplets, Volume2, Wind, Waves } from "lucide-react";
import type { Category } from "./types";

export const categories = [
  { id: "odor", label: "Odor", hint: "An unfamiliar smell", icon: Wind },
  {
    id: "smoke",
    label: "Smoke / haze",
    hint: "Something in the air",
    icon: CloudFog,
  },
  {
    id: "water",
    label: "Runoff / water",
    hint: "A change in the water",
    icon: Droplets,
  },
  {
    id: "dust",
    label: "Dust / particles",
    hint: "Visible dust or residue",
    icon: Waves,
  },
  { id: "noise", label: "Noise", hint: "An unusual sound", icon: Volume2 },
] as const;

export function getCategory(category: Category) {
  return categories.find((item) => item.id === category)!;
}
