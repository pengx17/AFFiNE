import { config } from '@affine/env';
import { useTranslation } from '@affine/i18n';
import {
  DeleteTemporarilyIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from '@blocksuite/icons';
import type { Page, PageMeta } from '@blocksuite/store';
import type React from 'react';
import { useCallback, useEffect } from 'react';

import {
  useSidebarFloating,
  useSidebarResizing,
  useSidebarStatus,
  useSidebarWidth,
} from '../../../hooks/affine/use-sidebar-status';
import { usePageMeta } from '../../../hooks/use-page-meta';
import type { AllWorkspace } from '../../../shared';
import { SidebarSwitch } from '../../affine/sidebar-switch';
import { ChangeLog } from './changeLog';
import Favorite from './favorite';
import { Pivots } from './Pivots';
import { StyledListItem } from './shared-styles';
import {
  StyledLink,
  StyledNewPageButton,
  StyledSidebarSwitchWrapper,
  StyledSliderBar,
  StyledSliderBarInnerWrapper,
  StyledSliderBarWrapper,
  StyledSliderModalBackground,
} from './style';
import { WorkspaceSelector } from './WorkspaceSelector';

export type FavoriteListProps = {
  currentPageId: string | null;
  openPage: (pageId: string) => void;
  showList: boolean;
  pageMeta: PageMeta[];
};

export type WorkSpaceSliderBarProps = {
  isPublicWorkspace: boolean;
  onOpenQuickSearchModal: () => void;
  onOpenWorkspaceListModal: () => void;
  currentWorkspace: AllWorkspace | null;
  currentPageId: string | null;
  openPage: (pageId: string) => void;
  createPage: () => Page;
  currentPath: string;
  paths: {
    all: (workspaceId: string) => string;
    favorite: (workspaceId: string) => string;
    trash: (workspaceId: string) => string;
    setting: (workspaceId: string) => string;
  };
};

export const WorkSpaceSliderBar: React.FC<WorkSpaceSliderBarProps> = ({
  isPublicWorkspace,
  currentWorkspace,
  currentPageId,
  openPage,
  createPage,
  currentPath,
  paths,
  onOpenQuickSearchModal,
  onOpenWorkspaceListModal,
}) => {
  const currentWorkspaceId = currentWorkspace?.id || null;
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useSidebarStatus();
  const pageMeta = usePageMeta(currentWorkspace?.blockSuiteWorkspace ?? null);
  const onClickNewPage = useCallback(async () => {
    const page = await createPage();
    openPage(page.id);
  }, [createPage, openPage]);
  const floatingSlider = useSidebarFloating();
  const [sliderWidth] = useSidebarWidth();
  const [isResizing] = useSidebarResizing();
  const show = isPublicWorkspace ? false : sidebarOpen;
  const actualWidth = floatingSlider ? 'calc(10vw + 400px)' : sliderWidth;
  useEffect(() => {
    window.apis?.onSidebarVisibilityChange(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if ((e.key === '/' && e.metaKey) || (e.key === '/' && e.ctrlKey)) {
        setSidebarOpen(!sidebarOpen);
      }
    };
    document.addEventListener('keydown', keydown, { capture: true });
    return () =>
      document.removeEventListener('keydown', keydown, { capture: true });
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      <StyledSliderBarWrapper
        resizing={isResizing}
        floating={floatingSlider}
        show={show}
        style={{ width: actualWidth }}
        data-testid="sliderBar-root"
      >
        <StyledSliderBar>
          <StyledSidebarSwitchWrapper>
            <SidebarSwitch
              visible={sidebarOpen}
              tooltipContent={t('Collapse sidebar')}
              testid="sliderBar-arrowButton-collapse"
            />
          </StyledSidebarSwitchWrapper>

          <StyledSliderBarInnerWrapper data-testid="sliderBar-inner">
            <WorkspaceSelector
              currentWorkspace={currentWorkspace}
              onClick={onOpenWorkspaceListModal}
            />
            {config.enableChangeLog && <ChangeLog />}
            <StyledListItem
              data-testid="slider-bar-quick-search-button"
              onClick={useCallback(() => {
                onOpenQuickSearchModal();
              }, [onOpenQuickSearchModal])}
            >
              <SearchIcon />
              {t('Quick search')}
            </StyledListItem>

            <StyledListItem
              active={
                currentPath ===
                (currentWorkspaceId && paths.setting(currentWorkspaceId))
              }
              data-testid="slider-bar-workspace-setting-button"
              style={{
                marginBottom: '16px',
              }}
            >
              <StyledLink
                href={{
                  pathname:
                    currentWorkspaceId && paths.setting(currentWorkspaceId),
                }}
              >
                <SettingsIcon />
                {t('Workspace Settings')}
              </StyledLink>
            </StyledListItem>

            <StyledListItem
              active={
                currentPath ===
                (currentWorkspaceId && paths.all(currentWorkspaceId))
              }
            >
              <StyledLink
                href={{
                  pathname: currentWorkspaceId && paths.all(currentWorkspaceId),
                }}
              >
                <FolderIcon />
                <span data-testid="all-pages">{t('All pages')}</span>
              </StyledLink>
            </StyledListItem>

            <Favorite
              currentPath={currentPath}
              paths={paths}
              currentPageId={currentPageId}
              openPage={openPage}
              currentWorkspace={currentWorkspace}
            />
            {config.enableSubpage && !!currentWorkspace && (
              <Pivots
                currentWorkspace={currentWorkspace}
                openPage={openPage}
                allMetas={pageMeta}
              />
            )}

            <StyledListItem
              active={
                currentPath ===
                (currentWorkspaceId && paths.trash(currentWorkspaceId))
              }
              style={{
                marginTop: '16px',
              }}
            >
              <StyledLink
                href={{
                  pathname:
                    currentWorkspaceId && paths.trash(currentWorkspaceId),
                }}
              >
                <DeleteTemporarilyIcon /> {t('Trash')}
              </StyledLink>
            </StyledListItem>
          </StyledSliderBarInnerWrapper>

          <StyledNewPageButton
            data-testid="new-page-button"
            onClick={onClickNewPage}
          >
            <PlusIcon /> {t('New Page')}
          </StyledNewPageButton>
        </StyledSliderBar>
      </StyledSliderBarWrapper>
      <StyledSliderModalBackground
        data-testid="sliderBar-modalBackground"
        active={floatingSlider && sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
};

export default WorkSpaceSliderBar;
