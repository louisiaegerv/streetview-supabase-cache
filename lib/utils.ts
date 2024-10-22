import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AddressComponent } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractValue(
  addressComponents: AddressComponent[],
  searchString: string
): string | null {
  for (const component of addressComponents) {
    if (component.types.includes(searchString)) {
      return component.short_name;
    }
  }
  return null;
}
