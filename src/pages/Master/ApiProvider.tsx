import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ServerStackIcon, ArrowsRightLeftIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApiProviderData {
  _id: string;
  providerCode: number;
  providerName: string;
  isTrue?: boolean;
  status?: boolean;
}

interface OperatorSetting {
  operatorName: string;
  serviceType: string;
  provider: string;
}

const OPERATORS = [
  { name: "Jio", type: "Mobile" },
  { name: "Airtel", type: "Mobile" },
  { name: "VI", type: "Mobile" },
  { name: "BSNL", type: "Mobile" },
  { name: "Dish TV", type: "DTH" },
  { name: "Tata Sky", type: "DTH" },
  { name: "Sun Direct", type: "DTH" },
  { name: "Videocon", type: "DTH" },
];

export const ApiProvider = () => {
  const [providers, setProviders] = useState<ApiProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [operatorSettings, setOperatorSettings] = useState<OperatorSetting[]>([]);
  const [operatorLoading, setOperatorLoading] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://api.clubtyl.techember.in/api/setting/api-provider",
        {
          headers: {
            token: localStorage.getItem("token") || "",
          },
        }
      );
      const data = await response.json();
      const list = data?.Data || data?.data || (Array.isArray(data) ? data : []);
      setProviders(list);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to fetch API providers");
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorSettings = async () => {
    setOperatorLoading(true);
    try {
      const response = await fetch(
        "https://api.clubtyl.techember.in/api/cyrus/operator_api_settings",
        {
          headers: {
            token: localStorage.getItem("token") || "",
          },
        }
      );
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const list = data?.Data || data?.data || (Array.isArray(data) ? data : []);
        setOperatorSettings(list);
      } else {
        console.warn("Operator settings API returned non-JSON response (backend endpoint might not be deployed yet).");
        setOperatorSettings([]);
      }
    } catch (error) {
      console.error("Error fetching operator settings:", error);
      // Suppress the toast here so it doesn't annoy the admin if the backend is not ready
      setOperatorSettings([]);
    } finally {
      setOperatorLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchOperatorSettings();
  }, []);

  const handleOperatorChange = async (operatorName: string, serviceType: string, newProvider: string) => {
    try {
      const response = await fetch(
        "https://api.clubtyl.techember.in/api/cyrus/operator_api_settings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token") || "",
          },
          body: JSON.stringify({
            operatorName,
            serviceType,
            provider: newProvider,
          }),
        }
      );
      
      const contentType = response.headers.get("content-type");
      let data = null;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok) {
        toast.success(`Updated ${operatorName} to route via ${newProvider}`);
        fetchOperatorSettings();
      } else {
        const errorMsg = data ? (data.message || data.msg || data.error) : `Endpoint failed with status: ${response.status}`;
        toast.error(errorMsg || "Failed to update operator provider");
      }
    } catch (error: any) {
      console.error("Error updating operator:", error);
      toast.error(`Network Error: Backend unreachable or offline`);
    }
  };

  const handleSwitchProvider = async (id: string) => {
    if (!id) return;
    setIsSwitching(true);
    try {
      const response = await fetch(
        "https://api.clubtyl.techember.in/api/setting/api-provider",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token") || "",
          },
          body: JSON.stringify({
            _id: id,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Provider switched successfully");
        await fetchProviders();
      } else {
        const errorMsg = data.message || data.msg || data.error;
        toast.error(errorMsg ? errorMsg : `Failed (${response.status}): ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      console.error("Error switching provider:", error);
      toast.error(`Error: ${error.message || "Network issue"}`);
    } finally {
      setIsSwitching(false);
    }
  };

  const eztym = providers.find((p) => p.providerName?.toUpperCase() === "EZTYM");
  const billhub = providers.find((p) => p.providerName?.toUpperCase() === "BILLHUB");
  
  // Determine if EZTYM is the currently active one
  // The backend uses `isTrue` field to indicate the active provider
  const checkStatus = (p: any) => p?.isTrue === true || p?.isTrue === "true" || p?.isTrue === 1 || p?.isTrue === "1" || p?.status === true || p?.status === "true";
  const isEztymActive = eztym ? checkStatus(eztym) : true;

  const toggleProvider = () => {
    if (isSwitching) return;
    
    if (isEztymActive) {
      // Switch to BILLHUB
      if (billhub) {
        handleSwitchProvider(billhub._id);
      } else {
        toast.error("BILLHUB provider not found in database");
      }
    } else {
      // Switch to EZTYM
      if (eztym) {
        handleSwitchProvider(eztym._id);
      } else {
        toast.error("EZTYM provider not found in database");
      }
    }
  };

  return (
    <AdminLayout title="API Provider Settings">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="admin-card p-6 border-b border-gray-200">
          <div className="flex items-start sm:items-center gap-3">
            <ServerStackIcon className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">API Provider Switch</h2>
              <p className="text-muted-foreground text-sm">
                Toggle between active API providers for mobile & DTH recharge.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Card */}
        <div className="admin-card p-10 flex flex-col items-center justify-center min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-gray-500">Loading providers...</p>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center gap-8">
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Active Provider</h3>
                <p className="text-gray-500">
                  Currently routing all requests via <strong className="text-primary">{isEztymActive ? "EZTYM" : "BILLHUB"}</strong>
                </p>
              </div>

              {/* Custom Animated Toggle Switch */}
              <div 
                className={`relative flex items-center w-64 h-16 rounded-full cursor-pointer p-1 transition-colors duration-500 ${
                  isSwitching ? "opacity-70 pointer-events-none" : ""
                } ${isEztymActive ? "bg-indigo-50 border border-indigo-100" : "bg-orange-50 border border-orange-100"}`}
                onClick={toggleProvider}
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                {/* Background Labels */}
                <div className="absolute w-full flex justify-between px-6 z-0 pointer-events-none">
                  <span className={`font-bold text-sm transition-opacity duration-300 ${isEztymActive ? "opacity-0" : "opacity-100 text-indigo-400"}`}>EZTYM</span>
                  <span className={`font-bold text-sm transition-opacity duration-300 ${isEztymActive ? "opacity-100 text-orange-400" : "opacity-0"}`}>BILLHUB</span>
                </div>

                {/* Sliding Button */}
                <div 
                  className={`absolute h-14 w-32 rounded-full flex items-center justify-center shadow-md transform transition-transform duration-500 z-10 ${
                    isEztymActive 
                      ? "translate-x-0 bg-indigo-600 text-white" 
                      : "translate-x-[calc(100%-8px)] bg-orange-500 text-white"
                  }`}
                >
                  <span className="font-bold tracking-wide">
                    {isEztymActive ? "EZTYM" : "BILLHUB"}
                  </span>
                </div>
              </div>

              {isSwitching && (
                <div className="flex items-center gap-2 text-primary animate-pulse mt-4">
                  <ArrowsRightLeftIcon className="h-5 w-5" />
                  <span>Switching provider...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Operator Specific Settings Card */}
        <div className="admin-card p-6 min-h-[400px]">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Operator-Specific Routing</h2>
              <p className="text-muted-foreground text-sm">
                Override the global API provider for specific mobile or DTH operators. Unconfigured operators will fall back to the active global provider.
              </p>
            </div>
          </div>

          {operatorLoading ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-500">Loading operator settings...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Operator</TableHead>
                    <TableHead className="font-semibold text-gray-700">Service Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">API Provider</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OPERATORS.map((op) => {
                    const currentSetting = operatorSettings.find((s) => s.operatorName === op.name);
                    let currentValue = "default";
                    if (currentSetting && currentSetting.provider) {
                      const provUpper = currentSetting.provider.toUpperCase();
                      if (provUpper === "EZTYM") currentValue = "EZTYM";
                      else if (provUpper === "BILLHUB") currentValue = "Billhub";
                      else currentValue = currentSetting.provider;
                    }

                    return (
                      <TableRow key={op.name} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{op.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${op.type === "Mobile" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {op.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentValue}
                            onValueChange={(val) => {
                              handleOperatorChange(op.name, op.type, val);
                            }}
                          >
                            <SelectTrigger className="w-[180px] bg-white">
                              <SelectValue placeholder="Global Default" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">
                                <span className="text-gray-500 italic">Fallback to Global</span>
                              </SelectItem>
                              <SelectItem value="EZTYM">EZTYM</SelectItem>
                              <SelectItem value="Billhub">Billhub</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
