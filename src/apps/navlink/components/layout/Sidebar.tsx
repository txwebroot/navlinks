import React from 'react';
import { SiteConfig, Category } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';

const Sidebar = ({
  config,
  activeCategory,
  onScrollTo,
  mobileOpen,
  setMobileOpen,
  collapsed,
  toggleCollapsed,
  isAuthenticated = false
}: any) => {
  // Filter categories based on authentication status
  const categories = (config.categories || []).filter((cat: Category) => isAuthenticated || !cat.hidden);

  // Dynamic width based on collapsed state
  const widthClass = collapsed ? 'w-[68px]' : 'w-[220px]';

  const desktopClass = `
    hidden lg:flex flex-col flex-shrink-0
    sticky top-[80px] h-[calc(100vh-100px)]
    bg-transparent transition-all duration-300 ease-in-out
    ${widthClass}
`;

  const mobileClass = `
    fixed inset-y-0 left-0 w-[240px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
lg:hidden flex flex-col
  `;

  const Content = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden h-[60px] flex items-center px-6 border-b border-gray-100">
        <span className="text-lg font-bold text-gray-800">导航菜单</span>
        <button onClick={() => setMobileOpen(false)} className="ml-auto text-gray-400"><Icon icon="fa-solid fa-times" /></button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 pr-2">
        <nav className="space-y-1">
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => {
                onScrollTo(cat.id);
                if (window.innerWidth < 1024) setMobileOpen(false);
              }}
              className={`
                  w-full flex items-center px-4 py-3 text-[14px] font-medium rounded-lg transition-all duration-200 group
                  ${activeCategory === cat.id
                  ? 'text-white bg-[var(--theme-primary)] shadow-md shadow-red-200'
                  : 'text-gray-600 hover:bg-white hover:text-[var(--theme-primary)] hover:shadow-sm'
                }
                  ${collapsed && isDesktop ? 'justify-center px-0' : ''}
`}
              title={collapsed ? cat.name : ''}
            >
              <div className={`${collapsed && isDesktop ? 'text-lg w-auto mr-0' : 'w-6 text-center mr-2'} ${activeCategory === cat.id ? 'text-white' : 'text-gray-400 group-hover:text-[var(--theme-primary)]'} flex items-center justify-center`}>
                <Icon icon={cat.icon} />
              </div>
              {(!collapsed || !isDesktop) && <span>{cat.name}</span>}
              {(!collapsed || !isDesktop) && <div className="ml-auto opacity-0 group-hover:opacity-50 text-xs"><Icon icon="fa-solid fa-angle-right" /></div>}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer / Collapse Button */}
      <div className="p-4 mt-auto lg:mt-0">
        <div className="flex items-center justify-between text-gray-500 bg-white lg:bg-transparent rounded-lg p-2 lg:p-0">
          <button
            onClick={toggleCollapsed}
            className={`hover:text-[var(--theme-primary)] text-sm font-medium flex items-center ${collapsed && isDesktop ? 'mx-auto' : ''} `}
            title={collapsed ? "展开" : "收起"}
          >
            {collapsed && isDesktop ? (
              <Icon icon="fa-solid fa-right-to-bracket" />
            ) : (
              <>
                <Icon icon="fa-solid fa-right-from-bracket" className="mr-1" /> 收起
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className={desktopClass}>
        <Content isDesktop={true} />
      </div>
      <div className={mobileClass}>
        <Content isDesktop={false} />
      </div>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-[65] lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>}
    </>
  );
};

// Optimize with React.memo
export default React.memo(Sidebar, (prevProps, nextProps) => {
  return (
    prevProps.config.categories === nextProps.config.categories &&
    prevProps.activeCategory === nextProps.activeCategory &&
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.mobileOpen === nextProps.mobileOpen &&
    prevProps.isAuthenticated === nextProps.isAuthenticated
  );
});
