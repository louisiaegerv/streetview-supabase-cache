import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { extractValue } from "./utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "Google Maps API key is not set. Please check your environment variables."
  );
}

export type AddressData = {
  address: string;
  lat: number;
  lng: number;
  streetViewImgUrl: string;
  mapImgUrl: string;
};

interface AddressDataResult {
  data: AddressData;
  source: string;
}

export async function getAddressData(
  address: string
): Promise<AddressDataResult> {
  try {
    // Check if the address data is cached in Supabase
    const { data: cachedData, error: supabaseError } = await supabase
      .from("address_cache")
      .select()
      .ilike("address", `%${address}%`)
      .limit(1)
      .single();

    if (supabaseError) {
      console.log("Supabase error:", supabaseError);
    }

    if (cachedData) {
      return {
        data: cachedData,
        source: "Supabase",
      };
    }

    console.log(`Nothing in Supabase for ${address}, checking Google...`);

    // If not cached, fetch from Google Maps API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log(`Geocode URL: ${geocodeUrl}`);
    const { data: geocodeData } = await axios.get(geocodeUrl);

    if (!geocodeData.results || geocodeData.results.length === 0) {
      console.log(`Google API returned no results for ${address}`);
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    const streetNumber =
      extractValue(
        geocodeData.results[0].address_components,
        "street_number"
      ) || "Unknown Street Number";
    const streetName =
      extractValue(geocodeData.results[0].address_components, "route") ||
      "Unknown Street Name";
    const city =
      extractValue(geocodeData.results[0].address_components, "locality") ||
      "Unknown City";
    const state =
      extractValue(
        geocodeData.results[0].address_components,
        "administrative_area_level_1"
      ) || "Unknown State";
    const zip =
      extractValue(geocodeData.results[0].address_components, "postal_code") ||
      "Unknown ZIP";
    const addressFull = `${streetNumber} ${streetName}, ${city}, ${state} ${zip}`;

    // Get Street View metadata
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const { data: metadataData } = await axios.get(metadataUrl);

    if (metadataData.status !== "OK") {
      throw new Error("Street View not available for this location");
    }

    const { location } = metadataData;
    const heading = calculateHeading(location.lat, location.lng, lat, lng);

    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${location.lat},${location.lng}&heading=${heading}&pitch=-0.76&key=${GOOGLE_MAPS_API_KEY}`;

    // Download the Street View image
    const { data: streetViewImage } = await axios.get(streetViewUrl, {
      responseType: "arraybuffer",
    });
    const streetViewImageBuffer = Buffer.from(streetViewImage, "binary");

    // Upload the Street View image to Supabase Storage
    const streetViewFileName = `${uuidv4()}.jpg`;
    const { data: streetViewUploadData, error: uploadError } =
      await supabase.storage
        .from("streetview_images")
        .upload(streetViewFileName, streetViewImageBuffer, {
          contentType: "image/jpeg",
        });
    if (uploadError) {
      console.error(
        "Error uploading streetview image to Supabase:",
        uploadError
      );
    }

    const streetViewImgUrl = streetViewUploadData
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/streetview_images/${streetViewFileName}`
      : "";

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x400&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

    // Download the Map View image
    const { data: mapImg } = await axios.get(mapUrl, {
      responseType: "arraybuffer",
    });
    const mapImageBuffer = Buffer.from(mapImg, "binary");

    // Upload the Street View image to Supabase Storage
    const mapFileName = `${uuidv4()}.jpg`;
    const { data: mapUploadData, error: mapUploadError } =
      await supabase.storage
        .from("streetview_images")
        .upload(mapFileName, mapImageBuffer, {
          contentType: "image/jpeg",
        });
    if (mapUploadError) {
      console.error("Error uploading map image to Supabase:", mapUploadError);
    }

    const mapImgUrl = mapUploadData
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/streetview_images/${mapFileName}`
      : "";

    const addressData: AddressData = {
      address: addressFull,
      lat: lat,
      lng: lng,
      streetViewImgUrl: streetViewImgUrl,
      mapImgUrl: mapImgUrl,
    };

    // Cache the data in Supabase
    const { error: insertError } = await supabase
      .from("address_cache")
      .insert({ ...addressData });

    if (insertError) {
      console.error("Error inserting data into Supabase:", insertError);
    }

    return {
      data: addressData,
      source: "Google API",
    };
  } catch (error) {
    console.error("Error in getAddressData:", error);
    throw error;
  }
}

function calculateHeading(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  let heading = (Math.atan2(y, x) * 180) / Math.PI;
  heading = (heading + 360) % 360;
  return heading;
}
