import { useIsMobile } from '@/hooks/use-mobile';
import { MentionUser } from '@/shared/models/mention-user';
import {
  Avatar,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  SxProps,
  TextField,
  Theme,
} from '@mui/material';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface MentionInputProps {
  value: { plain: string; withMentions: string };
  onChange: React.Dispatch<React.SetStateAction<{ plain: string; withMentions: string }>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  users: MentionUser[];
  mentionList: MentionUser[];
  setMentionList: React.Dispatch<React.SetStateAction<MentionUser[]>>;
  minRows?: number;
  maxRows?: number;
  inputSx?: SxProps<Theme>;
  autoFocus?: boolean;
  shouldFocus?: boolean;
  placeholder?: string;
  showFullscreenToggle?: boolean;
}

export const MentionInput = (props: MentionInputProps) => {
  const {
    value,
    onChange,
    setSearchTerm,
    users,
    mentionList,
    setMentionList,
    minRows,
    maxRows,
    inputSx,
    autoFocus,
    shouldFocus,
    placeholder,
    showFullscreenToggle = true,
  } = props;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null); // wrapper the menu pins to
  const [selectIndex, setSelectIndex] = useState(0);
  const [openPopover, setOpenPopover] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExpand, setShowExpand] = useState(false);
  useIsMobile();

  const baseSx: SxProps<Theme> = {
    '& .MuiInputBase-root': {
      px: 1,
      py: 0.5,
      backgroundColor: 'var(--card, var(--background, #fff))',
    },
    '& .MuiInputBase-inputMultiline': {
      overflowY: 'auto',
      fontSize: '16px',
      WebkitTextSizeAdjust: '100%',
      backgroundColor: 'var(--card, var(--background, #fff))',
    },
    '& .MuiInputBase-input': {
      backgroundColor: 'var(--card, var(--background, #fff))',
    },
  };
  const mergedSx: SxProps<Theme> = inputSx
    ? Array.isArray(inputSx)
      ? [baseSx, ...inputSx]
      : [baseSx, inputSx]
    : baseSx;

  const closePopover = () => {
    setOpenPopover(false);
    setSelectIndex(0);
  };

  const getActiveMention = () => {
    const el = inputRef.current;
    if (!el) return null;
    const caret = el.selectionEnd ?? 0;
    const text = el.value ?? '';
    const atIndex = text.lastIndexOf('@', Math.max(0, caret - 1));
    if (atIndex === -1) return null;
    const candidate = text.slice(atIndex + 1, caret);
    if (/\s/.test(candidate)) return null;
    return { atIndex, candidate, caret };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Detect active mention
    const el = inputRef.current;
    let active = null as null | { atIndex: number; candidate: string; caret: number };
    if (el) {
      el.value = newValue; // keep selection math accurate during change
      active = getActiveMention();
    }

    if (active) {
      setSearchTerm(active.candidate);
      setOpenPopover(true);
    } else {
      setOpenPopover(false);
    }

    const { withMentions, mentionList: newMentionList } =
      buildWithMentionsFromPlain(newValue, mentionList);
    onChange({ plain: newValue, withMentions });
    setMentionList(newMentionList);

    // line count check for expand toggle
    if (el) {
      const style = window.getComputedStyle(el);
      let lineHeight = parseFloat(style.lineHeight || '');
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(style.fontSize || '16');
        lineHeight = fontSize * 1.4;
      }
      if (lineHeight > 0) {
        const computedHeight = Math.min(el.scrollHeight, el.clientHeight || el.scrollHeight);
        const lines = Math.round(computedHeight / lineHeight);
        setShowExpand(lines >= 4);
      }
    }
  };

  const handleUserSelect = (user: MentionUser) => {
    if (inputRef.current) {
      const caretPosition = inputRef.current.selectionStart ?? 0;
      const recentAt = value.plain.lastIndexOf('@', caretPosition - 1);
      const inserted = user.displayName + ' ';
      const newPlainValue =
        value.plain.slice(0, recentAt + 1) + inserted + value.plain.slice(caretPosition);

      const updatedMentionList = mentionList.some((m) => m.id === user.id)
        ? mentionList
        : [...mentionList, user];

      const { withMentions, mentionList: newMentionList } =
        buildWithMentionsFromPlain(newPlainValue, updatedMentionList);

      onChange({ plain: newPlainValue, withMentions });
      setMentionList(newMentionList);
      closePopover();

      requestAnimationFrame(() => {
        const pos = recentAt + 1 + inserted.length;
        inputRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const active = getActiveMention();
    const shouldHandleMentionKeys = openPopover && !!active;
    if (shouldHandleMentionKeys) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectIndex((i) => (i < users.length - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectIndex((i) => (i > 0 ? i - 1 : users.length - 1));
      } else if (e.key === 'Enter') {
        if (users.length > 0) {
          e.preventDefault();
          handleUserSelect(users[selectIndex]);
          return;
        }
      }
    }
    if (e.key === 'Backspace') {
      const el = inputRef.current;
      if (!el) return;
      const selectionStart = el.selectionStart ?? 0;
      const selectionEnd = el.selectionEnd ?? 0;
      if (selectionStart !== selectionEnd) return;
      const caret = selectionStart;
      if (caret === 0) return;
      const text = value.plain;
      const atIndex = text.lastIndexOf('@', caret - 1);
      if (atIndex === -1) return;
      const candidate = text.slice(atIndex + 1, caret);
      if (!candidate) return;
      const matchedUser = mentionList.find((u) => u.displayName === candidate);
      if (!matchedUser) return;
      const nextChar = text.charAt(caret);
      const boundaryOkay = caret === text.length || /\W/.test(nextChar);
      if (!boundaryOkay) return;

      e.preventDefault();
      const newPlain = text.slice(0, atIndex) + text.slice(caret);
      const { withMentions, mentionList: newMentionList } =
        buildWithMentionsFromPlain(newPlain, mentionList);

      setMentionList(newMentionList);
      onChange({ plain: newPlain, withMentions });

      requestAnimationFrame(() => {
        const pos = atIndex;
        inputRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  // Focus when explicitly requested
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true } as FocusOptions);
      }, 30);
    }
  }, [shouldFocus]);

  // When value updates externally, recompute expand visibility
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      const style = window.getComputedStyle(el);
      let lineHeight = parseFloat(style.lineHeight || '');
      if (!lineHeight || Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(style.fontSize || '16');
        lineHeight = fontSize * 1.4;
      }
      if (lineHeight > 0) {
        const computedHeight = Math.min(el.scrollHeight, el.clientHeight || el.scrollHeight);
        const lines = Math.round(computedHeight / lineHeight);
        setShowExpand(lines >= 4);
      }
    }
  }, [value.plain]);

  // Pinned mentions menu (absolute inside the same wrapper as the TextField) — ABOVE the box
  const MentionMenu = (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: '100%',   // ⬅️ anchor to the top edge of the field
        left: 0,
        right: 0,
        mb: 0.5,          // small gap above the field
        zIndex: (t) => t.zIndex.modal + 1,
        maxHeight: 260,
        overflowY: 'auto',
      }}
      // Prevent blur on the textarea when clicking the menu
      onMouseDown={(e) => e.preventDefault()}
    >
      <List>
        {users.map((user, index) => (
          <ListItemButton
            key={user.id}
            selected={index === selectIndex}
            onClick={(e) => {
              e.stopPropagation();
              handleUserSelect(user);
            }}
          >
            <ListItemAvatar>
              <Avatar alt={user.displayName}>{user.initials}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={user.displayName} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );

  return (
    <>
      {!isFullscreen && (
        // Anchor wrapper — the menu is absolutely positioned inside this
        <div ref={anchorRef} style={{ position: 'relative' }}>
          <TextField
            inputRef={inputRef}
            minRows={minRows ?? 4}
            maxRows={maxRows ?? 10}
            multiline
            fullWidth
            value={value.plain}
            placeholder={placeholder}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            sx={mergedSx}
          />
          {showFullscreenToggle && showExpand && (
            <IconButton
              onClick={() => setIsFullscreen(true)}
              size="small"
              aria-label="Expand"
              sx={{ position: 'absolute', top: 4, right: 4 }}
            >
              <Maximize2 size={16} />
            </IconButton>
          )}
          {openPopover && users.length > 0 && MentionMenu}
        </div>
      )}

      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: '5vh',
              height: '95vh',
              left: 0,
              right: 0,
              zIndex: 1300,
            }}
          >
            {/* Separate wrapper in fullscreen; menu still pins to the field */}
            <div
              ref={anchorRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: 'var(--background, #fff)',
                border: '1px solid var(--border, rgba(0,0,0,0.12))',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
                size="small"
                aria-label="Collapse"
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
              >
                <Minimize2 size={16} />
              </IconButton>
              <div style={{ width: '100%', height: '100%', padding: 8 }}>
                <TextField
                  inputRef={inputRef}
                  multiline
                  fullWidth
                  value={value.plain}
                  placeholder={placeholder}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  minRows={Math.max(minRows ?? 10, 10)}
                  sx={{
                    height: '100%',
                    '& .MuiInputBase-root': {
                      height: '100%',
                      alignItems: 'flex-start',
                      backgroundColor: 'var(--card, var(--background, #fff))',
                    },
                    '& .MuiInputBase-inputMultiline': {
                      height: '100%',
                      overflowY: 'auto',
                      fontSize: '16px',
                      WebkitTextSizeAdjust: '100%',
                      backgroundColor: 'var(--card, var(--background, #fff))',
                    },
                    '& .MuiInputBase-input': {
                      backgroundColor: 'var(--card, var(--background, #fff))',
                    },
                  }}
                />
              </div>
              {openPopover && users.length > 0 && MentionMenu}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const buildWithMentionsFromPlain = (
  plain: string,
  list: MentionUser[],
): { withMentions: string; mentionList: MentionUser[] } => {
  if (!list || list.length === 0) return { withMentions: plain, mentionList: [] };

  const displayNameToId = new Map(list.map((u) => [u.displayName, u.id]));
  const alternation = list
    .map((u) => u.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  const mentionRegex = new RegExp(`@(${alternation})(?=$|\\W)`, 'g');

  const newWithMentions = plain.replace(mentionRegex, (_match, displayName: string) => {
    const id = displayNameToId.get(displayName);
    return id ? `@[${displayName}](${id})` : _match;
  });

  const mentionedIds = new Set(
    [...newWithMentions.matchAll(/@\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]),
  );
  const newMentionList = list.filter((user) => mentionedIds.has(user.id));

  return { withMentions: newWithMentions, mentionList: newMentionList as MentionUser[] };
};
