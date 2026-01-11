import { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import DesktopIcon from './DesktopIcon';
import Window from '../Windows/Window';
import MyComputerContent from '../Apps/MyComputer/MyComputerContent';
import BrowserContent from '../Apps/Browser/BrowserContent';
import Minesweeper from '../Apps/Games/Minesweeper/Minesweeper';
import CVViewer from '../Apps/CVViewer/CVViewer';
import ICQ from '../Apps/ICQ/ICQ';
import type { ChatMessage } from '../../services/chatService';
import { logClick, logWindowAction, logChat } from '../../services/analyticsService';

export interface WindowInfo {
  id: string;
  title: string;
  icon?: string;
  isMinimized: boolean;
  isActive: boolean;
  zIndex: number;
}

const iconToPath: Record<string, string> = {
  'my-computer': '/icons/my-computer.png',
  'recycle-bin': '/icons/recycle-bin.png',
  'cv-doc': '/icons/document.png',
  'homepage': '/icons/internet.png',
  'minesweeper': '/icons/minesweeper.png',
  'icq': '/icons/icq-flower.svg',
};

// External links that open in new browser tab
const externalLinks: Record<string, string> = {};

const Desktop = () => {
  const [openWindows, setOpenWindows] = useState<WindowInfo[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // ICQ chat state (persists across window open/close)
  const [icqMessages, setIcqMessages] = useState<ChatMessage[]>([]);
  const [icqUnreadCount, setIcqUnreadCount] = useState(0);
  const lastPlayedMessageCount = useRef(0);

  // Play sound only for new messages (once per message)
  const playUhOh = useCallback(() => {
    const isMuted = localStorage.getItem('win95-muted') === 'true';
    if (isMuted) return;
    try {
      const audio = new Audio('/sounds/icq-uh-oh.mp3');
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  // Track new messages and play sound once
  useEffect(() => {
    const assistantMessages = icqMessages.filter(m => m.role === 'assistant').length;
    if (assistantMessages > lastPlayedMessageCount.current) {
      playUhOh();
      lastPlayedMessageCount.current = assistantMessages;

      // Only increment unread if ICQ window is not open or not active
      const icqWindow = openWindows.find(w => w.id === 'icq');
      if (!icqWindow || icqWindow.isMinimized || !icqWindow.isActive) {
        setIcqUnreadCount(prev => prev + 1);
      }
    }
  }, [icqMessages, openWindows, playUhOh]);

  // Clear unread when ICQ becomes active
  useEffect(() => {
    const icqWindow = openWindows.find(w => w.id === 'icq');
    if (icqWindow && icqWindow.isActive && !icqWindow.isMinimized) {
      setIcqUnreadCount(0);
    }
  }, [openWindows]);

  // Auto-open ICQ with welcome message after boot
  useEffect(() => {
    if (hasShownWelcome) return;

    const timer = setTimeout(() => {
      handleIconDoubleClick('icq', 'ICQ');
      setHasShownWelcome(true);
    }, 18000);

    return () => clearTimeout(timer);
  }, [hasShownWelcome]);

  const handleIconDoubleClick = useCallback((id: string, title: string) => {
    // Log the click event
    logClick('desktop-icon', id);

    // Check if this is an external link
    if (externalLinks[id]) {
      window.open(externalLinks[id], '_blank', 'noopener,noreferrer');
      return;
    }

    const existingWindow = openWindows.find(w => w.id === id);
    if (existingWindow) {
      logWindowAction('restore', id);
      setOpenWindows(prev =>
        prev.map(w => ({
          ...w,
          isMinimized: w.id === id ? false : w.isMinimized,
          isActive: w.id === id,
          zIndex: w.id === id ? nextZIndex : w.zIndex,
        }))
      );
      setNextZIndex(prev => prev + 1);
    } else {
      logWindowAction('open', id);
      setOpenWindows(prev => [
        ...prev.map(w => ({ ...w, isActive: false })),
        { id, title, icon: iconToPath[id], isMinimized: false, isActive: true, zIndex: nextZIndex }
      ]);
      setNextZIndex(prev => prev + 1);
    }
  }, [openWindows, nextZIndex]);

  const handleWindowClose = useCallback((id: string) => {
    logWindowAction('close', id);
    setOpenWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleWindowMinimize = useCallback((id: string) => {
    logWindowAction('minimize', id);
    setOpenWindows(prev =>
      prev.map(w => ({
        ...w,
        isMinimized: w.id === id ? true : w.isMinimized,
        isActive: w.id === id ? false : w.isActive,
      }))
    );
  }, []);

  const handleWindowFocus = useCallback((id: string) => {
    setOpenWindows(prev =>
      prev.map(w => ({
        ...w,
        isActive: w.id === id,
        zIndex: w.id === id ? nextZIndex : w.zIndex,
      }))
    );
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const handleTaskbarWindowClick = useCallback((id: string) => {
    const window = openWindows.find(w => w.id === id);
    if (window) {
      if (window.isMinimized) {
        // Restore minimized window
        setOpenWindows(prev =>
          prev.map(w => ({
            ...w,
            isMinimized: w.id === id ? false : w.isMinimized,
            isActive: w.id === id,
            zIndex: w.id === id ? nextZIndex : w.zIndex,
          }))
        );
        setNextZIndex(prev => prev + 1);
      } else if (window.isActive) {
        // Minimize active window
        handleWindowMinimize(id);
      } else {
        // Focus window
        handleWindowFocus(id);
      }
    }
  }, [openWindows, nextZIndex, handleWindowMinimize, handleWindowFocus]);

  const handleStartClick = () => {
    setStartMenuOpen(prev => !prev);
  };

  const handleDesktopClick = () => {
    if (startMenuOpen) {
      setStartMenuOpen(false);
    }
  };

  const handleStartMenuClose = () => {
    setStartMenuOpen(false);
  };

  const handleOpenAppFromStartMenu = (appId: string, title: string) => {
    handleIconDoubleClick(appId, title);
  };

  const handleICQClick = useCallback(() => {
    handleIconDoubleClick('icq', 'ICQ');
  }, [handleIconDoubleClick]);

  return (
    <Container onClick={handleDesktopClick}>
      <IconsArea>
        <DesktopIcon
          id="my-computer"
          icon="/icons/my-computer.png"
          label="My Computer"
          onDoubleClick={handleIconDoubleClick}
        />
        <DesktopIcon
          id="recycle-bin"
          icon="/icons/recycle-bin.png"
          label="Recycle Bin"
          onDoubleClick={handleIconDoubleClick}
        />
        <DesktopIcon
          id="cv-doc"
          icon="/icons/document.png"
          label="CV.doc"
          onDoubleClick={handleIconDoubleClick}
        />
        <DesktopIcon
          id="homepage"
          icon="/icons/internet.png"
          label="Fonchi's Homepage"
          onDoubleClick={handleIconDoubleClick}
        />
        <DesktopIcon
          id="minesweeper"
          icon="/icons/minesweeper.png"
          label="Minesweeper"
          onDoubleClick={handleIconDoubleClick}
        />
        <DesktopIcon
          id="icq"
          icon="/icons/icq-flower.svg"
          label="ICQ"
          onDoubleClick={handleIconDoubleClick}
        />
      </IconsArea>

      {/* Render open windows */}
      {openWindows.map((windowInfo, index) => (
        <Window
          key={windowInfo.id}
          id={windowInfo.id}
          title={windowInfo.title}
          icon={windowInfo.icon}
          isActive={windowInfo.isActive}
          isMinimized={windowInfo.isMinimized}
          onClose={handleWindowClose}
          onMinimize={handleWindowMinimize}
          onFocus={handleWindowFocus}
          zIndex={windowInfo.zIndex}
          initialPosition={
            windowInfo.id === 'icq'
              ? { x: window.innerWidth - 320, y: window.innerHeight - 520 }
              : { x: 100 + index * 30, y: 50 + index * 30 }
          }
          initialSize={
            windowInfo.id === 'homepage' ? { width: 800, height: 550 } :
            windowInfo.id === 'minesweeper' ? { width: 242, height: 308 } :
            windowInfo.id === 'cv-doc' ? { width: 650, height: 500 } :
            windowInfo.id === 'icq' ? { width: 300, height: 450 } :
            undefined
          }
          showMenuBar={windowInfo.id !== 'homepage' && windowInfo.id !== 'minesweeper' && windowInfo.id !== 'cv-doc' && windowInfo.id !== 'icq'}
          showStatusBar={windowInfo.id !== 'homepage' && windowInfo.id !== 'minesweeper' && windowInfo.id !== 'cv-doc' && windowInfo.id !== 'icq'}
          statusText={
            windowInfo.id === 'my-computer' ? '6 object(s)' :
            windowInfo.id === 'recycle-bin' ? '0 object(s)' :
            ''
          }
          resizable={windowInfo.id !== 'minesweeper'}
          noPadding={windowInfo.id === 'minesweeper' || windowInfo.id === 'cv-doc' || windowInfo.id === 'icq'}
        >
          {windowInfo.id === 'my-computer' ? (
            <MyComputerContent />
          ) : windowInfo.id === 'homepage' ? (
            <BrowserContent />
          ) : windowInfo.id === 'minesweeper' ? (
            <Minesweeper />
          ) : windowInfo.id === 'cv-doc' ? (
            <CVViewer />
          ) : windowInfo.id === 'icq' ? (
            <ICQ
              messages={icqMessages}
              setMessages={setIcqMessages}
              unreadCount={icqUnreadCount}
            />
          ) : windowInfo.id === 'recycle-bin' ? (
            <EmptyBinContent>
              <EmptyText>Recycle Bin is empty.</EmptyText>
            </EmptyBinContent>
          ) : (
            <p>Content for {windowInfo.title}</p>
          )}
        </Window>
      ))}

      {/* Start Menu */}
      <StartMenu
        isOpen={startMenuOpen}
        onClose={handleStartMenuClose}
        onOpenApp={handleOpenAppFromStartMenu}
      />

      <Taskbar
        openWindows={openWindows}
        startMenuOpen={startMenuOpen}
        onStartClick={handleStartClick}
        onWindowClick={handleTaskbarWindowClick}
        onICQClick={handleICQClick}
        icqUnreadCount={icqUnreadCount}
      />
    </Container>
  );
};

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #008080;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
`;

const IconsArea = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  bottom: 38px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 5px;
  padding: 5px;
  overflow: hidden;
`;

const EmptyBinContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fff;
`;

const EmptyText = styled.span`
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  color: #808080;
`;

export default Desktop;
