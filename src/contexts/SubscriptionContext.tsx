import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  isFreeTier: boolean;
  isProTier: boolean;
  isProPlusTier: boolean;
  tierLabel: string;
  tierPrice: string;
}

const STORAGE_KEY = 'vyk_subscription_tier';

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: 'free',
  setTier: () => {},
  isFreeTier: true,
  isProTier: false,
  isProPlusTier: false,
  tierLabel: 'Free',
  tierPrice: '$0',
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [tier, setTierState] = useState<SubscriptionTier>('free');

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.uid}`);
      if (saved === 'pro' || saved === 'pro_plus') {
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
    if (tierParam === 'pro' || tierParam === 'pro_plus') {
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

  const tierLabel = tier === 'pro_plus' ? 'Pro Plus' : tier === 'pro' ? 'Pro' : 'Free';
  const tierPrice = tier === 'pro_plus' ? '$27.99 (Lifetime)' : tier === 'pro' ? '$14.99/mo' : '$0';

  return (
    <SubscriptionContext.Provider value={{
      tier,
      setTier,
      isFreeTier: tier === 'free',
      isProTier: tier === 'pro',
      isProPlusTier: tier === 'pro_plus',
      tierLabel,
      tierPrice,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscription = () => useContext(SubscriptionContext);
