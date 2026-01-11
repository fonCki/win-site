import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

export interface WindowProps {
  id: string;
  title: string;
  icon?: string;
  isActive: boolean;
  isMinimized: boolean;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  zIndex: number;
  children?: React.ReactNode;
  showMenuBar?: boolean;
  showStatusBar?: boolean;
  statusText?: string;
  resizable?: boolean;
  noPadding?: boolean;
}

const Window = ({
  id,
  title,
  icon,
  isActive,
  isMinimized,
  initialPosition = { x: 100, y: 50 },
  initialSize = { width: 400, height: 300 },
  onClose,
  onMinimize,
  onFocus,
  zIndex,
  children,
  showMenuBar = true,
  showStatusBar = true,
  statusText = '',
  resizable = true,
  noPadding = false,
}: WindowProps) => {
  // Constrain initial position to viewport
  const constrainToViewport = (pos: { x: number; y: number }, windowSize: { width: number; height: number }) => {
    const maxX = Math.max(0, window.innerWidth - windowSize.width);
    const maxY = Math.max(0, window.innerHeight - 30 - windowSize.height); // 30px for taskbar
    return {
      x: Math.max(0, Math.min(pos.x, maxX)),
      y: Math.max(0, Math.min(pos.y, maxY)),
    };
  };

  const [position, setPosition] = useState(() => constrainToViewport(initialPosition, initialSize));
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const prevPosition = useRef(position);
  const prevSize = useRef(size);

  // Keep window within viewport on resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (isMaximized) {
        setSize({ width: window.innerWidth, height: window.innerHeight - 30 });
      } else {
        setPosition(prev => constrainToViewport(prev, size));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isMaximized, size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        // Constrain to viewport (allow partial off-screen but keep title bar visible)
        const maxX = window.innerWidth - 100; // Keep at least 100px visible
        const maxY = window.innerHeight - 50; // Keep above taskbar
        setPosition({
          x: Math.max(-size.width + 100, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
      if (isResizing && !isMaximized) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        const minWidth = 200;
        const minHeight = 150;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.posX;
        let newY = resizeStart.posY;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(minWidth, resizeStart.width + dx);
        }
        if (resizeDirection.includes('w')) {
          const proposedWidth = resizeStart.width - dx;
          if (proposedWidth >= minWidth) {
            newWidth = proposedWidth;
            newX = resizeStart.posX + dx;
          }
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(minHeight, resizeStart.height + dy);
        }
        if (resizeDirection.includes('n')) {
          const proposedHeight = resizeStart.height - dy;
          if (proposedHeight >= minHeight) {
            newHeight = proposedHeight;
            newY = resizeStart.posY + dy;
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: Math.max(0, newY) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeDirection, isMaximized, size]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onFocus(id);
    setIsDragging(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(prevPosition.current);
      setSize(prevSize.current);
    } else {
      prevPosition.current = position;
      prevSize.current = size;
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 30 });
    }
    setIsMaximized(!isMaximized);
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(id);
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    });
  };

  if (isMinimized) return null;

  return (
    <WindowContainer
      ref={windowRef}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      onClick={() => onFocus(id)}
    >
      {/* Title Bar */}
      <TitleBar $isActive={isActive} onMouseDown={handleHeaderMouseDown}>
        <TitleBarLeft>
          {icon && <TitleBarIcon src={icon} alt="" />}
          <TitleBarText>{title}</TitleBarText>
        </TitleBarLeft>
        <TitleBarButtons>
          <TitleButton onClick={() => onMinimize(id)} title="Minimize">
            <MinimizeSvg />
          </TitleButton>
          <TitleButton onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
            <MaximizeSvg />
          </TitleButton>
          <TitleButton onClick={() => onClose(id)} title="Close">
            <CloseSvg />
          </TitleButton>
        </TitleBarButtons>
      </TitleBar>

      {/* Menu Bar */}
      {showMenuBar && (
        <MenuBar>
          <MenuItem>File</MenuItem>
          <MenuItem>Edit</MenuItem>
          <MenuItem>View</MenuItem>
          <MenuItem>Help</MenuItem>
        </MenuBar>
      )}

      {/* Content */}
      <WindowContent $noPadding={noPadding}>{children}</WindowContent>

      {/* Status Bar */}
      {showStatusBar && (
        <StatusBar>
          <StatusText>{statusText}</StatusText>
        </StatusBar>
      )}

      {/* Resize Handles */}
      {resizable && !isMaximized && (
        <>
          <ResizeHandle $direction="n" onMouseDown={handleResizeStart('n')} />
          <ResizeHandle $direction="s" onMouseDown={handleResizeStart('s')} />
          <ResizeHandle $direction="e" onMouseDown={handleResizeStart('e')} />
          <ResizeHandle $direction="w" onMouseDown={handleResizeStart('w')} />
          <ResizeHandle $direction="ne" onMouseDown={handleResizeStart('ne')} />
          <ResizeHandle $direction="nw" onMouseDown={handleResizeStart('nw')} />
          <ResizeHandle $direction="se" onMouseDown={handleResizeStart('se')} />
          <ResizeHandle $direction="sw" onMouseDown={handleResizeStart('sw')} />
        </>
      )}
    </WindowContainer>
  );
};

