import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  LinkIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface BannerItem {
  _id: string;
  image: string;
  name: string;
  link: string;
}

const sectionOptions = ["Top", "Middle", "Bottom", "Sidebar"];

export const Banner: React.FC = () => {
  const useMock =
    (import.meta.env.VITE_USE_MOCK_AUTH || "false").toLowerCase() === "true";
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBanner, setNewBanner] = useState<{
    imageFile?: File | null;
    name: string;
    link: string;
  }>({
    imageFile: null,
    name: "",
    link: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBanner, setEditBanner] = useState<BannerItem | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // ✅ Fetch banners from backend or mock
  useEffect(() => {
    fetch(`https://api.clubtyl.techember.in/api/home-banner/admin/list`, {
      method: "GET",
      headers: {
        token: localStorage.getItem("token") || "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch banners");
        return res.json();
      })
      .then((data) => {
        setBanners(data.Data);
        console.log("Fetched banners:", data);
      })
      .catch((err) => console.error("Error fetching banners:", err));
  }, [useMock, apiBaseUrl]);

  const totalPages = Math.ceil(banners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, banners.length);
  const currentItems = banners.slice(startIndex, endIndex);

  const handleDelete = (id: string) => {
    fetch(`https://api.clubtyl.techember.in/api/home-banner/${id}`, {
      method: "DELETE",
      headers: {
        token: localStorage.getItem("token") || "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete banner");
        setBanners((prev) => prev.filter((b) => b._id !== id));
      })
      .catch((err) => console.error("Error deleting banner:", err));

    if (startIndex >= banners.length - 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newBanner.name.trim()) e.type = "Type is required";
    if (!newBanner.link.trim()) e.link = "Link is required";
    try {
      if (newBanner.link) new URL(newBanner.link);
    } catch {
      e.link = "Enter a valid URL";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = () => {
    if (!editBanner) return;

    const formData = new FormData();
    formData.append("name", editBanner.name);
    formData.append("link", editBanner.link);

    if (editImageFile) {
      formData.append("image", editImageFile);
    }

    fetch(`https://api.clubtyl.techember.in/api/home-banner/${editBanner._id}`, {
      method: "PUT",
      headers: {
        token: localStorage.getItem("token") || "",
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update banner");
        return res.json();
      })
      .then((data) => {
        // Some APIs return full object, some return updated fields
        // Safely merge both
        const updated = data.updated || data.Data || editBanner;

        setBanners((prev) =>
          prev.map((b) =>
            b._id === editBanner._id ? { ...b, ...updated } : b,
          ),
        );

        // Close modal and clear state
        setShowEditModal(false);
        setEditImageFile(null);
        setEditBanner(null);
      })
      .catch((err) => console.error("Update Error:", err));
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", newBanner.name.trim());
    formData.append("link", newBanner.link.trim());

    // Attach the file
    if (newBanner.imageFile) {
      formData.append("image", newBanner.imageFile);
    }

    fetch(`https://api.clubtyl.techember.in/api/home-banner/create`, {
      method: "POST",
      body: formData,
      headers: {
        token: localStorage.getItem("token"),
      }, // No headers needed for form-data
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add banner");
        return res.json();
      })
      .then((data) => {
        setBanners((prev) => [data, ...prev]);
      })
      .catch((err) => console.error("Error adding banner:", err));

    // Close modal after success
    setShowAddModal(false);
    setErrors({});
  };

  return (
    <AdminLayout title="Banners">
      <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="admin-card overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                  Banner Management
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your home screen banners</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                NEW BANNER
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="p-0">
            <div
              className="relative w-full max-w-full overflow-x-auto rounded border"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <table className="min-w-[1100px] w-full admin-table">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Image</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Link</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentItems.map((item) => (
                    <tr key={item._id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="h-16 w-24 rounded-lg overflow-hidden bg-accent border border-border shadow-sm group-hover:shadow-md transition-all">
                          <img
                            src={"https://api.clubtyl.techember.in/" + item.image}
                            alt={` ${item.name}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline text-sm font-medium transition-colors"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          {item.link && item.link.startsWith("http")
                            ? new URL(item.link).hostname
                            : item.link || "Invalid URL"}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                            onClick={() => {
                              setEditBanner(item);
                              setShowEditModal(true);
                            }}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No banners found. Click "New Banner" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{endIndex}</span> of <span className="font-medium text-foreground">{banners.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-border bg-background rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-border bg-background rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Banner Modal */}
      {(showEditModal && editBanner || showAddModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-xl shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {showEditModal ? "Edit Banner" : "Add New Banner"}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowAddModal(false);
                  setErrors({});
                  setEditBanner(null);
                  setNewBanner({ name: "", link: "", imageFile: null });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Banner Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group bg-white">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      showEditModal
                        ? setEditImageFile(e.target.files?.[0] || null)
                        : setNewBanner({
                          ...newBanner,
                          imageFile: e.target.files?.[0] || null,
                        })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-3">
                    {(showEditModal && (editImageFile || editBanner?.image)) || (!showEditModal && newBanner.imageFile) ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={
                            showEditModal
                              ? editImageFile
                                ? URL.createObjectURL(editImageFile)
                                : "https://api.clubtyl.techember.in/" + editBanner?.image
                              : newBanner.imageFile
                                ? URL.createObjectURL(newBanner.imageFile!)
                                : ""
                          }
                          className="h-full w-full object-cover"
                          alt="preview"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-gray-50 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                          <PlusIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-400">
                          SVG, PNG, JPG or GIF (max. 800x400px)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={showEditModal ? editBanner?.name : newBanner.name}
                  onChange={(e) =>
                    showEditModal && editBanner
                      ? setEditBanner({ ...editBanner, name: e.target.value })
                      : setNewBanner({ ...newBanner, name: e.target.value })
                  }
                  className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900 placeholder:text-gray-400 ${errors.type ? "border-destructive bg-red-50" : "border-gray-300"}`}
                  placeholder="e.g. Summer Sale, New Feature"
                />
                {errors.type && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.type}</p>
                )}
              </div>

              {/* Link */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Target Link <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={showEditModal ? editBanner?.link : newBanner.link}
                    onChange={(e) =>
                      showEditModal && editBanner
                        ? setEditBanner({ ...editBanner, link: e.target.value })
                        : setNewBanner({ ...newBanner, link: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900 placeholder:text-gray-400 ${errors.link ? "border-destructive bg-red-50" : "border-gray-300"}`}
                    placeholder="https://example.com/promo"
                  />
                </div>
                {errors.link && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.link}</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowAddModal(false);
                }}
                className="btn-secondary flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={showEditModal ? handleUpdate : handleSubmit}
                className="btn-primary flex-1 py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/40"
              >
                {showEditModal ? "Save Changes" : "Create Banner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};