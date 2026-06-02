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
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// Types
type StoreSection =
  | "shopping"
  | "travel"
  | "insurance"
  | "bank_account"
  | "credit_cards"
  | "best_deals";

interface StoreItem {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  link: string; // maps to backend 'route'
  section: StoreSection;
}

export const AffiliateStore: React.FC = () => {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<StoreSection | "all">(
    "all"
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    imageFile: null as File | null,
    link: "", // UI field that will be sent as 'route' to backend
    section: "shopping" as StoreSection,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // SAFE URL
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "Invalid URL";
    }
  };

  // GET STORES
  const fetchStores = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5005/api/affiliate/admin-list`,
        {
          method: "GET",
          headers: { token: localStorage.getItem("token") || "" },
        }
      );

      // console.log("Fetch stores response:", res.json());

      if (!res.ok) {
        console.error("Fetch stores returned non-ok status", res.status);
        setLoading(false);
        return;
      }

      const json = await res.json();
      console.log("Fetch stores response JSON:", json);
      if (json.Status && Array.isArray(json.Data)) {
        const formatted = json.Data.map((item: any) => ({
          id: item.id || item._id,
          name: item.name,
          description: item.description,
          link: item.route || item.link || "", // backend sends 'route'
          imageUrl: item.imageUrl || item.icon || "/placeholder.svg",
          section: item.section,
        }));
        setStores(formatted);
        console.log("Fetched stores:", formatted);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error("Fetch stores failed:", err);
      setStores([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // VALIDATION
  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name || !form.name.trim()) e.name = "Store name is required";
    if (!form.description || !form.description.trim())
      e.description = "Description is required";
    if (!form.link || !String(form.link).trim()) e.link = "Link is required";

    if (form.link) {
      try {
        new URL(form.link);
      } catch {
        e.link = "Enter a valid URL";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // CREATE
  const handleCreate = async () => {
    if (!validate()) return;

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("route", form.link.trim()); // backend expects 'route'
      formData.append("section", form.section);

      if (form.imageFile) formData.append("image", form.imageFile);

      const res = await fetch(
        "http://localhost:5005/api/affiliate/create",
        {
          method: "POST",
          headers: { token: localStorage.getItem("token") || "" },
          body: formData,
        }
      );

      // backend returns json; handle it safely
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.Status) {
        fetchStores();
      } else {
        console.error("Create store failed:", json || res.status);
      }
    } catch (err) {
      console.error("Create store failed:", err);
    }

    closeModal();
  };

  // UPDATE (image optional)
  const handleUpdate = async () => {
    if (!validate() || !editId) return;

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("route", form.link.trim()); // backend expects 'route'
      formData.append("section", form.section);

      // image optional: only append if selected
      if (form.imageFile) formData.append("image", form.imageFile);

      const res = await fetch(
        `http://localhost:5005/api/affiliate/update/${editId}`,
        {
          method: "PATCH",
          headers: { token: localStorage.getItem("token") || "" },
          body: formData,
        }
      );

      const json = await res.json().catch(() => null);
      if (res.ok && json && json.Status) {
        fetchStores();
      } else {
        console.error("Update failed:", json || res.status);
      }
    } catch (err) {
      console.error("Update failed:", err);
    }

    closeModal();
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:5005/api/affiliate/remove/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token: `${localStorage.getItem("token")}`,
          },
        }
      );

      const json = await res.json().catch(() => null);
      if (res.ok && json && json.Status) {
        fetchStores();
      } else {
        console.error("Delete failed:", json || res.status);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // OPEN EDIT MODAL
  const openEditModal = (item: StoreItem) => {
    setIsEditing(true);
    setEditId(item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      imageFile: null,
      link: item.link || "",
      section: item.section || "shopping",
    });
    setErrors({});
    setShowModal(true);
  };

  // OPEN ADD MODAL
  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      name: "",
      description: "",
      imageFile: null,
      link: "",
      section: "shopping",
    });
    setErrors({});
    setShowModal(true);
  };

  // CLOSE
  const closeModal = () => {
    setShowModal(false);
    setErrors({});
    setEditId(null);
  };

  // FILTER
  const filteredStores = stores.filter((store) => {
    const matchSearch =
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSection =
      selectedSection === "all" || store.section === selectedSection;

    return matchSearch && matchSection;
  });

  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredStores.length);
  const currentItems = filteredStores.slice(startIndex, endIndex);
  console.log("Filtered stores:", currentItems);
  useEffect(() => setCurrentPage(1), [searchTerm, selectedSection]);

  return (
    <AdminLayout title="Affiliate Stores">
      <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="admin-card overflow-hidden">
          {/* HEADER */}
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                  Affiliate Stores
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Manage affiliate store links and offers</p>
              </div>

              <button
                onClick={openAddModal}
                className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                NEW STORE
              </button>
            </div>
          </div>

          {/* SEARCH + FILTER */}
          <div className="p-6 border-b border-border bg-card/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>

              <div className="sm:w-56">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value as any)}
                  className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                >
                  <option value="all">All Sections</option>
                  <option value="shopping">Shopping</option>
                  <option value="travel">Travel</option>
                  <option value="insurance">Insurance</option>
                  <option value="bank_account">Bank Account</option>
                  <option value="credit_cards">Credit Cards</option>
                  <option value="best_deals">Best Deals</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Loading stores...
            </div>
          ) : (
            <div
              className="relative w-full max-w-full overflow-x-auto rounded border"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <table className="min-w-[1100px] w-full admin-table">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Image</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Description</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Section</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Link</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left w-[100px]">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-white border border-border shadow-sm flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                          <img
                            src={`http://localhost:5005/${item.imageUrl}`}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {item.description}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.section === "shopping" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          item.section === "travel" ? "bg-green-50 text-green-700 border-green-200" :
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}>
                          {item.section === "bank_account"
                            ? "Bank Account"
                            : item.section === "credit_cards"
                              ? "Credit Cards"
                              : item.section === "best_deals"
                                ? "Best Deals"
                                : item.section.charAt(0).toUpperCase() +
                                item.section.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline text-sm font-medium transition-colors"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          {getHostname(item.link)}
                        </a>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
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
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No stores found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{endIndex}</span> of <span className="font-medium text-foreground">{filteredStores.length}</span> results
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

      {/* ADD / EDIT MODAL */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-100 rounded-xl shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Edit Store" : "Add New Store"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                {/* Store Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Store Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900 placeholder:text-gray-400 ${errors.name ? "border-destructive bg-red-50" : "border-gray-300"
                      }`}
                    placeholder="e.g. Amazon, Flipkart"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900 placeholder:text-gray-400 resize-none ${errors.description ? "border-destructive bg-red-50" : "border-gray-300"
                      }`}
                    placeholder="Brief description of the store or offer..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Section <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={form.section}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        section: e.target.value as StoreSection,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900"
                  >
                    <option value="shopping">Shopping</option>
                    <option value="travel">Travel</option>
                    <option value="insurance">Insurance</option>
                    <option value="bank_account">Bank Account</option>
                    <option value="credit_cards">Credit Cards</option>
                    <option value="best_deals">Best Deals</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Store Logo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm({ ...form, imageFile: e.target.files?.[0] || null })
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-3">
                      {form.imageFile ? (
                        <div className="relative h-20 w-auto p-1 border border-gray-200 rounded-lg">
                          <img
                            src={URL.createObjectURL(form.imageFile)}
                            alt="Preview"
                            className="h-full w-auto object-contain"
                          />
                          <p className="text-xs text-gray-500 mt-1">{form.imageFile.name}</p>
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
                            SVG, PNG, JPG (max. 800x400px)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Store Link (Route) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900 placeholder:text-gray-400 ${errors.link ? "border-destructive bg-red-50" : "border-gray-300"
                        }`}
                      placeholder="https://example.com"
                    />
                  </div>
                  {errors.link && (
                    <p className="text-xs text-destructive font-medium mt-1">{errors.link}</p>
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-xl">
                  <button onClick={closeModal} className="btn-secondary flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={isEditing ? handleUpdate : handleCreate}
                    className="btn-primary flex-1 py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                  >
                    {isEditing ? "Update Store" : "Create Store"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};