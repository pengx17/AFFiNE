import { MuiFade, Tooltip } from '@affine/component';
import { config } from '@affine/env';
import { useTranslation } from '@affine/i18n';
import { CloseIcon, DoneIcon } from '@blocksuite/icons';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { ShortcutsModal } from '../shortcuts-modal';
import { ContactIcon, HelpIcon, KeyboardIcon } from './Icons';
import {
  StyledAnimateWrapper,
  StyledIconWrapper,
  StyledIsland,
  StyledTriggerWrapper,
} from './style';
const ContactModal = dynamic(
  () =>
    import('@affine/component/contact-modal').then(({ ContactModal }) => ({
      default: ContactModal,
    })),
  {
    ssr: true,
  }
);

export type IslandItemNames = 'whatNew' | 'contact' | 'shortcuts';
export const HelpIsland = ({
  showList = config.enableChangeLog
    ? ['whatNew', 'contact', 'shortcuts']
    : ['contact', 'shortcuts'],
}: {
  showList?: IslandItemNames[];
}) => {
  const [spread, setShowSpread] = useState(false);
  // const { triggerShortcutsModal, triggerContactModal } = useModal();
  // const blockHub = useGlobalState(store => store.blockHub);
  const { t } = useTranslation();
  //
  // useEffect(() => {
  //   blockHub?.blockHubStatusUpdated.on(status => {
  //     if (status) {
  //       setShowSpread(false);
  //     }
  //   });
  //   return () => {
  //     blockHub?.blockHubStatusUpdated.dispose();
  //   };
  // }, [blockHub]);
  //
  // useEffect(() => {
  //   spread && blockHub?.toggleMenu(false);
  // }, [blockHub, spread]);
  const [open, setOpen] = useState(false);
  const [openShortCut, setOpenShortCut] = useState(false);
  return (
    <>
      <StyledIsland
        spread={spread}
        data-testid="help-island"
        onClick={() => {
          setShowSpread(!spread);
        }}
      >
        <StyledAnimateWrapper
          style={{ height: spread ? `${showList.length * 44}px` : 0 }}
        >
          {showList.includes('whatNew') && (
            <Tooltip content={t("Discover what's new")} placement="left-end">
              <StyledIconWrapper
                data-testid="right-bottom-change-log-icon"
                onClick={() => {
                  window.open('https://affine.pro', '_blank');
                }}
              >
                <DoneIcon />
              </StyledIconWrapper>
            </Tooltip>
          )}
          {showList.includes('contact') && (
            <Tooltip content={t('Contact Us')} placement="left-end">
              <StyledIconWrapper
                data-testid="right-bottom-contact-us-icon"
                onClick={() => {
                  setShowSpread(false);
                  setOpen(true);
                }}
              >
                <ContactIcon />
              </StyledIconWrapper>
            </Tooltip>
          )}
          {showList.includes('shortcuts') && (
            <Tooltip content={t('Keyboard Shortcuts')} placement="left-end">
              <StyledIconWrapper
                data-testid="shortcuts-icon"
                onClick={() => {
                  setShowSpread(false);
                  setOpenShortCut(true);
                }}
              >
                <KeyboardIcon />
              </StyledIconWrapper>
            </Tooltip>
          )}
        </StyledAnimateWrapper>

        <Tooltip content={t('Help and Feedback')} placement="left-end">
          <MuiFade in={!spread} data-testid="faq-icon">
            <StyledTriggerWrapper>
              <HelpIcon />
            </StyledTriggerWrapper>
          </MuiFade>
        </Tooltip>
        <MuiFade in={spread}>
          <StyledTriggerWrapper>
            <CloseIcon />
          </StyledTriggerWrapper>
        </MuiFade>
      </StyledIsland>
      <ContactModal
        open={open}
        onClose={() => setOpen(false)}
        logoSrc="/imgs/affine-text-logo.png"
      />
      <ShortcutsModal
        open={openShortCut}
        onClose={() => setOpenShortCut(false)}
      />
    </>
  );
};
