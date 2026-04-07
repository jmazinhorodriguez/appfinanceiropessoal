import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function subscribeToTransactions(userId: string, callback: (payload: any) => void) {
  const supabase = createClientComponentClient();
  
  const channel = supabase
    .channel('custom-insert-channel-transactions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToPortfolio(userId: string, callback: (payload: any) => void) {
  const supabase = createClientComponentClient();
  
  const channel = supabase
    .channel('custom-all-channel-portfolio')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'portfolio_assets', filter: `user_id=eq.${userId}` },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
