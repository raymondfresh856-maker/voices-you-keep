import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type SubscriptionTier = 'free' | 'plus' | 'pro';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  isFreeTier: boolean;
  isPlusTier: boolean;
  isProTier: boolean;
  tierLabel: string;
  tierPrice: string;
}

const STORAGE_KEY = 'vyk_subscription_tier';

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: 'free',
  setTier: () => {},
  isFreeTier: true,
  isPlusTier: false,
  isProTier: false,
  tierLabel: 'Free',
  tierPrice: '$0',
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [tier, setTierState] = useState<SubscriptionTier>('free');

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.uid}`);
      if (saved === 'plus' || saved === 'pro') {
        setTierState(saved);
      } else {
        setTierState('free');
      }
    } else {
      setTierState('free');
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tierParam = params.get('tier');
    if (tierParam === 'plus' || tierParam === 'pro') {
      setTier(tierParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTier = (newTier: SubscriptionTier) => {
    setTierState(newTier);
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, newTier);
    }
  };

  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'plus' ? 'Plus' : 'Free';
  const tierPrice = tier === 'pro' ? '$9.99/mo' : tier === 'plus' ? '$4.99/mo' : '$0';

  return (
    <SubscriptionContext.Provider value={{
      tier,
      setTier,
      isFreeTier: tier === 'free',
      isPlusTier: tier === 'plus',
      isProTier: tier === 'pro',
      tierLabel,
      tierPrice,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => useContext(SubscriptionContext);
