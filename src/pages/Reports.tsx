import React, { useEffect, useState } from "react";
import axios from "axios";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useSearchParams } from "react-router-dom";

/**
 * Reports.tsx – FULLY FIXED with proper pagination and URL parameter handling
 */

export const Reports: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [searchParams] = useSearchParams();

  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [currentPageData, setCurrentPageData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [providerOptions, setProviderOptions] = useState<string[]>([]);
  const statusOptions = ["Success", "Failed", "Pending"];

  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const tokenHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { token } : {};
  };

  const mapApiItem = (item: any) => ({
    id: item.txnId || item._id || item._id,
    number: item.userId?.phone || item.recipientId?.phone || "N/A",
    amount: item.txnAmount ?? item.amount ?? 0,
    status:
      item.txnStatus === "TXN_SUCCESS"
        ? "Success"
        : item.txnStatus === "PENDING"
        ? "Pending"
        : "Failed",
    date: item.createdAt ? item.createdAt.substring(0, 10) : item.date,
    txnName: item.txnName,
    raw: item,
  });

  // Update page data - shows 20 items per page
  const updatePageData = (data: any[], pageNumber: number) => {
    const startIndex = (pageNumber - 1) * limit;
    const endIndex = startIndex + limit;
    const pageItems = data.slice(startIndex, endIndex);

    setCurrentPageData(pageItems);
    setLastPage(Math.ceil(data.length / limit));
  };

  // Fetch ALL transactions at once
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5005/api/txn/list/all?limit=10000",
        { headers: tokenHeader() },
      );

      const api = res.data?.Data;
      console.log(api);

      const pageData = api?.data || api?.docs || [];

      const mapped = pageData.map(mapApiItem);

      setAllTransactions(mapped);

      // Extract unique providers
      const uniqueProviders = [
        ...new Set(
          mapped
            .map((item) => (item.txnName ? String(item.txnName).trim() : ""))
            .filter(Boolean),
        ),
      ];
      //@ts-ignore
      setProviderOptions(uniqueProviders);

      setFilteredList([]);
      setFiltersApplied(false);
      setPage(1);
      updatePageData(mapped, 1);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setAllTransactions([]);
      setCurrentPageData([]);
    } finally {
      setLoading(false);
    }
  };

  // Check URL parameters and auto-apply filters
  useEffect(() => {
    const phoneFromUrl = searchParams.get("phone");
    const autoFilter = searchParams.get("autoFilter");

    if (autoFilter === "true" && phoneFromUrl) {
      setSearch(phoneFromUrl);
      setIsFilterOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Auto-apply filter when search changes from URL params
  useEffect(() => {
    const phoneFromUrl = searchParams.get("phone");
    const autoFilter = searchParams.get("autoFilter");

    if (autoFilter === "true" && phoneFromUrl && allTransactions.length > 0) {
      applyFilter();
    }
  }, [search, allTransactions]);

  // Apply Filters + Search
  const applyFilter = () => {
    let filtered = [...allTransactions];

    if (search.trim() !== "") {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          String(item.number).toLowerCase().includes(s) ||
          String(item.id).toLowerCase().includes(s),
      );
    }

    if (provider) {
      filtered = filtered.filter(
        (item) =>
          item.txnName && item.txnName.toLowerCase() === provider.toLowerCase(),
      );
    }

    if (amount.trim() !== "") {
      filtered = filtered.filter(
        (item) => String(item.amount) === String(amount),
      );
    }

    if (status) {
      filtered = filtered.filter(
        (item) => item.status.toLowerCase() === status.toLowerCase(),
      );
    }

    if (fromDate) {
      filtered = filtered.filter(
        (item) => new Date(item.date) >= new Date(fromDate),
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (item) => new Date(item.date) <= new Date(toDate),
      );
    }

    setFilteredList(filtered);
    setFiltersApplied(true);
    setPage(1);
    updatePageData(filtered, 1);
  };

  const resetFilters = () => {
    setProvider("");
    setAmount("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setSearch("");
    setFilteredList([]);
    setFiltersApplied(false);
    setPage(1);
    updatePageData(allTransactions, 1);
  };

  const gotoPrev = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      const dataToUse = filtersApplied ? filteredList : allTransactions;
      updatePageData(dataToUse, newPage);
    }
  };

  const gotoNext = () => {
    if (page < lastPage) {
      const newPage = page + 1;
      setPage(newPage);
      const dataToUse = filtersApplied ? filteredList : allTransactions;
      updatePageData(dataToUse, newPage);
    }
  };

  const goToPage = (pageNum: number) => {
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= lastPage) {
      setPage(pageNum);
      const dataToUse = filtersApplied ? filteredList : allTransactions;
      updatePageData(dataToUse, pageNum);
    }
  };

  return (
    <AdminLayout title="Reports">
      <div className="p-6">
        <div className="admin-card">
          {/* FILTER HEADER */}
          <div className="border-b border-border">
            <div
              className="admin-card p-4 flex justify-between items-center cursor-pointer mb-4"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <h3 className="text-lg font-semibold">Filters</h3>
              <span>{isFilterOpen ? "▲" : "▼"}</span>
            </div>

            {/* FILTER BODY */}
            {isFilterOpen && (
              <div className="admin-card p-6 mb-6 space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full border border-border p-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full border border-border p-2 rounded-lg"
                    />
                  </div>
                </div>

                {/* Search */}
                <div>
                  <label className="text-sm text-muted-foreground">
                    Search (Mobile / TxnID)
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-border p-2 rounded-lg"
                    placeholder="Enter mobile number or txnId"
                  />
                </div>

                {/* Provider */}
                <div>
                  <label className="text-sm text-muted-foreground">
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full border border-border p-2 rounded-lg"
                  >
                    <option value="">Select Provider</option>
                    {providerOptions.map((item, index) => (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm text-muted-foreground">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-border p-2 rounded-lg"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-border p-2 rounded-lg"
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map((item, index) => (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                  <button onClick={applyFilter} className="btn-primary flex-1">
                    Apply Filters
                  </button>

                  <button
                    onClick={resetFilters}
                    className="btn-secondary flex-1"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TRANSACTIONS */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              Transactions (page {page}) - Total:{" "}
              {filtersApplied ? filteredList.length : allTransactions.length}
            </h3>

            <div className="bg-accent/20 rounded-lg divide-y divide-border">
              {loading ? (
                <div className="p-6 text-center">Loading transactions...</div>
              ) : currentPageData.length === 0 ? (
                <div className="p-6 text-center">No transactions found.</div>
              ) : (
                currentPageData.map((txn) => (
                  <div
                    key={txn.id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">{txn.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.number}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">₹{txn.amount}</p>
                      <p
                        className={`text-xs ${
                          txn.status === "Success"
                            ? "text-green-600"
                            : txn.status === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {txn.status}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {txn.date}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                onClick={gotoPrev}
                disabled={page <= 1 || loading}
                className={`px-4 py-2 rounded-lg border ${
                  page <= 1 || loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                &lt; Previous
              </button>

              <div className="text-sm">
                Page <strong>{page}</strong> of <strong>{lastPage}</strong>
              </div>

              <button
                onClick={gotoNext}
                disabled={page >= lastPage || loading}
                className={`px-4 py-2 rounded-lg border ${
                  page >= lastPage || loading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Next &gt;
              </button>
            </div>

            {/* Go to Page */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <label className="text-sm text-muted-foreground">
                Go to page
              </label>
              <input
                type="number"
                min={1}
                max={lastPage}
                value={page}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  goToPage(v);
                }}
                className="w-20 border border-border p-1 rounded-lg text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;