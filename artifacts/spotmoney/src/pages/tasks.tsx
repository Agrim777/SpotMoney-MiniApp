import { useGetUserTasks, useCompleteTask, getGetUserTasksQueryKey, getGetUserQueryKey } from "@workspace/api-client-react";
import { useTelegramId } from "@/hooks/use-telegram";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Coins, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Tasks() {
  const telegramId = useTelegramId();
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useGetUserTasks(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserTasksQueryKey(telegramId) } });
  const completeTask = useCompleteTask();
  const [verifying, setVerifying] = useState<number | null>(null);

  const handleTaskClick = (task: any) => {
    if (task.completed || verifying === task.id) return;
    
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(task.actionUrl);
    } else {
      window.open(task.actionUrl, '_blank');
    }

    setVerifying(task.id);
  };

  const handleVerify = (taskId: number) => {
    completeTask.mutate(
      { telegramId, taskId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
          setVerifying(null);
        },
        onError: () => {
          setVerifying(null);
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground flex items-center justify-center min-h-[50vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.2 }} className="p-6 pb-28 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Tasks</h1>
        <p className="text-muted-foreground text-sm">Complete simple tasks to earn extra coins.</p>
      </div>

      <div className="space-y-3">
        {tasks?.map((task) => (
          <div key={task.id} className={`bg-card border rounded-2xl flex flex-col overflow-hidden transition-all ${task.completed ? 'border-border/50 opacity-50' : 'border-border shadow-md'}`}>
            <div 
              className={`p-4 flex items-center gap-4 ${!task.completed && verifying !== task.id ? 'cursor-pointer hover:bg-secondary/30 active:bg-secondary/50' : ''}`}
              onClick={() => !task.completed && verifying !== task.id && handleTaskClick(task)}
              role={!task.completed && verifying !== task.id ? "button" : "presentation"}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${task.completed ? 'bg-secondary' : 'bg-primary/10'}`}>
                {task.completed ? <Check className="w-6 h-6 text-muted-foreground" /> : <Zap className="w-6 h-6 text-primary fill-primary/20" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate text-sm">{task.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
              </div>
              
              {!task.completed && (
                <div className="flex items-center gap-1 font-bold text-primary shrink-0 bg-primary/10 px-2.5 py-1.5 rounded-lg text-sm border border-primary/20">
                  <Coins className="w-3.5 h-3.5" />
                  +{task.reward}
                </div>
              )}
            </div>

            {verifying === task.id && !task.completed && (
              <div className="p-4 bg-secondary/20 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Did you complete the action?</span>
                <button 
                  onClick={() => handleVerify(task.id)}
                  disabled={completeTask.isPending}
                  className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {completeTask.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Mark Complete</>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
        {tasks?.length === 0 && (
          <div className="text-center py-12 text-sm font-medium text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            No tasks available right now.<br/>Check back later!
          </div>
        )}
      </div>
    </motion.div>
  );
}
