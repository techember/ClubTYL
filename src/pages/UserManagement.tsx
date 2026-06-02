import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, MinusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // global search source

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState("none");

  const itemsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const [visibleMpin, setVisibleMpin] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Wallet states
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">(
    "credit",
  );
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionNote, setTransactionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  const [TotalPages, setTotalPages] = useState<number>(1);
  const [TotalRecords, setTotalRecords] = useState<number>(0);
  const [Limit, setLimit] = useState<number>(itemsPerPage);

  const TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGQwYjRmOTczZTFkMTc3M2Q0MmQ1MjIiLCJpYXQiOjE3NjUzNzI3Njh9.vKmrXgPsprmMMLNh3rNDtxQQb2oHJBW5XVFJWdnzak8";

  // ---------------------------------------------------------
  // BACKEND PAGINATION (kept for compatibility)
  // ---------------------------------------------------------
  const loadUsers = async (page: number) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5005/api/user/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: TOKEN,
        },
        body: JSON.stringify({ page, limit: itemsPerPage }),
      });

      const json = await res.json();
      console.log("Users list response:", json);

      const userList = json?.Data?.data || [];
      const pagination = json?.Data?.pagination || {};

      setUsers(userList);
      setTotalPages(pagination.totalPages || 1);
      setTotalRecords(pagination.total || 0);
      setLimit(pagination.limit || itemsPerPage);
    } catch (err) {
      toast({
        title: "Error",
        description: "Unable to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOAD ALL USERS ONCE (for global search)
  // ---------------------------------------------------------
  const loadAllUsers = async () => {
    try {
      // request a large limit to fetch all; safe for <2000 users
      const res = await fetch("http://localhost:5005/api/user/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: TOKEN,
        },
        body: JSON.stringify({ page: 1, limit: 5000 }),
      });

      const json = await res.json();
      const list = json?.Data?.data || [];
      setAllUsers(list);
    } catch (err) {
      // silent - we keep existing behavior but global search may be empty
      console.error("loadAllUsers error", err);
    }
  };

  useEffect(() => {
    // keep initial paginated load and also load all for search
    loadUsers(currentPage);
    loadAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // keep paginated reload on page change (original behavior)
    loadUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ---------------------------------------------------------
  // UPDATE USER STATUS
  // ---------------------------------------------------------
  const updateUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      // optimistic update in both lists
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u)),
      );
      setAllUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u)),
      );

      const res = await fetch(
        "http://localhost:5005/api/user/status-update",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            token: TOKEN,
          },
          body: JSON.stringify({ userId, status: newStatus }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Status Updated",
        description: `User is now ${newStatus ? "Active" : "Inactive"}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Unable to update status.",
        variant: "destructive",
      });

      // revert by reloading current page and all users
      loadUsers(currentPage);
      loadAllUsers();
    }
  };

  // ---------------------------------------------------------
  // GET USER WALLET
  // ---------------------------------------------------------
  const fetchUserWallet = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5005/api/wallet/wallet-txn?userId=${userId}`,
        { headers: { token: TOKEN } },
      );

      const data = await res.json();
      setWalletData(data);
      setSelectedUserId(userId);
      setWalletModalOpen(true);
    } catch {
      toast({
        title: "Wallet Error",
        description: "Failed to load wallet.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------------------------------------
  // CREDIT / DEBIT WALLET
  // ---------------------------------------------------------
  const manageUserWallet = async () => {
    if (!transactionAmount || Number(transactionAmount) <= 0) {
      toast({
        title: "Invalid",
        description: "Enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const body = {
        userId: walletData?.Data?.wallet?.userId,
        amount: Number(transactionAmount),
        type: transactionType,
      };

      const res = await fetch(
        "http://localhost:5005/api/admin/manage-user-wallet",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: TOKEN,
          },
          body: JSON.stringify(body),
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.Remarks);

      toast({
        title: "Success",
        description: `Wallet ${transactionType}ed successfully.`,
      });

      setTransactionModalOpen(false);
      setTransactionAmount("");

      await fetchUserWallet(walletData.Data.wallet.userId);
      await loadUsers(currentPage);
      await loadAllUsers();
    } catch (err: any) {
      toast({
        title: "Wallet Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------
  // SEARCH + SORT (use allUsers for global search)
  // ---------------------------------------------------------
  let filteredUsers = [...allUsers];

  filteredUsers = filteredUsers.filter((u) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const combined = `
      ${u.firstName} ${u.lastName}
      ${u.email}
      ${u.phone}
      ${u.referBy}
      ${u._id}
      ${u.ipAddress}
    `.toLowerCase();
    return combined.includes(s);
  });

  if (sortFilter === "latest") {
    filteredUsers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  if (sortFilter === "oldest") {
    filteredUsers.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  if (sortFilter === "active") {
    filteredUsers = filteredUsers.filter((u) => u.status === true);
  }

  if (sortFilter === "inactive") {
    filteredUsers = filteredUsers.filter((u) => !u.status);
  }

  // ---------------------------------------------------------
  // FRONTEND PAGINATION AFTER FILTERING
  // ---------------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // If search or sort changes, reset page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortFilter]);

  const toggleMpin = (id: string) =>
    setVisibleMpin((p) => ({ ...p, [id]: !p[id] }));

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return (
      dt.toLocaleDateString() +
      " • " +
      dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filteredUsers);
    saveAs(new Blob([csv]), "users.csv");
  };

  const handleWalletHistoryRedirect = () => {
    const u =
      allUsers.find((x) => x._id === selectedUserId) ||
      users.find((x) => x._id === selectedUserId);
    navigate(`/wallet?search=${u?.phone}&autoFilter=true`);
  };

  const handleTransactionsRedirect = () => {
    const u =
      allUsers.find((x) => x._id === selectedUserId) ||
      users.find((x) => x._id === selectedUserId);
    navigate(
      `/reports?userId=${selectedUserId}&phone=${u?.phone}&autoFilter=true`,
    );
  };

  // ---------------------------------------------------------
  // UI RENDER
  // ---------------------------------------------------------
  if (loading) {
    return (
      <AdminLayout title="Users">
        <div className="p-6">Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <div className="h-full">
        {" "}
        {/* MOBILE FULL SCROLL ADDED */}
        {/* Search + Sort */}
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search Users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={sortFilter} onValueChange={setSortFilter}>
              <SelectTrigger className="w-48 py-6 bg-muted/30 border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 backdrop-blur-xl border border-border/40 shadow-xl rounded-xl">
                <SelectItem value="none" className="focus:bg-primary/5 focus:text-primary rounded-lg my-1">No Sort</SelectItem>
                <SelectItem value="latest" className="focus:bg-primary/5 focus:text-primary rounded-lg my-1">Latest</SelectItem>
                <SelectItem value="oldest" className="focus:bg-primary/5 focus:text-primary rounded-lg my-1">Oldest</SelectItem>
                <SelectItem value="active" className="focus:bg-primary/5 focus:text-primary rounded-lg my-1">Active</SelectItem>
                <SelectItem value="inactive" className="focus:bg-primary/5 focus:text-primary rounded-lg my-1">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={exportCSV}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        {/* TABLE */}
        <div
          className="relative w-full overflow-x-auto rounded border"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="min-w-[1100px] md:min-w-[1400px] w-full admin-table">
            <thead className="bg-background shadow-sm md:sticky md:top-0 md:z-10">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Referred By</th>
                <th>Registered</th>
                <th>IP</th>
                <th>Status</th>
                <th>MPIN</th>
                <th>Balance</th>
                <th>Wallet</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u._id}>
                  <td className="whitespace-nowrap">
                    <ClipboardDocumentIcon
                      className="h-5 w-5 cursor-pointer"
                      onClick={() =>
                        navigator.clipboard.writeText(u._id) &&
                        toast({
                          title: "Copied",
                          description: "User ID copied",
                        })
                      }
                    />
                  </td>

                  <td className="whitespace-nowrap">
                    {u.firstName} {u.lastName}
                  </td>

                  <td className="whitespace-nowrap">{u.phone}</td>
                  <td className="whitespace-nowrap">{u.email}</td>
                  <td className="whitespace-nowrap">{u.referBy || "Not Referred"}</td>
                  <td className="whitespace-nowrap">{formatDate(u.createdAt)}</td>

                  <td className="whitespace-nowrap">{u.ipAddress}</td>

                  {/* STATUS */}
                  <td className="whitespace-nowrap">
                    <button
                      onClick={() => updateUserStatus(u._id, !u.status)}
                      className={`px-4 py-2 md:px-3 md:py-1 rounded text-white ${u.status
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                      {u.status ? "Active" : "Inactive"}
                    </button>
                  </td>

                  {/* MPIN */}
                  <td className="whitespace-nowrap">
                    {visibleMpin[u._id] ? u.mPin : "****"}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMpin(u._id)}
                    >
                      <EyeIcon className="h-3 w-3" />
                    </Button>
                  </td>

                  {/* BALANCE */}
                  <td className="whitespace-nowrap">₹{Number(u.wallet?.balance || 0).toFixed(2)}</td>

                  <td className="whitespace-nowrap">
                    <button
                      onClick={() => fetchUserWallet(u._id)}
                      className="p-2 md:p-1 hover:bg-gray-200 rounded"
                    >
                      <Wallet className="h-6 w-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between mt-4">
            <p>
              Showing {(currentPage - 1) * Limit + 1}–
              {Math.min(currentPage * Limit, filteredUsers.length)} of{" "}
              {filteredUsers.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* WALLET MODAL */}
      <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">Wallet Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-8 mt-4">
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground font-medium">Available Balance</span>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {walletData?.Data?.wallet?.userId}</span>
              </div>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                ₹{walletData?.Data?.wallet?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                className="btn-primary py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-green-500/20 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 transition-all hover:-translate-y-1"
                onClick={() => {
                  setTransactionType("credit");
                  setTransactionModalOpen(true);
                }}
              >
                <PlusIcon className="h-6 w-6" />
                <span className="font-semibold">Credit Wallet</span>
              </button>

              <button
                className="btn-secondary py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-0 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setTransactionType("debit");
                  setTransactionModalOpen(true);
                }}
              >
                <MinusIcon className="h-6 w-6" />
                <span className="font-semibold">Debit Wallet</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                className="p-3 rounded-xl border border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-primary transition-colors text-sm font-medium"
                onClick={handleWalletHistoryRedirect}
              >
                View History
              </button>
              <button
                className="p-3 rounded-xl border border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-primary transition-colors text-sm font-medium"
                onClick={handleTransactionsRedirect}
              >
                View Transactions
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TRANSACTION MODAL */}
      <Dialog
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
      >
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center mb-6">
              {transactionType === "credit" ? (
                <span className="text-emerald-600 flex items-center justify-center gap-2">
                  <PlusIcon className="h-6 w-6" /> Credit Amount
                </span>
              ) : (
                <span className="text-red-600 flex items-center justify-center gap-2">
                  <MinusIcon className="h-6 w-6" /> Debit Amount
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="text-2xl font-bold py-6 px-4 bg-muted/30 border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
                min="0"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Reason / Note</label>
              <Input
                type="text"
                placeholder="Enter transaction note..."
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                className="py-6 px-4 bg-muted/30 border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setTransactionModalOpen(false)}
                disabled={isProcessing}
                className="flex-1 py-6 rounded-xl border-border/50 hover:bg-muted/50"
              >
                Cancel
              </Button>

              <Button
                onClick={manageUserWallet}
                disabled={isProcessing}
                className={`flex-1 py-6 rounded-xl text-lg font-semibold shadow-lg transition-all hover:-translate-y-1 ${transactionType === "credit"
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/20"
                  : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/20"
                  }`}
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};
