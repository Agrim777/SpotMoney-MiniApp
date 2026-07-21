import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { SpotMoneyProvider } from '@/hooks/use-spot-money';
import { TelegramInitializer } from '@/hooks/use-telegram';
import { Layout } from '@/components/layout';

import Home from '@/pages/home';
import Earn from '@/pages/earn';
import Tasks from '@/pages/tasks';
import Referral from '@/pages/referral';
import Withdraw from '@/pages/withdraw';

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/earn" component={Earn} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/referral" component={Referral} />
        <Route path="/withdraw" component={Withdraw} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <SpotMoneyProvider>
        <TelegramInitializer />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </SpotMoneyProvider>
    </TooltipProvider>
  );
}

export default App;
