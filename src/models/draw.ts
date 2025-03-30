export interface Draw {
  handleOpen: () => void;
  handleClose: () => void;
  open: boolean;
  handleToggle: (deselectMessage?: boolean) => void;
}
