import { useRef, type FormEvent, type WheelEvent } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { BRAZIL_STATES } from '../constants/states';
import { EVENT_GENRES } from '../constants/genres';
import { CATALOG_SORT_OPTIONS, EVENT_SORT_OPTIONS } from '../constants/sort';
import { emptyEventFilters, type EventFiltersValue } from '../types/event-filters';

type EventFiltersProps = {
  value: EventFiltersValue;
  loading?: boolean;
  showGenre?: boolean;
  showSort?: boolean;
  catalog?: boolean;
  submitLabel?: string;
  onChange: (next: EventFiltersValue) => void;
  onSubmit?: () => void;
};

type StateOption = {
  code: string;
  name: string;
};

const ALL_STATES: StateOption = { code: '', name: 'Todos os estados' };
const STATE_OPTIONS: StateOption[] = [ALL_STATES, ...BRAZIL_STATES];

function stopPageScroll(event: WheelEvent) {
  event.stopPropagation();
}

const SELECT_MENU_PROPS = {
  disableScrollLock: false,
  slotProps: {
    paper: {
      sx: {
        maxHeight: 280,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      },
      onWheel: stopPageScroll,
    },
  },
};

export function EventFilters({
  value,
  loading = false,
  showGenre = false,
  showSort = true,
  catalog = false,
  submitLabel = 'Buscar',
  onChange,
  onSubmit,
}: EventFiltersProps) {
  const sortOptions = catalog ? CATALOG_SORT_OPTIONS : EVENT_SORT_OPTIONS;
  const fieldSx = { flex: '1 1 160px', minWidth: 150 };
  const bodyOverflow = useRef('');
  const selectedState =
    STATE_OPTIONS.find((state) => state.code === value.stateCode) ?? ALL_STATES;

  function patch(partial: Partial<EventFiltersValue>) {
    onChange({ ...value, ...partial });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.();
  }

  function lockPage(lock: boolean) {
    if (lock) {
      bodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return;
    }

    document.body.style.overflow = bodyOverflow.current;
  }

  const chips: Array<{ key: keyof EventFiltersValue; label: string }> = [];

  if (value.keyword.trim()) {
    chips.push({ key: 'keyword', label: `Busca: ${value.keyword.trim()}` });
  }
  if (value.city.trim()) {
    chips.push({ key: 'city', label: `Cidade: ${value.city.trim()}` });
  }
  if (value.stateCode) {
    chips.push({
      key: 'stateCode',
      label: selectedState.name,
    });
  }
  if (value.startDate) {
    chips.push({ key: 'startDate', label: `De ${value.startDate}` });
  }
  if (value.endDate) {
    chips.push({ key: 'endDate', label: `Até ${value.endDate}` });
  }
  if (value.classificationName) {
    const genre = EVENT_GENRES.find(
      (item) => item.value === value.classificationName,
    );
    chips.push({
      key: 'classificationName',
      label: genre?.label ?? value.classificationName,
    });
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 18px 40px rgba(28, 18, 22, 0.08)',
        width: '100%',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
          <TextField
            value={value.keyword}
            onChange={(event) => patch({ keyword: event.target.value })}
            label="Buscar evento ou artista"
            placeholder="Nome, casa ou artista"
            sx={{ flex: '2 1 220px', minWidth: 180 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SearchIcon fontSize="small" />
                    )}
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            value={value.city}
            onChange={(event) => patch({ city: event.target.value })}
            label="Cidade"
            sx={fieldSx}
          />
          <Autocomplete
            options={STATE_OPTIONS}
            value={selectedState}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, selected) =>
              option.code === selected.code
            }
            onChange={(_, next) => patch({ stateCode: next?.code ?? '' })}
            onOpen={() => lockPage(true)}
            onClose={() => lockPage(false)}
            sx={fieldSx}
            slotProps={{
              paper: {
                onWheel: stopPageScroll,
                sx: { overscrollBehavior: 'contain' },
              },
              listbox: {
                onWheel: stopPageScroll,
                sx: {
                  maxHeight: 240,
                  overflow: 'auto',
                  overscrollBehavior: 'contain',
                },
              },
            }}
            renderInput={(params) => (
              <TextField {...params} label="Estado" placeholder="Digite o estado" />
            )}
          />
          {showGenre && (
            <TextField
              select
              value={value.classificationName}
              onChange={(event) =>
                patch({ classificationName: event.target.value })
              }
              label="Categoria"
              sx={fieldSx}
              slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
            >
              <MenuItem value="">Todas</MenuItem>
              {EVENT_GENRES.map((genre) => (
                <MenuItem key={genre.value} value={genre.value}>
                  {genre.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            type="date"
            value={value.startDate}
            onChange={(event) => patch({ startDate: event.target.value })}
            label="A partir de"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />
          <TextField
            type="date"
            value={value.endDate}
            onChange={(event) => patch({ endDate: event.target.value })}
            label="Até"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />
          {showSort && (
            <TextField
              select
              value={value.sort}
              onChange={(event) => patch({ sort: event.target.value })}
              label="Ordenar"
              sx={fieldSx}
              slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          {onSubmit && (
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Buscando...' : submitLabel}
            </Button>
          )}
        </Box>

        {chips.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {chips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                onDelete={() =>
                  patch({
                    [chip.key]:
                      chip.key === 'sort'
                        ? catalog
                          ? 'relevance,desc'
                          : 'date,asc'
                        : '',
                  })
                }
              />
            ))}
            <Chip
              label="Limpar filtros"
              onClick={() =>
                onChange(
                  emptyEventFilters({
                    sort: catalog ? 'relevance,desc' : 'date,asc',
                  }),
                )
              }
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
