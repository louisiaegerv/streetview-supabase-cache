"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Map } from "lucide-react";
import AddressViewer from "@/components/AddressViewer";

export default function Home() {
  const [address, setAddress] = useState("");
  const [submittedAddress, setSubmittedAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedAddress(address);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Google Streetview Supabase Cache ♻️
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter an address"
              className="flex-grow"
            />
            <Button type="submit">
              <MapPin className="mr-2 h-4 w-4" /> View
            </Button>
          </form>
          {submittedAddress && <AddressViewer address={submittedAddress} />}
        </CardContent>
      </Card>
    </main>
  );
}
