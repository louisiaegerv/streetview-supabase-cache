"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Map, Image as ImageIcon } from "lucide-react";
import { getAddressData, AddressData } from "@/lib/addressUtils";
import { useToast } from "@/hooks/use-toast";

interface AddressViewerProps {
  address: string;
}

const AddressViewer: React.FC<AddressViewerProps> = ({ address }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"street" | "map">("street");
  const { toast, showToast } = useToast();

  useEffect(() => {
    const fetchAddressData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, source } = await getAddressData(address);
        setAddressData(() => data);
        showToast(`Data fetched from ${source}`, "success");
      } catch (err) {
        setError("Failed to fetch address data");
        showToast("Failed to fetch address data", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddressData();
  }, [address, showToast]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!addressData) return null;

  const { streetViewImgUrl, mapImgUrl } = addressData;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <Button
            variant={viewMode === "street" ? "default" : "outline"}
            className="mr-2"
            onClick={() => setViewMode("street")}
          >
            <ImageIcon className="mr-2 h-4 w-4" /> Street View
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            onClick={() => setViewMode("map")}
          >
            <Map className="mr-2 h-4 w-4" /> Map View
          </Button>
        </div>
        <div className="relative w-full h-[400px]">
          {streetViewImgUrl && mapImgUrl ? (
            <img
              src={viewMode === "street" ? streetViewImgUrl : mapImgUrl}
              alt={viewMode === "street" ? "Street View" : "Map View"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              No image available
            </div>
          )}
        </div>
      </CardContent>
      {toast && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-md ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          } text-white`}
        >
          {toast.message}
        </div>
      )}
    </Card>
  );
};

export default AddressViewer;
