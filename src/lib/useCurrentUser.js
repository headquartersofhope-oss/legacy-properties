import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isInternal = user && ['housing_admin', 'housing_manager', 'housing_staff'].includes(user.role);
  const isAdmin = user?.role === 'housing_admin';
  const isManager = user?.role === 'housing_manager';
  const isStaff = user?.role === 'housing_staff';
  const isPartner = user?.role === 'referral_partner';

  return { user, loading, isInternal, isAdmin, isManager, isStaff, isPartner };
}