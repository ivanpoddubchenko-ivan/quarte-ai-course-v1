import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Supabase redirects here after Google OAuth.
 * We verify the @inveritasoft.com domain, then send the user home.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return; }

      const email = session.user.email ?? '';
      if (!email.endsWith('@inveritasoft.com')) {
        // Wrong domain — sign out immediately
        supabase.auth.signOut().then(() => navigate('/login?error=domain'));
        return;
      }

      navigate('/', { replace: true });
    });
  }, [navigate]);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:14, color:'#6b7280' }}>
        Авторизація…
      </span>
    </div>
  );
}
