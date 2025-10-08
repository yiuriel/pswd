import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';

export const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'rgba(10, 14, 39, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Box
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: 1, 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
            }
          }}
          onClick={handleHome}
        >
          <LockIcon sx={{ 
            color: '#6366f1',
            fontSize: 32,
            filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))',
          }} />
          <Typography
            variant="h5"
            component="div"
            sx={{ 
              fontWeight: 900,
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            SECURE VAULT
          </Typography>
        </Box>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 1, 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
              }}
            >
              Welcome, <span style={{ color: '#a855f7', fontWeight: 700 }}>{user?.username}</span>
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account menu"
              aria-controls="account-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
                }
              }}
            >
              <Avatar sx={{ 
                width: 36, 
                height: 36, 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: '2px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 700,
              }}>
                {user?.username?.charAt(0).toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>
            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  background: 'rgba(20, 25, 50, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '& .MuiMenuItem-root': {
                    color: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      background: 'rgba(99, 102, 241, 0.2)',
                    }
                  }
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleMenuClose}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="medium" sx={{ color: 'white' }}>
                    {user?.username}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {user?.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(99, 102, 241, 0.2)', my: 1 }} />
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1, color: '#ec4899' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={handleLogin}
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                px: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#a855f7',
                  background: 'rgba(168, 85, 247, 0.1)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Login
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleRegister}
              sx={{ 
                border: '2px solid #6366f1',
                color: '#6366f1',
                fontWeight: 700,
                px: 3,
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '2px solid #a855f7',
                  color: '#a855f7',
                  background: 'rgba(168, 85, 247, 0.15)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
                }
              }}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
