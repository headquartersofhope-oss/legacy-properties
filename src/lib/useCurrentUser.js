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

  const isInternal = user && ['super_admin', 'admin', 'housing_admin', 'housing_manager', 'property_manager', 'intake_coordinator'].includes(user.role);
  const isAdmin = user && ['super_admin', 'admin', 'housing_admin'].includes(user.role);
  const isManager = user?.role === 'housing_manager';
  const isPropertyManager = user?.role === 'property_manager';
  const isIntakeCoordinator = user?.role === 'intake_coordinator';
  const isPartner = user?.role === 'referral_partner_user';
  const isApplicant = user?.role === 'applicant_user';

  return { user, loading, isInternal, isAdmin, isManager, isPropertyManager, isIntakeCoordinator, isPartner, isApplicant };
}