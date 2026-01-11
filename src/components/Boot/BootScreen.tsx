import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import useSound from '../../hooks/useSound';

interface BootScreenProps {
  onBootComplete: () => void;
  duration?: number;
}

const BootScreen = ({ onBootComplete, duration = 6000 }: BootScreenProps) => {
  const hasPlayedSound = useRef(false);
  const { play: playStartupSound } = useSound('/sounds/startup.mp3');

  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playStartupSound();
    }

    const timer = setTimeout(onBootComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onBootComplete, playStartupSound]);

  return (
    <Container>
      <BootImage src="/images/win95-boot.png" alt="Windows 95" />
    </Container>
  );
};

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  /* Sky gradient that matches the Windows 95 boot screen clouds */
  background: linear-gradient(
    180deg,
    #7eb4ea 0%,
    #a8cff0 15%,
    #c5dff5 30%,
    #d9ebf9 45%,
    #e8f3fc 60%,
    #d9ebf9 75%,
    #c5dff5 85%,
    #a8cff0 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  overflow: hidden;
`;

const BootImage = styled.img`
  /* Fill the viewport height, width auto-scales proportionally */
  height: 100vh;
  width: auto;
  min-width: 100vw;
  object-fit: cover;
  object-position: center;
`;

export default BootScreen;
