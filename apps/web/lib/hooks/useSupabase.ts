import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useSupabase() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return { supabase, user, loading };
}

export function useTransactions(filters?: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    async function fetchTransactions() {
      setLoading(true);
      let query = supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });

      if (filters?.type && filters.type !== 'todos') {
        query = query.eq('type', filters.type);
      }
      if (filters?.category && filters.category !== 'todas') {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data, error } = await query.limit(50); // limit 50 initially
      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    }

    // Debounce basic
    const timer = setTimeout(() => {
       fetchTransactions();
    }, 300);

    return () => clearTimeout(timer);
  }, [supabase, user, filters?.type, filters?.category, filters?.search]);

  return { transactions, loading };
}

export function usePortfolio() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    if (!user) return;

    async function fetchPortfolio() {
      const { data, error } = await supabase.from('portfolio_assets').select('*').eq('user_id', user.id);
      if (!error && data && data.length > 0) {
          const tickers = data.map(a => a.ticker).join(',');
          const res = await fetch(`/api/investimentos/prices?tickers=${tickers}`);
          const { prices } = await res.json();
          
          const enriched = data.map(asset => ({
              ...asset,
              current_price: prices[asset.ticker] || asset.average_price,
              profit_loss: (prices[asset.ticker] || asset.average_price) - asset.average_price
          }));
          setAssets(enriched);
      } else {
          setAssets([]);
      }
      setLoading(false);
    }

    fetchPortfolio();
  }, [supabase, user]);

  return { assets, loading };
}

export function useTaxSummary(year: number) {
   const [summary, setSummary] = useState<any>({
      fii_income: 0,
      stock_swing_profit: 0,
      stock_day_profit: 0,
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
       setLoading(false);
   }, [year]);

   return { summary, loading };
}
