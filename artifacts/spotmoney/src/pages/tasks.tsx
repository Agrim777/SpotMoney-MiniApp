import { useState } from 'react';
import { useSpotMoney } from '@/hooks/use-spot-money';
import { useToast } from '@/hooks/use-toast';
import { Check, Coins, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Tasks() {
  const { state, tasks, completeTask } = useSpotMoney();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  if (!state) return null;

  const handleTaskClick = (task: (typeof tasks)[number]) => {
    if (state.completedTaskIds.includes(task.id) || verifying === task.id) return;
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(task.actionUrl);
    } else {
      window.open(task.actionUrl, '_blank');
    }
    setVerifying(task.id);
  };

  const handleVerify = (taskId: number) => {
    setCompleting(taskId);
    // Small delay to feel responsive
    setTimeout(() => {
      const { coinsEarned, error } = completeTask(taskId);
      if (error === 'already_done') {
        toast({ description: 'Task already completed!' });
      } else if (coinsEarned > 0) {
        toast({ description: `+${coinsEarned} coins earned!` });
      }
      setVerifying(null);
      setCompleting(null);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 pb-28 space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Tasks</h1>
        <p className="text-muted-foreground text-sm">Complete tasks to earn extra coins. One-time rewards.</p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const done = state.completedTaskIds.includes(task.id);
          const isVerifying = verifying === task.id;
          const isCompleting = completing === task.id;

          return (
            <div
              key={task.id}
              className={`bg-card border rounded-2xl flex flex-col overflow-hidden transition-all ${
                done ? 'border-border/50 opacity-50' : 'border-border shadow-md'
              }`}
            >
              <div
                className={`p-4 flex items-center gap-4 ${
                  !done && !isVerifying ? 'cursor-pointer hover:bg-secondary/30 active:bg-secondary/50' : ''
                }`}
                onClick={() => !done && !isVerifying && handleTaskClick(task)}
                role={!done && !isVerifying ? 'button' : 'presentation'}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? 'bg-secondary' : 'bg-primary/10'
                  }`}
                >
                  {done ? (
                    <Check className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Zap className="w-6 h-6 text-primary fill-primary/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate text-sm">{task.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                </div>
                {!done && (
                  <div className="flex items-center gap-1 font-bold text-primary shrink-0 bg-primary/10 px-2.5 py-1.5 rounded-lg text-sm border border-primary/20">
                    <Coins className="w-3.5 h-3.5" />
                    +{task.reward}
                  </div>
                )}
              </div>

              {isVerifying && !done && (
                <div className="p-4 bg-secondary/20 border-t border-border flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-medium">Did you complete it?</span>
                  <button
                    onClick={() => handleVerify(task.id)}
                    disabled={isCompleting}
                    className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCompleting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
