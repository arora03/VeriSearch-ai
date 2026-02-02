import { motion } from 'framer-motion';
import { Search, FileText, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Find answers across all your documents instantly',
  },
  {
    icon: FileText,
    title: 'Source Citations',
    description: 'Every answer is backed by verified references',
  },
  {
    icon: BarChart3,
    title: 'Data Insights',
    description: 'Visualize trends and patterns in your data',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data stays private and secure',
  },
];

export function EmptyChat() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
      >
        <span className="text-4xl">🔍</span>
      </motion.div>

      <h1 className="mb-2 font-display text-3xl font-bold">
        Welcome to VeriSearch
      </h1>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        Your enterprise knowledge assistant. Ask questions about your documents and get verified, cited answers.
      </p>

      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card flex items-start gap-3 rounded-2xl p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-2"
      >
        {[
          'What are our leave policies?',
          'Summarize Q4 financial results',
          'Show sales trends by region',
        ].map((suggestion) => (
          <button
            key={suggestion}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            {suggestion}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
