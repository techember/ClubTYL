import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export const WalletManagement = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // FILTER STATES
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userId, setUserId] = useState("");
  const [txnType, setTxnType] = useState("");
  const [txnId, setTxnId] = useState("");
  const [search, setSearch] = useState("");
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);

  const token = localStorage.getItem("token");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);

  // --------------------------------------------
  // FETCH ALL WALLET HISTORY
  // --------------------------------------------
  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      console.log("Fetching all wallet transactions...");

      const res = await axios.get(
        `https://api.clubtyl.techember.in/api/wallet/wallet-txn?limit=10000`,
        { headers: { token } },
      );
      console.log("Fetch Response:", res.data);

      const txn = res.data?.Data?.txn ?? [];

      setAllTransactions(txn);
      setRequests(txn);
      setFilteredList([]);
      setFiltersApplied(false);
      setCurrentPage(1);
      setTotalPages(Math.ceil(txn.length / rowsPerPage));
    } catch (err) {
      console.error("Fetch Error:", err);
      setAllTransactions([]);
      setRequests([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  // Check URL parameters and auto-apply filters
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    const autoFilter = searchParams.get("autoFilter");

    if (autoFilter === "true" && searchFromUrl) {
      setSearch(searchFromUrl);
      setIsFilterOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  // Auto-apply filter when search changes from URL params
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    const autoFilter = searchParams.get("autoFilter");

    if (autoFilter === "true" && searchFromUrl && allTransactions.length > 0) {
      applyFilters();
    }
  }, [search, allTransactions]);

  // --------------------------------------------
  // APPLY FILTERS
  // --------------------------------------------
  const applyFilters = () => {
    let filtered = [...allTransactions];

    // Search filter
    if (search.trim() !== "") {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter((txn) => {
        const userName = `${txn.userId?.firstName || ""} ${txn.userId?.lastName || ""
          }`.toLowerCase();
        const phone = String(txn.userId?.phone || "").toLowerCase();
        const email = String(txn.userId?.email || "").toLowerCase();
        const transactionId = String(txn.txnId || "").toLowerCase();
        const userIdStr = String(txn.userId?._id || "").toLowerCase();

        return (
          userName.includes(s) ||
          phone.includes(s) ||
          email.includes(s) ||
          transactionId.includes(s) ||
          userIdStr.includes(s)
        );
      });
    }

    // Transaction ID filter
    if (txnId.trim() !== "") {
      const tid = txnId.trim().toLowerCase();
      filtered = filtered.filter((txn) =>
        String(txn.txnId || "")
          .toLowerCase()
          .includes(tid),
      );
    }

    // User ID filter
    if (userId.trim() !== "") {
      const uid = userId.trim().toLowerCase();
      filtered = filtered.filter((txn) =>
        String(txn.userId?._id || "")
          .toLowerCase()
          .includes(uid),
      );
    }

    // Transaction Type filter
    if (txnType) {
      filtered = filtered.filter(
        (txn) =>
          txn.txnType && txn.txnType.toLowerCase() === txnType.toLowerCase(),
      );
    }

    // From Date filter
    if (fromDate) {
      filtered = filtered.filter(
        (txn) => new Date(txn.createdAt) >= new Date(fromDate),
      );
    }

    // To Date filter
    if (toDate) {
      filtered = filtered.filter(
        (txn) => new Date(txn.createdAt) <= new Date(toDate),
      );
    }

    setFilteredList(filtered);
    setFiltersApplied(true);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
  };

  const resetFilters = () => {
    setUserId("");
    setTxnType("");
    setFromDate("");
    setToDate("");
    setTxnId("");
    setSearch("");
    setFilteredList([]);
    setFiltersApplied(false);
    setCurrentPage(1);
    setTotalPages(Math.ceil(allTransactions.length / rowsPerPage));
  };

  // --------------------------------------------
  // PAGINATION LOGIC
  // --------------------------------------------
  const currentData = filtersApplied ? filteredList : allTransactions;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = currentData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --------------------------------------------
  // MODAL LOGIC (unchanged)
  // --------------------------------------------
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"credit" | "debit" | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const openModal = (type: "credit" | "debit") => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setAmount("");
    setReason("");
    setSelectedUser("");
  };

  const handleSubmit = async () => {
    if (!selectedUser || !amount || !reason) return;

    try {
      const res = await axios.post(
        "https://api.clubtyl.techember.in/api/wallet/wallet-txn",
        {
          userId: selectedUser,
          amount: Number(amount),
          type: modalType,
          reason,
        },
        { headers: { token } },
      );

      const newTxn = res.data?.data;
      if (newTxn) {
        setRequests((prev) => [newTxn, ...prev]);
        setFilteredList((prev) => [newTxn, ...prev]);
      }

      closeModal();
    } catch (error) {
      console.error("Wallet Transaction Error:", error);
      alert("Wallet transaction failed.");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Wallet Management">
        <div className="p-6">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Wallet Management">
      <div className="h-full p-4 md:p-6 space-y-6 overflow-y-auto scrollbar-hide">
        {/* ⭐ FILTER SECTION */}
        <div
          className="admin-card p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <h3 className="text-lg font-semibold">Filters</h3>
          <span>{isFilterOpen ? "▲" : "▼"}</span>
        </div>

        {isFilterOpen && (
          <div className="admin-card p-6 space-y-4">
            {/* Search Field */}
            <div>
              <label className="text-sm text-muted-foreground">
                Search (Name / Phone / Email / TxnID)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border p-2 rounded-lg"
                placeholder="Search by name, phone, email, or transaction ID"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Transaction ID
              </label>
              <input
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                className="w-full border p-2 rounded-lg"
                placeholder="Search Txn ID"
              />
            </div>
            {/* User ID */}
            <div>
              <label className="text-sm text-muted-foreground">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border p-2 rounded-lg"
                placeholder="Search userId"
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label className="text-sm text-muted-foreground">
                Transaction Type
              </label>
              <select
                value={txnType}
                onChange={(e) => setTxnType(e.target.value)}
                className="w-full border p-2 rounded-lg"
              >
                <option value="">All</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={applyFilters} className="btn-primary flex-1">
                Apply Filters
              </button>
              <button onClick={resetFilters} className="btn-secondary flex-1">
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ⭐ WALLET HISTORY TABLE */}
        <div className="admin-card">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">
              Wallet History - Total:{" "}
              {filtersApplied ? filteredList.length : allTransactions.length}
            </h3>
          </div>

          <div
            className="relative w-full overflow-x-auto rounded border"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <table className="min-w-[1100px] w-full admin-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>User Name</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((txn: any) => (
                    <tr key={txn._id}>
                      <td className="font-mono">{txn.txnId}</td>
                      <td className="font-mono">
                        {txn.userId?.firstName + " " + txn.userId?.lastName}
                      </td>
                      <td>₹{txn.txnAmount}</td>
                      <td className="capitalize">{txn.txnType}</td>
                      <td>{txn.txnDesc}</td>
                      <td>
                        {txn.createdAt
                          ? new Date(txn.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ⭐ PAGINATION */}
          <div className="p-4 flex justify-center items-center gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span className="px-4 py-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {/* MODAL (unchanged) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {modalType === "credit" ? "Credit Wallet" : "Debit Wallet"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter userId"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border rounded-lg h-24"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!selectedUser || !amount || !reason}
                  className="btn-primary disabled:opacity-50"
                >
                  {modalType === "credit" ? "Credit" : "Debit"} Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};