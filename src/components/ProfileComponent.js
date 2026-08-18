import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography, Button, Container, Divider, Chip, IconButton, Tooltip } from '@mui/material';
import { Mail, User, Calendar, Settings, LogOut, Star, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const G = 'linear-gradient(135deg, #f59e0b, #d97706)';
const GOLD = '#f59e0b';
const GLASS = { background: 'rgba(248, 246, 240, 0.65)', border: '1px solid rgba(232, 160, 32, 0.15)', borderRadius: '16px' };

const ProfileComponent = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Typography sx={{ color: '#64748b' }}>Loading profile…</Typography>
    </Box>
  );

  if (!user) return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h4" sx={{ color: '#111111', fontWeight: 800, mb: 1 }}>Welcome</Typography>
        <Typography sx={{ color: '#64748b', mb: 4 }}>Please sign in to access your profile</Typography>
        <Button variant="contained" size="large" sx={{ background: G, borderRadius: '50px', px: 4, py: 1.5, fontWeight: 700 }}>
          Sign In
        </Button>
      </Box>
    </Container>
  );

  const details = [
    { icon: <Mail size={18} />, label: 'Email', value: user.email || user.username || 'N/A', color: '#f59e0b' },
    { icon: <User size={18} />, label: 'User ID', value: user.userId || user.uid || 'N/A', color: '#d97706' },
    { icon: <Calendar size={18} />, label: 'Member Since', value: new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), color: GOLD },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ ...GLASS, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #111111 0%, #1e1e1e 60%, #2a2a2a 100%)',
          position: 'relative', overflow: 'hidden', px: { xs: 3, md: 6 }, py: 6,
          borderBottom: '1px solid rgba(232, 160, 32, 0.15)',
        }}>
          {/* Kente pattern hint */}
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -60, left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email || user.username}`}
                sx={{ width: 100, height: 100, border: '3px solid rgba(245,158,11,0.4)', boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}
              />
              <Tooltip title="Edit Profile Picture" placement="right">
                <IconButton size="small" sx={{
                  position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
                  background: 'rgba(245,158,11,0.9)', color: '#111111',
                  '&:hover': { background: '#f59e0b' },
                }}>
                  <Edit size={13} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box>
              <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, letterSpacing: '-0.02em', mb: 0.5 }}>
                {user.username || user.email || 'User'}
              </Typography>
              <Typography sx={{ color: 'rgba(17, 17, 17, 0.7)', fontSize: '0.9rem' }}>{user.email || ''}</Typography>
              <Chip label="Free Plan" size="small" sx={{ mt: 1, background: 'rgba(245,158,11,0.15)', color: GOLD, border: `1px solid rgba(245,158,11,0.4)`, fontWeight: 700, fontSize: '0.72rem', borderRadius: '50px' }} />
            </Box>
          </Box>
        </Box>

        {/* Details */}
        <Box sx={{ px: { xs: 3, md: 6 }, pt: 4, pb: 2 }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>Account Details</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {details.map(({ icon, label, value, color }) => (
              <Box key={label} sx={{
                display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 2,
                background: 'rgba(17, 17, 17, 0.02)', border: '1px solid rgba(17, 17, 17, 0.06)',
                borderRadius: '12px', transition: 'all 0.2s ease',
                '&:hover': { background: 'rgba(17, 17, 17, 0.04)', borderColor: `${color}30` },
              }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                  {icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                  <Typography sx={{ color: '#111111', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(17,17,17,0.08)', mx: { xs: 3, md: 6 }, my: 1 }} />

        {/* Upgrade banner */}
        <Box sx={{ px: { xs: 3, md: 6 }, py: 3 }}>
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(249,115,22,0.08) 100%)',
            border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px',
            px: 3, py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
          }}>
            <Box>
              <Typography sx={{ color: '#111111', fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                ✨ Upgrade to Professional
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                Unlock unlimited processing, priority support, and custom voice models.
              </Typography>
            </Box>
            <Button startIcon={<Star size={16} />} sx={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000',
              fontWeight: 700, borderRadius: '50px', px: 3, py: 1.1, fontSize: '0.88rem', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
              '&:hover': { boxShadow: '0 6px 24px rgba(245,158,11,0.5)', transform: 'translateY(-1px)' },
            }}>
              Upgrade Now
            </Button>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ px: { xs: 3, md: 6 }, pb: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button startIcon={<Settings size={16} />} sx={{
            borderRadius: '50px', px: 2.5, py: 1, fontWeight: 600, fontSize: '0.88rem',
            borderColor: 'rgba(17, 17, 17, 0.1)', color: 'rgba(17, 17, 17, 0.6)',
            border: '1px solid rgba(17, 17, 17, 0.1)',
            '&:hover': { background: 'rgba(17, 17, 17, 0.05)', borderColor: 'rgba(17, 17, 17, 0.2)', color: '#111111' },
          }}>
            Settings
          </Button>
          <Button startIcon={<LogOut size={16} />}
            onClick={async () => {
              await logout();
              navigate('/get-started');
            }}
            sx={{
              borderRadius: '50px', px: 2.5, py: 1, fontWeight: 600, fontSize: '0.88rem',
              border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444',
              '&:hover': { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.5)' },
            }}>
            Logout
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ProfileComponent;
