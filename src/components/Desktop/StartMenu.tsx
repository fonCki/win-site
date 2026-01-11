import { useState } from 'react';
import styled from 'styled-components';
import { logClick } from '../../services/analyticsService';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string, title: string) => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  hasSubmenu?: boolean;
  submenuItems?: MenuItem[];
  action?: () => void;
}

const StartMenu = ({ isOpen, onClose, onOpenApp }: StartMenuProps) => {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  if (!isOpen) return null;

  const programsItems: MenuItem[] = [
    { id: 'icq', title: 'ICQ', icon: '🌸' },
    { id: 'homepage', title: "Fonchi's Homepage", icon: '🌐' },
    { id: 'my-computer', title: 'My Computer', icon: '💻' },
    { id: 'cv-doc', title: 'CV.doc', icon: '📄' },
    { id: 'minesweeper', title: 'Minesweeper', icon: '💣' },
  ];

  const handleItemClick = (item: MenuItem) => {
    logClick('start-menu', item.id);
    if (item.id === 'shutdown') {
      window.location.href = 'https://alfonso.ridao.ar';
      return;
    }
    onOpenApp(item.id, item.title);
    onClose();
  };

  const handleShutdown = () => {
    logClick('start-menu', 'shutdown');
    window.location.href = 'https://alfonso.ridao.ar';
  };

  return (
    <MenuContainer onClick={(e) => e.stopPropagation()}>
      {/* Windows 95 Banner */}
      <Banner>
        <BannerText>
          <span style={{ fontWeight: 'bold' }}>Windows</span>
          <span style={{ fontWeight: 'normal' }}>95</span>
        </BannerText>
      </Banner>

      {/* Menu Items */}
      <MenuItems>
        {/* Programs */}
        <MenuItemRow
          onMouseEnter={() => setActiveSubmenu('programs')}
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          <MenuIcon>📁</MenuIcon>
          <MenuLabel>Programs</MenuLabel>
          <MenuArrow>▶</MenuArrow>

          {activeSubmenu === 'programs' && (
            <Submenu>
              {programsItems.map((item) => (
                <SubmenuItem key={item.id} onClick={() => handleItemClick(item)}>
                  <MenuIcon>{item.icon}</MenuIcon>
                  <MenuLabel>{item.title}</MenuLabel>
                </SubmenuItem>
              ))}
            </Submenu>
          )}
        </MenuItemRow>

        {/* Documents */}
        <MenuItemRow onClick={() => handleItemClick({ id: 'cv-doc', title: 'CV.doc', icon: '📄' })}>
          <MenuIcon>📂</MenuIcon>
          <MenuLabel>Documents</MenuLabel>
        </MenuItemRow>

        {/* Settings */}
        <MenuItemRow $disabled>
          <MenuIcon>⚙️</MenuIcon>
          <MenuLabel>Settings</MenuLabel>
          <MenuArrow>▶</MenuArrow>
        </MenuItemRow>

        {/* Find */}
        <MenuItemRow $disabled>
          <MenuIcon>🔍</MenuIcon>
          <MenuLabel>Find</MenuLabel>
          <MenuArrow>▶</MenuArrow>
        </MenuItemRow>

        {/* Help */}
        <MenuItemRow $disabled>
          <MenuIcon>❓</MenuIcon>
          <MenuLabel>Help</MenuLabel>
        </MenuItemRow>

        {/* Run */}
        <MenuItemRow $disabled>
          <MenuIcon>📋</MenuIcon>
          <MenuLabel>Run...</MenuLabel>
        </MenuItemRow>

        <Divider />

        {/* Shut Down */}
        <MenuItemRow onClick={handleShutdown}>
          <MenuIcon>🔌</MenuIcon>
          <MenuLabel>Shut Down...</MenuLabel>
        </MenuItemRow>
      </MenuItems>
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 0;
  width: 200px;
  background: #c0c0c0;
  border: 2px solid;
  border-top-color: #fff;
  border-left-color: #fff;
  border-right-color: #404040;
  border-bottom-color: #404040;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  z-index: 10000;
`;

const Banner = styled.div`
  width: 22px;
  background: linear-gradient(180deg, #000080 0%, #1084d0 100%);
  display: flex;
  align-items: flex-end;
  padding-bottom: 4px;
`;

const BannerText = styled.div`
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  color: #c0c0c0;
  font-size: 18px;
  letter-spacing: 2px;
  padding: 4px;
`;

const MenuItems = styled.div`
  flex: 1;
  padding: 2px 0;
`;

const MenuItemRow = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  position: relative;
  color: ${props => props.$disabled ? '#808080' : '#000'};

  &:hover {
    background: ${props => props.$disabled ? 'transparent' : '#000080'};
    color: ${props => props.$disabled ? '#808080' : '#fff'};
  }
`;

const MenuIcon = styled.span`
  font-size: 16px;
  width: 20px;
  text-align: center;
`;

const MenuLabel = styled.span`
  flex: 1;
  font-size: 11px;
`;

const MenuArrow = styled.span`
  font-size: 8px;
`;

const Submenu = styled.div`
  position: absolute;
  left: 100%;
  top: -2px;
  width: 180px;
  background: #c0c0c0;
  border: 2px solid;
  border-top-color: #fff;
  border-left-color: #fff;
  border-right-color: #404040;
  border-bottom-color: #404040;
  padding: 2px 0;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const SubmenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background: #000080;
    color: #fff;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #808080;
  margin: 4px 4px;
  border-bottom: 1px solid #fff;
`;

export default StartMenu;
