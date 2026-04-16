import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * For turnkey_operator users: loads their assigned TurnkeyClient record
 * and derives the list of property IDs they are authorized to manage.
 */
export default function useTurnkeyOperator(user) {
  const [client, setClient] = useState(null);
  const [authorizedPropertyIds, setAuthorizedPropertyIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'turnkey_operator') return;
    setLoading(true);
    base44.entities.TurnkeyClient.list().then(clients => {
      // Find client record where this user's email is in operator_user_emails
      const match = clients.find(c => {
        const emails = (c.operator_user_emails || '').split(',').map(e => e.trim().toLowerCase());
        return emails.includes(user.email?.toLowerCase());
      });
      setClient(match || null);
      if (match) {
        // Build list of authorized property IDs from both property_ids field and primary property_id
        const ids = [];
        if (match.property_ids) {
          match.property_ids.split(',').map(s => s.trim()).filter(Boolean).forEach(id => ids.push(id));
        }
        if (match.property_id && !ids.includes(match.property_id)) {
          ids.push(match.property_id);
        }
        setAuthorizedPropertyIds(ids);
      }
      setLoading(false);
    });
  }, [user]);

  const canManageProperty = (propertyId) => authorizedPropertyIds.includes(propertyId);
  const selfApprove = client?.self_approve_moves !== false; // default true

  return { client, authorizedPropertyIds, loading, canManageProperty, selfApprove };
}