// SVG Icons for buttons
const MinimizeSvg = () => (
  <svg width="8" height="7" viewBox="0 0 8 7">
    <rect x="0" y="5" width="6" height="2" fill="black" />
  </svg>
);

const MaximizeSvg = () => (
  <svg width="9" height="9" viewBox="0 0 9 9">
    <rect x="0" y="0" width="9" height="9" fill="none" stroke="black" strokeWidth="1" />
    <rect x="0" y="0" width="9" height="2" fill="black" />
  </svg>
);

const CloseSvg = () => (
  <svg width="8" height="7" viewBox="0 0 8 7">
    <line x1="0" y1="0" x2="8" y2="7" stroke="black" strokeWidth="1.5" />
    <line x1="8" y1="0" x2="0" y2="7" stroke="black" strokeWidth="1.5" />
  </svg>
);

const WindowContainer = styled.div`
  position: absolute;
  background-color: #c0c0c0;
  border: 2px solid;
  border-top-color: #dfdfdf;
  border-left-color: #dfdfdf;
  border-right-color: #404040;
  border-bottom-color: #404040;
  box-shadow: 1px 1px 0 #000;
  display: flex;
  flex-direction: column;
`;

const TitleBar = styled.div<{ $isActive: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 18px;
  padding: 2px 2px 2px 3px;
  background: ${props => props.$isActive
    ? 'linear-gradient(90deg, #000080, #1084d0)'
    : 'linear-gradient(90deg, #808080, #b0b0b0)'};
  cursor: move;
  user-select: none;
`;

const TitleBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const TitleBarIcon = styled.img`
  width: 14px;
  height: 14px;
  image-rendering: pixelated;
`;

const TitleBarText = styled.span`
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TitleBarButtons = styled.div`
  display: flex;
  gap: 2px;
`;

const TitleButton = styled.button`
  width: 16px;
  height: 14px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #c0c0c0;
  border: none;
  outline: none;
  cursor: pointer;
  box-shadow:
    inset -1px -1px 0 #404040,
    inset 1px 1px 0 #fff,
    inset -2px -2px 0 #808080,
    inset 2px 2px 0 #dfdfdf;

  &:active {
    box-shadow:
      inset 1px 1px 0 #404040,
      inset -1px -1px 0 #fff,
      inset 2px 2px 0 #808080,
      inset -2px -2px 0 #dfdfdf;
    padding-top: 1px;
    padding-left: 1px;
  }
`;

const MenuBar = styled.div`
  display: flex;
  background-color: #c0c0c0;
  padding: 2px 0;
  border-bottom: 1px solid #808080;
`;

const MenuItem = styled.span`
  padding: 2px 8px;
  font-size: 11px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  cursor: pointer;

  &:hover {
    background-color: #000080;
    color: #fff;
  }
`;

const WindowContent = styled.div<{ $noPadding?: boolean }>`
  flex: 1;
  background-color: ${props => props.$noPadding ? '#c0c0c0' : '#fff'};
  border: ${props => props.$noPadding ? 'none' : '2px solid'};
  border-top-color: #808080;
  border-left-color: #808080;
  border-right-color: #dfdfdf;
  border-bottom-color: #dfdfdf;
  margin: ${props => props.$noPadding ? '0' : '2px'};
  overflow: ${props => props.$noPadding ? 'hidden' : 'auto'};
  padding: ${props => props.$noPadding ? '0' : '4px'};
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  height: 18px;
  padding: 2px 4px;
  background-color: #c0c0c0;
  border-top: 1px solid #dfdfdf;
`;

const StatusText = styled.span`
  font-size: 11px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  padding: 1px 4px;
  border: 1px solid;
  border-top-color: #808080;
  border-left-color: #808080;
  border-right-color: #fff;
  border-bottom-color: #fff;
  flex: 1;
`;

const getCursor = (direction: string) => {
  switch (direction) {
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'nw':
    case 'se':
      return 'nwse-resize';
    default:
      return 'default';
  }
};

const getPosition = (direction: string) => {
  const positions: Record<string, string> = {
    n: 'top: -3px; left: 4px; right: 4px; height: 6px;',
    s: 'bottom: -3px; left: 4px; right: 4px; height: 6px;',
    e: 'right: -3px; top: 4px; bottom: 4px; width: 6px;',
    w: 'left: -3px; top: 4px; bottom: 4px; width: 6px;',
    ne: 'top: -3px; right: -3px; width: 10px; height: 10px;',
    nw: 'top: -3px; left: -3px; width: 10px; height: 10px;',
    se: 'bottom: -3px; right: -3px; width: 10px; height: 10px;',
    sw: 'bottom: -3px; left: -3px; width: 10px; height: 10px;',
  };
  return positions[direction] || '';
};

const ResizeHandle = styled.div<{ $direction: string }>`
  position: absolute;
  ${props => getPosition(props.$direction)}
  cursor: ${props => getCursor(props.$direction)};
  z-index: 10;
`;

export default Window;
