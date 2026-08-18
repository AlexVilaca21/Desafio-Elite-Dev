import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#8f1d2c',
      dark: '#6b1520',
      contrastText: '#fffaf3',
    },
    secondary: {
      main: '#c9a24a',
      dark: '#b58d3a',
      contrastText: '#1c1216',
    },
    background: {
      default: '#f4eadc',
      paper: '#fffaf3',
    },
    text: {
      primary: '#1c1216',
      secondary: '#6d5a60',
    },
    error: {
      main: '#8b1e1e',
    },
    success: {
      main: '#1f6b45',
    },
    divider: '#e6d4c4',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "'Manrope', 'Segoe UI', sans-serif",
    h1: {
      fontFamily: "'Fraunces', 'Georgia', serif",
      fontWeight: 560,
    },
    h2: {
      fontFamily: "'Fraunces', 'Georgia', serif",
      fontWeight: 560,
    },
    h3: {
      fontFamily: "'Fraunces', 'Georgia', serif",
      fontWeight: 560,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 42,
          paddingLeft: 18,
          paddingRight: 18,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: false,
      },
      styleOverrides: {
        paper: {
          maxHeight: 280,
          overscrollBehavior: 'contain',
        },
        list: {
          overscrollBehavior: 'contain',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        listbox: {
          maxHeight: 240,
          overflow: 'auto',
          overscrollBehavior: 'contain',
        },
        paper: {
          overscrollBehavior: 'contain',
        },
      },
    },
  },
});
