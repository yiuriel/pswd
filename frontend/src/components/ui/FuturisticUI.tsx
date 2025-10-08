/**
 * Futuristic UI Components
 * Reusable styled components for the futuristic theme
 */

import { Box, Button, Paper } from '@mui/material';
import type { ButtonProps, BoxProps, PaperProps } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Futuristic Background Container with slow gradient animation
 */
export const FuturisticBackground = styled(Box)<BoxProps>(() => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b4e 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  position: 'relative',
  overflow: 'hidden',
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

/**
 * Glassmorphic Container
 */
export const GlassContainer = styled(Paper)<PaperProps>(() => ({
  background: 'rgba(30, 35, 60, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
}));

/**
 * Primary Futuristic Button with gradient and animations
 */
export const FuturisticButton = styled(Button)<ButtonProps>(() => ({
  padding: '12px 40px',
  fontSize: '1.1rem',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  border: '2px solid transparent',
  borderRadius: '12px',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.6)',
    '&::before': {
      left: '100%',
    }
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1.02)',
  },
  '&:disabled': {
    background: 'rgba(107, 114, 128, 0.3)',
    color: 'rgba(255, 255, 255, 0.3)',
  }
}));

/**
 * Secondary Futuristic Button with outline style
 */
export const FuturisticButtonOutline = styled(Button)<ButtonProps>(() => ({
  padding: '12px 40px',
  fontSize: '1.1rem',
  fontWeight: 700,
  border: '2px solid #6366f1',
  borderRadius: '12px',
  color: '#6366f1',
  background: 'rgba(99, 102, 241, 0.05)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '12px',
    padding: '2px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-3px) scale(1.05)',
    background: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#a855f7',
    color: '#a855f7',
    boxShadow: '0 10px 40px rgba(168, 85, 247, 0.4)',
    '&::after': {
      opacity: 1,
    }
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1.02)',
  }
}));

/**
 * Gradient Text Component
 */
export const GradientText = styled(Box)(() => ({
  background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 900,
  letterSpacing: '-0.02em',
}));

/**
 * Feature Card with hover animations
 */
interface FeatureCardProps extends PaperProps {
  accentColor?: string;
}

export const FeatureCard = styled(Paper)<FeatureCardProps>(({ accentColor = '#6366f1' }) => ({
  background: 'rgba(30, 35, 60, 0.6)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${accentColor}33`,
  borderRadius: '20px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  padding: '32px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}dd)`,
    transform: 'scaleX(0)',
    transition: 'transform 0.4s ease',
  },
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: `0 20px 60px ${accentColor}66`,
    border: `1px solid ${accentColor}88`,
    '&::before': {
      transform: 'scaleX(1)',
    },
    '& .icon-container': {
      transform: 'rotate(360deg) scale(1.1)',
    }
  }
}));

/**
 * Icon Container for feature cards
 */
export const IconContainer = styled(Box)(() => ({
  display: 'inline-block',
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '24px',
  transition: 'transform 0.6s ease',
}));

/**
 * Info Box with slide animation
 */
interface InfoBoxProps extends BoxProps {
  accentColor?: string;
}

export const InfoBox = styled(Box)<InfoBoxProps>(({ accentColor = '#6366f1' }) => ({
  marginBottom: '24px',
  padding: '24px',
  borderLeft: `4px solid ${accentColor}`,
  background: `${accentColor}0d`,
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `${accentColor}1a`,
    transform: 'translateX(8px)',
  }
}));
