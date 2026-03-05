import { useEffect, useState, useRef } from 'react';
import { client } from './api/client';
import InventoryDashboard from './pages/Inventory/InventoryDashboard';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const authContainerRef = useRef<HTMLDivElement>(null);
  const hasRenderedAuth = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await client.auth.getSession();
        if (session.data?.user) {
          setUser(session.data.user);
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isChecking && !user && authContainerRef.current && !hasRenderedAuth.current) {
      hasRenderedAuth.current = true;
      client.auth.renderAuthUI(authContainerRef.current, {
        labels: {
          signIn: { 
            title: "Acesso ao Sistema", 
            subtitle: "Entre para gerenciar seu estoque",
            loginButton: "Entrar" 
          },
          signUp: { 
            title: "Criar Conta", 
            subtitle: "Comece agora mesmo",
            signUpButton: "Cadastrar" 
          },
        },
      }).catch(err => {
        console.error("Erro ao renderizar Auth UI:", err);
        hasRenderedAuth.current = false;
      });
    }
  }, [isChecking, user]);

  if (isChecking) {
    return (
      <div style={{ background: '#020617', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user) {
    return <InventoryDashboard />;
  }

  return (
    <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }} className="safe-area-top safe-area-bottom">
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(32px, 10vw, 48px)', fontWeight: '900', color: 'white', margin: '0', letterSpacing: '-0.05em' }}>
          SISTEMA<span style={{ color: '#2563eb' }}>CNR</span>
        </h1>
        <p style={{ color: '#64748b', fontWeight: 'bold', letterSpacing: '0.3em', fontSize: '10px', marginTop: '5px' }}>CONTROLE DE ESTOQUE PROFISSIONAL</p>
      </div>
      <div 
        ref={authContainerRef} 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          background: '#0f172a', 
          borderRadius: '2rem', 
          padding: '10px', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      ></div>
    </div>
  );
}

export default App;
