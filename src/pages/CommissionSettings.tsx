/**
 * COMMISSION SETTINGS – RESPONSIVE VERSION (SCROLLABLE TABLE)
 */

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

// TYPES
interface SubService {
  name: string;
  commission: number;
  symbol?: "%" | "₹";
  icon?: string;
  status?: boolean;
  _id?: string;
}

interface CommissionSetting {
  service: string;
  commission: number;
  subServices?: SubService[];
  _id?: string;
}

export const CommissionSettings = () => {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [iconFile, setIconFile] = useState<File | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // TRANSFORM API RESPONSE
  const transformApiData = (apiData: any): CommissionSetting[] => {
    const transformed: CommissionSetting[] = [];
    Object.keys(apiData).forEach((category) => {
      const operators = apiData[category];
      const subServices: SubService[] = [];

      Object.keys(operators).forEach((operatorName) => {
        const operator = operators[operatorName];
        subServices.push({
          name: operatorName,
          commission: operator.commission,
          symbol: operator.symbol ?? "%",
          icon: operator.icon,
          status: operator.status,
          _id: operator._id,
        });
      });

      transformed.push({
        service: category.toUpperCase(),
        commission: 0,
        subServices,
      });
    });

    return transformed;
  };

  // FETCH SETTINGS
  useEffect(() => {
    const fetchCommissionSettings = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://api.clubtyl.techember.in/api/commission/admin/list?page=1&limit=20`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              token: `${localStorage.getItem("token")}`,
            },
          }
        );

        const result = await response.json();

        if (!result.Error && result.Status && result.Data) {
          setSettings(transformApiData(result.Data));
        }
      } catch (err) {
        setError("Failed to load commission settings");
      } finally {
        setLoading(false);
      }
    };

    fetchCommissionSettings();
  }, []);

  // UPDATE COMMISSION (FIXED)
  const updateCommission = async (
    id: string,
    commission: string,
    name: string,
    operatorType: string,
    icon: File | null,
    symbol: "%" | "₹"
  ) => {
    try {
      const fd = new FormData();
      fd.append("commission", commission);
      fd.append("name", name);
      fd.append("operatorType", operatorType);
      fd.append("symbol", symbol);

      if (icon) {
        fd.append("icon", icon);
      }

      const res = await fetch(
        `https://api.clubtyl.techember.in/api/commission/update/${id}`,
        {
          method: "PUT",
          headers: {
            token: `${localStorage.getItem("token")}`,
          },
          body: fd,
        }
      );

      const json = await res.json();
      console.log("UPDATE RESPONSE:", json);

      if (!json.Error && json.Status) {
        location.reload();
        return true;
      } else {
        alert("Update failed: " + json.Message);
      }
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      alert("An error occurred while updating.");
    }

    return false;
  };

  // DELETE COMMISSION (FIXED)
  const deleteCommission = async (id: string) => {
    try {
      await fetch(`https://api.clubtyl.techember.in/api/commission/delete/${id}`, {
        method: "DELETE",
        headers: { token: `${localStorage.getItem("token")}` },
      });

      location.reload();
    } catch (err) {
      console.error("DELETE ERROR", err);
    }
  };

  // EDIT HANDLERS
  const startEdit = (id: string, data: any) => {
    setEditingId(id);
    setEditForm({ ...data });
    setIconFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setIconFile(null);
  };

  const saveEdit = async (isSubService = false, parent?: string) => {
    if (!editForm) return;

    // Updating sub-services
    if (isSubService && parent) {
      const service = settings.find((s) => s.service === parent);
      const sub = service?.subServices?.find(
        (x) => `${parent}-${x.name}` === editingId
      );

      if (sub?._id) {
        const success = await updateCommission(
          sub._id,
          editForm.commission.toString(),
          editForm.name ?? sub.name,
          parent.toLowerCase(),
          iconFile,
          editForm.symbol || "%"
        );

        if (success) cancelEdit();
        return;
      }
    }
  };

  const toggleExpand = (service: string) => {
    setExpandedService((prev) => (prev === service ? null : service));
  };

  // ===============================
  // LOADING STATE
  // ===============================
  if (loading) {
    return (
      <AdminLayout title="Commission Settings">
        <div className="p-6 flex justify-center items-center h-56">
          <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Commission Settings">
      <div className="h-full p-4 sm:p-6 overflow-y-auto scrollbar-hide">
        {error && (
          <div className="mb-4 p-4 rounded bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="admin-card">
          {/* HEADER */}
          <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <CogIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">
                Service Commission Configuration
              </h2>
            </div>
          </div>

          {/* TABLE */}
          <div
            className="relative w-full overflow-x-auto rounded border"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <table className="min-w-[1100px] w-full admin-table text-sm">
              <thead>
                <tr className="bg-muted/20">
                  <th className="p-3">Service</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Icon</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {/* MAIN SERVICES */}
                {settings.map((setting) => (
                  <React.Fragment key={setting.service}>
                    <tr className="border-b hover:bg-muted/5">
                      <td
                        className="p-3 font-medium cursor-pointer whitespace-nowrap"
                        onClick={() =>
                          setting.subServices && toggleExpand(setting.service)
                        }
                      >
                        {setting.service}
                        {setting.subServices && (
                          <span className="ml-2 text-xs text-primary">
                            {expandedService === setting.service ? "▲" : "▼"}
                          </span>
                        )}
                      </td>

                      <td className="p-3 lowercase text-muted-foreground">
                        {setting.service.toLowerCase()}
                      </td>

                      <td className="p-3">
                        <span className="text-muted-foreground">—</span>
                      </td>

                      <td className="p-3">
                        <span className="text-muted-foreground">—</span>
                      </td>

                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <span className="text-muted-foreground">—</span>
                        </div>
                      </td>
                    </tr>

                    {/* SUB-SERVICES */}
                    {expandedService === setting.service &&
                      setting.subServices?.map((sub) => (
                        <tr
                          key={sub.name}
                          className="bg-muted/10 hover:bg-muted/20"
                        >
                          <td className="p-3 pl-10 font-medium whitespace-nowrap">
                            {sub.name}
                          </td>

                          <td className="p-3 text-muted-foreground">—</td>

                          <td className="p-3 whitespace-nowrap">
                            {editingId === `${setting.service}-${sub.name}` ? (
                              <div className="flex items-center gap-2">
                                {/* Commission Input */}
                                <input
                                  type="number"
                                  value={editForm?.commission}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      commission: Number(e.target.value),
                                    })
                                  }
                                  className="border w-20 p-1 rounded"
                                />

                                {/* Symbol Input */}
                                <select
                                  value={editForm?.symbol || "%"}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      symbol: e.target.value as "%" | "₹",
                                    })
                                  }
                                  className="border p-1 rounded"
                                >
                                  <option value="%">%</option>
                                  <option value="₹">₹</option>
                                </select>
                              </div>
                            ) : (
                              <>
                                {sub.symbol === "₹"
                                  ? `₹${sub.commission}`
                                  : `${sub.commission}%`}
                              </>
                            )}
                          </td>

                          <td className="p-3">
                            {editingId === `${setting.service}-${sub.name}` ? (
                              <input
                                type="file"
                                className="border p-1 rounded"
                                onChange={(e) =>
                                  setIconFile(e.target.files?.[0] || null)
                                }
                              />
                            ) : (
                              sub.icon && (
                                <img
                                  src={`${apiBaseUrl}/${sub.icon}`}
                                  className="h-6 w-6 object-contain"
                                />
                              )
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              {editingId ===
                                `${setting.service}-${sub.name}` ? (
                                <>
                                  <button
                                    onClick={() =>
                                      saveEdit(true, setting.service)
                                    }
                                    className="text-green-600 p-1"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={cancelEdit}
                                    className="text-red-600 p-1"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() =>
                                      startEdit(
                                        `${setting.service}-${sub.name}`,
                                        sub
                                      )
                                    }
                                    className="text-blue-600 p-1"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteCommission(sub._id || "")
                                    }
                                    className="text-red-600 p-1"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
