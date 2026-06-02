import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  BellIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { Videotape } from "lucide-react";

interface Notification {
  title: string;
  message: string;

  popImage?: File | null;
  popImageUrl?: string;

  popName?: string;
  popLink?: string;
  popStatus?: string;

  bannerImage?: File | null;
}

export const NotificationManagement = () => {


  const [activeTab, setActiveTab] = useState<
    "notification" | "pop-image" | "banner"
  >("notification");

  const [notification, setNotification] = useState<Notification>({
    title: "",
    message: "",
    popImage: null,
    popImageUrl: "",
    popName: "",
    popLink: "",
    popStatus: "true",
    bannerImage: null,
  });

  const [notifications, setNotifications] = useState<any[]>([]);

  // =====================================
  // Fetch Notification List
  // =====================================
  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `http://localhost:5005/api/notification/list/admin`,
        {
          method: "GET",
          headers: {
            token: `${localStorage.getItem("token")}` || "",
          },
        }
      );

      const data = await res.json();

      setNotifications(
        Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // =====================================
  // Send Normal Notification
  // =====================================
  // =====================================
  // Send Normal Notification
  // =====================================
  const sendNotification = async () => {
    try {
      const res = await fetch(
        `http://localhost:5005/api/notification/push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: `${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title: notification.title,
            content: notification.message,
          }),
        }
      );

      const data = await res.json();  // ⭐ IMPORTANT ⭐
      console.log("PUSH RESPONSE =", data);

      if (data.Status === true) {
        alert(data.Remarks || "Notification sent successfully!");
      } else {
        alert(data.Remarks || "Failed to send notification");
      }

      setNotification((prev) => ({
        ...prev,
        title: "",
        message: "",
      }));

      fetchNotifications();
    } catch (e) {
      console.log(e);
      alert("Something went wrong!");
    }
  };


  // =====================================
  // Update POP Image
  // =====================================
  const sendPopImage = async () => {
    try {
      const formData = new FormData();

      if (notification.popImage)
        formData.append("image", notification.popImage);
      if (notification.popName?.trim())
        formData.append("name", notification.popName);
      if (notification.popLink?.trim())
        formData.append("link", notification.popLink);
      if (notification.popStatus)
        formData.append("status", notification.popStatus);

      const res = await fetch(
        `http://localhost:5005/api/pop-image/update`,
        {
          method: "PUT",
          headers: {
            token: `${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      console.log("POP IMAGE UPDATE =>", data);

      alert("Pop image updated!");

      setNotification((prev) => ({
        ...prev,
        popImage: null,
        popName: "",
        popLink: "",
      }));
    } catch (e) {
      console.log(e);
    }
  };

  // =====================================
  // Upload Banner
  // =====================================
  const uploadBanner = async () => {
    try {
      if (!notification.bannerImage)
        return alert("Upload a banner image first");

      const formData = new FormData();
      formData.append("image", notification.bannerImage);
      formData.append("title", notification.title || "");
      formData.append("content", notification.message || "");

      const res = await fetch(
        `http://localhost:5005/api/notification/push-image`,
        {
          method: "POST",
          headers: {
            token: `${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      console.log("BANNER RESPONSE:", data);

      alert("Banner uploaded!");

      setNotification((prev) => ({
        ...prev,
        title: "",
        message: "",
        bannerImage: null,
      }));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <AdminLayout title="Notification Management">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">

        {/* =========================== */}
        {/* TAB SWITCHER */}
        {/* =========================== */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-2xl flex gap-1 w-full max-w-lg shadow-inner">
            {[
              { id: "notification", label: "Notification" },
              { id: "pop-image", label: "Pop Image" },
              { id: "banner", label: "Banner" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 relative ${activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  }`}
              >
                {activeTab === tab.id && (
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-full mx-auto w-12" />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================== */}
        {/* NORMAL NOTIFICATION */}
        {/* =========================== */}
        {activeTab === "notification" && (
          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="p-4 bg-gradient-to-tr from-primary/10 to-violet-500/10 rounded-2xl text-primary ring-1 ring-primary/20">
                <BellIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">Send Notification</h2>
                <p className="text-muted-foreground mt-1">Send push notifications to all users instantly</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Special Offer!"
                  value={notification.title}
                  onChange={(e) =>
                    setNotification({ ...notification, title: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Message</label>
                <textarea
                  placeholder="Write your message here..."
                  value={notification.message}
                  onChange={(e) =>
                    setNotification({ ...notification, message: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[140px] resize-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white"
                />
              </div>

              <button
                onClick={sendNotification}
                className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 mt-2 bg-gradient-to-r from-primary to-violet-600"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                Send Broadcast
              </button>
            </div>
          </div>
        )}

        {/* =========================== */}
        {/* POP IMAGE */}
        {/* =========================== */}
        {activeTab === "pop-image" && (
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="p-4 bg-gradient-to-tr from-primary/10 to-violet-500/10 rounded-2xl text-primary ring-1 ring-primary/20">
                <PhotoIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">Update Pop Image</h2>
                <p className="text-muted-foreground mt-1">Manage the promotional popup shown on app launch</p>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Upload Image</label>
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 text-center hover:bg-muted/30 transition-all duration-300 relative cursor-pointer group bg-muted/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNotification({
                        ...notification,
                        popImage: e.target.files?.[0] || null,
                      })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="p-4 bg-white rounded-full shadow-lg shadow-gray-200/50 ring-1 ring-gray-100">
                      <PhotoIcon className="h-8 w-8 text-violet-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.popImage ? (
                          <span className="text-emerald-600 font-medium flex items-center justify-center gap-1">
                            Selected: {notification.popImage.name}
                          </span>
                        ) : (
                          "SVG, PNG, JPG or GIF (max. 5MB)"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Popup Name</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Sale"
                  value={notification.popName}
                  onChange={(e) =>
                    setNotification({
                      ...notification,
                      popName: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Status</label>
                <div className="relative">
                  <select
                    value={notification.popStatus}
                    onChange={(e) =>
                      setNotification({
                        ...notification,
                        popStatus: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none hover:bg-muted/50 focus:bg-white cursor-pointer"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Redirect Link (Optional)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={notification.popLink}
                    onChange={(e) =>
                      setNotification({
                        ...notification,
                        popLink: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 pt-4">
                <button
                  onClick={sendPopImage}
                  className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-primary to-violet-600"
                >
                  <PhotoIcon className="h-5 w-5" />
                  Update Pop Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================== */}
        {/* BANNER UPLOAD */}
        {/* =========================== */}
        {activeTab === "banner" && (
          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="p-4 bg-gradient-to-tr from-primary/10 to-violet-500/10 rounded-2xl text-primary ring-1 ring-primary/20">
                <Videotape className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">Upload Banner</h2>
                <p className="text-muted-foreground mt-1">Add attractive banners to the home screen</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Sale"
                  value={notification.title}
                  onChange={(e) =>
                    setNotification({ ...notification, title: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Content</label>
                <textarea
                  placeholder="Describe your banner..."
                  value={notification.message}
                  onChange={(e) =>
                    setNotification({
                      ...notification,
                      message: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[100px] resize-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Banner Image</label>
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 text-center hover:bg-muted/30 transition-all duration-300 relative cursor-pointer group bg-muted/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNotification({
                        ...notification,
                        bannerImage: e.target.files?.[0] || null,
                      })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform duration-300">
                    <div className="p-4 bg-white rounded-full shadow-lg shadow-gray-200/50 ring-1 ring-gray-100">
                      <PhotoIcon className="h-8 w-8 text-violet-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.bannerImage ? (
                          <span className="text-emerald-600 font-medium flex items-center justify-center gap-1">
                            Selected: {notification.bannerImage.name}
                          </span>
                        ) : (
                          "SVG, PNG, JPG or GIF (max. 5MB)"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={uploadBanner}
                  className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-primary to-violet-600"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Upload Banner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================== */}
        {/* Notification List */}
        {/* =========================== */}
        {notifications.length > 0 && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-1.5 bg-gradient-to-b from-primary to-violet-500 rounded-full" />
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Recent Activity</h3>
            </div>

            <div className="bg-white border border-border/40 rounded-3xl shadow-xl shadow-primary/5 overflow-hidden">
              <div
                className="relative w-full overflow-x-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-5 px-8 w-1/4">Title</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-5 px-8">Message</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-5 px-8 w-32 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {notifications.map((n, idx) => (
                      <tr key={idx} className="group hover:bg-muted/10 transition-colors">
                        <td className="p-8 font-semibold text-foreground align-top">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            {n.title}
                          </div>
                        </td>
                        <td className="p-8 text-muted-foreground align-top leading-relaxed">
                          {n.content || "No content provided"}
                        </td>
                        <td className="p-8 align-top text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Sent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
