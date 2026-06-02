import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  UsersIcon, CreditCardIcon, BanknotesIcon,
  WalletIcon, ClockIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { mockDashboardStats, mockChartData } from '@/mocks/data';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Responsive Stat Card
const StatCard = ({ title, value, growth, icon: Icon, trend = 'up', onClick, index }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
    className="admin-card p-6 cursor-pointer relative overflow-hidden group"
    onClick={onClick}
  >
    {/* Background Decorative Icon */}
    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
      <Icon className="w-32 h-32 text-primary" />
    </div>

    <div className="flex items-start justify-between gap-4 relative z-10">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-2 text-foreground break-all">
          {value}
        </p>
      </div>

      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </motion.div>
);


// Quick Action Button
const QuickAction = ({ title, icon: Icon, onClick }) => (
  <motion.button
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="admin-card p-4 hover:bg-primary/5 transition-colors text-left group border border-border/50 hover:border-primary/30"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary group-hover:to-violet-500 transition-all duration-300">
        <Icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
      </div>
      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{title}</span>
    </div>
  </motion.button>
);


// Chart config
const chartConfig = {
  value: { label: 'Value', color: 'hsl(var(--primary))' },
  amount: { label: 'Amount', color: 'hsl(var(--primary))' },
};


export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

      if (useMock) {
        setStats(mockDashboardStats);
        setCharts(mockChartData);
        return;
      }

      try {
        // 1. Fetch Dashboard Stats
        const response = await fetch("http://localhost:5005/api/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const json = await response.json();
        const data = json.Data;
        const usersSection = data[0];
        const rechargeSection = data[1];
        const billSection = data[2];
        const addMoneySection = data[3];

        // 2. Fetch Users for Balance
        const usersResponse = await fetch("http://localhost:5005/api/user/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token") || "",
          },
          body: JSON.stringify({ page: 1, limit: 5000 }),
        });
        const usersJson = await usersResponse.json();
        const userList = usersJson?.Data?.data || [];
        const calculatedTotalBalance = userList.reduce((sum: number, user: any) => sum + (user.wallet?.balance || 0), 0);

        const mappedStats = {
          totalUsers: usersSection.count ?? 0,
          activeUsers: usersSection.Active ?? 0,
          primeUsers: usersSection.Prime ?? 0,
          todayUsers: usersSection.TodayUser ?? 0,
          totalTransactions: rechargeSection.recharge + billSection.recharge + addMoneySection.recharge,
          totalRevenue: rechargeSection.amount + billSection.amount + addMoneySection.amount,
          totalBalance: calculatedTotalBalance,
          userGrowth: 0,
          transactionGrowth: 0,
          revenueGrowth: 0,
          balanceGrowth: 0,
          pendingKyc: 0,
          kycGrowth: 0,
        };

        setStats(mappedStats);
        setCharts(mockChartData);

      } catch (error) {
        console.error("Dashboard fetch failed:", error);
      }
    };

    fetchDashboard();
  }, []);

  if (!stats || !charts) return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  // Quick action buttons
  const quickActions = [
    { title: 'Wallet Topup', icon: WalletIcon, action: () => navigate('/wallet') },
    { title: 'Transaction History', icon: ClockIcon, action: () => navigate('/reports') },
  ];

  return (
    <AdminLayout title="Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            growth={stats.userGrowth}
            icon={UsersIcon}
            onClick={() => navigate('/users')}
            index={0}
          />

          <StatCard
            title="Transactions"
            value={stats.totalTransactions.toLocaleString()}
            growth={stats.transactionGrowth}
            icon={CreditCardIcon}
            onClick={() => navigate('/reports')}
            index={1}
          />

          <StatCard
            title="Revenue"
            value={`₹${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            growth={stats.revenueGrowth}
            icon={BanknotesIcon}
            onClick={() => navigate('/reports')}
            index={2}
          />

          <StatCard
            title="Balance Total"
            value={`₹${stats.totalBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`}
            growth={stats.balanceGrowth}
            icon={WalletIcon}
            onClick={() => navigate('/wallet')}
            index={3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Transaction Trends */}
          <motion.div variants={itemVariants} className="admin-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Transaction Trends</h3>
              <select className="bg-muted/10 border-none text-sm rounded-lg px-2 py-1 outline-none">
                <option>This Year</option>
              </select>
            </div>

            <ChartContainer config={chartConfig} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.transactions}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </motion.div>


          {/* Weekly Wallet Loads */}
          <motion.div variants={itemVariants} className="admin-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Weekly Wallet Loads</h3>
            </div>

            <ChartContainer config={chartConfig} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.walletLoads}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorAmount)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="admin-card p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((qa, idx) => (
              <QuickAction
                key={idx}
                title={qa.title}
                icon={qa.icon}
                onClick={qa.action}
              />
            ))}
          </div>
        </motion.div>

      </motion.div>
    </AdminLayout>
  );
};
