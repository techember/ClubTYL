import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

export const HomeNote = () => {
  const [noteText, setNoteText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchNote = async () => {
    try {
      const res = await fetch("https://api.clubtyl.techember.in/api/home-note");
      const data = await res.json();
      if (data.Data) {
        setNoteText(data.Data.text);
        setIsActive(data.Data.isActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNote();
  }, []);

  const handleUpdate = async () => {
    if (!noteText.trim()) return alert("Note text is required");
    
    setLoading(true);
    try {
      const res = await fetch("https://api.clubtyl.techember.in/api/home-note", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token: `${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text: noteText, isActive }),
      });

      const data = await res.json();
      if (data.Remarks) {
        alert("Home Note updated successfully!");
        fetchNote();
      } else {
        alert(data.message || "Failed to update note");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Home Note">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
        
        <div className="bg-white/90 backdrop-blur-sm border border-border/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
              Important Home Note
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              This note appears prominently on the app's home screen.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Note Text</label>
              <textarea
                placeholder="e.g. Welcome to ClubTYL!"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-white min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Visibility Status</label>
              <select
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className="w-full px-5 py-3.5 bg-muted/30 border border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none hover:bg-muted/50 focus:bg-white cursor-pointer"
              >
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
            </div>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 mt-4 bg-gradient-to-r from-primary to-violet-600 text-white disabled:opacity-70"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {loading ? "Updating..." : "Update Note"}
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
