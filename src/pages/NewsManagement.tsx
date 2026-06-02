import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PlusIcon, TrashIcon, PencilIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

export const NewsManagement = () => {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      const res = await fetch("https://api.clubtyl.techember.in/api/news");
      const data = await res.json();
      if (data.success) {
        setNewsList(data.Data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return alert("Please enter news text");
    
    try {
      const url = editingId 
        ? `https://api.clubtyl.techember.in/api/news/${editingId}`
        : "https://api.clubtyl.techember.in/api/news";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          token: `${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text, isActive }),
      });

      const data = await res.json();
      if (data.success) {
        alert(editingId ? "News updated!" : "News added!");
        setText("");
        setIsActive(true);
        setEditingId(null);
        fetchNews();
      } else {
        alert(data.message || "Failed to save news");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong!");
    }
  };

  const handleEdit = (news: any) => {
    setText(news.text);
    setIsActive(news.isActive);
    setEditingId(news._id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this news item?")) return;
    try {
      const res = await fetch(`https://api.clubtyl.techember.in/api/news/${id}`, {
        method: "DELETE",
        headers: {
          token: `${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        alert("News deleted!");
        fetchNews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout title="News Management">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* ADD / EDIT NEWS FORM */}
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-border/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5">
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-tr from-primary/10 to-violet-500/10 rounded-2xl text-primary ring-1 ring-primary/20">
              <PlusIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                {editingId ? "Edit News Item" : "Add News Item"}
              </h2>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">News Text</label>
              <textarea
                placeholder="e.g. Welcome to ClubTYL!"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Status</label>
              <select
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none hover:bg-muted/50 focus:bg-white cursor-pointer"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 mt-2 bg-gradient-to-r from-primary to-violet-600 text-white"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {editingId ? "Update News" : "Add News"}
            </button>
            
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setText("");
                  setIsActive(true);
                }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* NEWS LIST */}
        {newsList.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-1.5 bg-gradient-to-b from-primary to-violet-500 rounded-full" />
              <h3 className="text-xl font-bold text-foreground">Current News</h3>
            </div>

            <div className="bg-white border border-border/40 rounded-3xl shadow-xl shadow-primary/5 overflow-hidden">
              <div className="relative w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-5 px-8">Text</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-5 px-8 w-32 text-center">Status</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-5 px-8 w-32 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {newsList.map((n, idx) => (
                      <tr key={idx} className="group hover:bg-muted/10 transition-colors">
                        <td className="p-8 text-foreground align-top">
                          {n.text}
                        </td>
                        <td className="p-8 align-top text-center">
                          {n.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-8 align-top text-center">
                          <div className="flex justify-center gap-4">
                            <button onClick={() => handleEdit(n)} className="text-blue-500 hover:text-blue-700">
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(n._id)} className="text-red-500 hover:text-red-700">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
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
