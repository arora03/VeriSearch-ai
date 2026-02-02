import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Analytics() {
  const { documents, chats, datasets } = useChatStore();

  // Compute stats
  const docsByType = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(docsByType).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  const chatsByMonth = chats.reduce((acc, chat) => {
    const month = new Date(chat.createdAt).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chatData = Object.entries(chatsByMonth).map(([name, value]) => ({ name, value }));

  const COLORS = ['hsl(210, 60%, 65%)', 'hsl(150, 35%, 60%)', 'hsl(45, 60%, 60%)', 'hsl(0, 60%, 60%)'];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-display text-3xl font-bold">Analytics</h1>
              <p className="mt-1 text-muted-foreground">
                Overview of your knowledge base usage and activity
              </p>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Total Documents', value: documents.length, icon: FileText, color: 'primary' },
                { title: 'Total Chats', value: chats.length, icon: MessageSquare, color: 'accent' },
                { title: 'Datasets', value: datasets.length, icon: BarChart3, color: 'secondary' },
                { title: 'Ready Files', value: documents.filter(d => d.status === 'ready').length, icon: TrendingUp, color: 'ocean' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl border border-white/10 p-5 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${item.color}/20`}>
                      <item.icon className={`h-5 w-5 text-${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="font-display text-2xl font-bold">{item.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Document Types Pie Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl border border-white/10 p-6 shadow-xl"
              >
                <h3 className="font-display text-lg font-semibold mb-4">Documents by Type</h3>
                {typeData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    No documents uploaded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {typeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Chat Activity Bar Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card rounded-2xl border border-white/10 p-6 shadow-xl"
              >
                <h3 className="font-display text-lg font-semibold mb-4">Chat Activity</h3>
                {chatData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    No chats yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chatData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(210, 60%, 65%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
