import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  CogIcon,
  WifiIcon,
  BanknotesIcon,
  PhoneIcon,
  TvIcon,
  BoltIcon,
  FireIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import ServiceCard from "@/components/ServiceCard";

interface Service {
  _id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: boolean;
  apiKey?: string;
  provider: string;
  description: string;
  percentageOffer?: number;
  route?: string;
  section?: string;
}

export const ServiceControl = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const iconMap: Record<string, React.ComponentType<any>> = {
    PhoneIcon,
    TvIcon,
    BoltIcon,
    FireIcon,
    MapIcon,
    CogIcon,
    WifiIcon,
    BanknotesIcon,
  };

  const coerceService = (raw: any): Service => {
    const iconValue = raw.icon;
    let iconComponent: React.ComponentType<any> = CogIcon;

    if (typeof iconValue === "string" && iconMap[iconValue]) {
      iconComponent = iconMap[iconValue];
    }

    return {
      _id: String(raw._id),
      name: String(raw.name || raw.serviceName || "Unnamed Service"),
      icon: iconComponent,
      status: Boolean(raw.status),
      apiKey: raw.apiKey,
      provider: raw.provider || "Unknown Provider",
      description: raw.description || "",
      percentageOffer: raw.percentageOffer
        ? Number(raw.percentageOffer)
        : undefined,
      route: raw.route,
      section: raw.section,
    };
  };

  const loadServices = async () => {
    try {
      const response = await fetch("https://api.clubtyl.techember.in/api/service/list");
      const data = await response.json();
      const list = data?.Data || [];
      setServices(list.map(coerceService));
    } catch (err) {
      console.error("Error loading services:", err);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const toggleService = async (serviceId: string, status: boolean) => {
    try {
      await fetch(`https://api.clubtyl.techember.in/api/service/${serviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ status: !status }),
      });

      window.location.reload();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // 👉 SEARCH FILTER
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Service Control">
      <div className="p-6">

        {/* HEADER */}
        <div className="admin-card">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between gap-4">

            {/* Page Title */}
            <div className="flex items-start sm:items-center gap-3">
              <CogIcon className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Service Management</h2>
                <p className="text-muted-foreground text-sm">
                  Activate / deactivate services and configure API keys
                </p>
              </div>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* GRID */}
          <div className="p-6">
            {filteredServices.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No services found.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    onToggle={toggleService}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
