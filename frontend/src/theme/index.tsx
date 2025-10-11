import { createTheme } from "@mui/material/styles";
declare module "@mui/material/styles" {
  interface Palette {
    customText?: Palette["primary"];
    customBackground?: Palette["primary"];
    purple?: Palette["primary"];
    white?: Palette["primary"];
    customIcon?: Palette["primary"];
    border?: Palette["primary"];
    accent?: Palette["primary"];
  }
  interface PaletteOptions {
    primary?: PaletteOptions["primary"];
    purple?: PaletteOptions["primary"];
    white?: PaletteOptions["primary"];
    customBackground?: PaletteOptions["primary"];
    customText?: PaletteOptions["primary"];
    customIcon?: PaletteOptions["primary"];
    border?: PaletteOptions["primary"];
    accent?: PaletteOptions["primary"];
  }
  interface PaletteColor {
    elevation1?: string;
    elevation0?: string;
    elevation2?: string;
    highEmp?: string;
    medEmp?: string;
    lowEmp?: string;
    darkOverlay?: string;
    pink?: string;
    aquaBlue?: string;
    lightLavender?: string;
    peachYellow?: string;
    redOrange?: string;
    white?: string;
    600?: string;
    500?: string;
  }
  interface SimplePaletteColorOptions {
    elevation1?: string;
    elevation0?: string;
    elevation2?: string;
    highEmp?: string;
    medEmp?: string;
    lowEmp?: string;
    darkOverlay?: string;
    pink?: string;
    aquaBlue?: string;
    lightLavender?: string;
    peachYellow?: string;
    redOrange?: string;
    white?: string;
    600?: string;
    500?: string;
  }
  interface TypographyVariants {
    title: React.CSSProperties;
    button1: React.CSSProperties;
    button2: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    title?: React.CSSProperties;
    button1?: React.CSSProperties;
    button2?: React.CSSProperties;
  }
}
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    title?: true;
    button1?: true;
    button2?: true;
  }
}
const theme = createTheme({
  palette: {
    primary: {
      main: "#B4A9FF",
    },
    purple: {
      "600": "#393552",
      "500": "#6C5DD3",
      "400": "#B4A9FF",
    },
    white: {
      "600": "#D8D8D9",
      "500": "#E8E8E9",
    },
    grey: {
      "100": "#262529",
      "50": "#3A3A3D",
    },
    customBackground: {
      main: "#fff",
      elevation0: "#19181C",
      elevation1: "#201F24",
      elevation2: " #2D2D30",
    },
    customText: {
      main: "#fff",
      highEmp: "#E8E7F0",
      lowEmp: "#A5A5A6",
      medEmp: "#C9C8CC",
    },
    customIcon: {
      main: "#fff",
      highEmp: "#D4D2DE",
      lowEmp: "#727080",
    },
    border: {
      main: "#fff",
      highEmp: "#413F4D",
      lowEmp: "#28272B",
    },
    accent: {
      main: "#fff",
      darkOverlay: "#333333",
      pink: "#E39AB2",
      aquaBlue: "#A0D7E7",
      lightLavender: "#CFC8FF",
      peachYellow: "#E5CB9B",
      redOrange: "#EC977D",
    },
  },
  typography: {
    fontFamily: ['Gilroy', 'sans-serif'].join(','),
    title: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "700",
      fontSize: "36px",
      lineHeight: "42px",
      letterSpacing: "-0.015em",
    },
    h1: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "600",
      fontSize: "28px",
      lineHeight: "34px",
      letterSpacing: "-0.005em",
    },
    h2: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "600",
      fontSize: "24px",
      lineHeight: "29px",
      letterSpacing: "-0.005em",
    },
    h3: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "500",
      fontSize: "18px",
      lineHeight: "150%",
    },
    body2: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "600",
      fontSize: "14px",
      lineHeight: "17px",
      letterSpacing: "0.01em",
    },
    body1: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "500",
      fontSize: "16px",
      lineHeight: "140%",
    },

    caption: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "500",
      fontSize: "12px",
      lineHeight: "15px",
      letterSpacing: "0.02em",
    },
    button1: {
      fontFamily: "Gilroy",
      fontSize: "16px",
      fontWeight: "600",
      lineHeight: "19px",
      letterSpacing: "0em",
      textAlign: "left",
    },
    button2: {
      fontFamily: "Gilroy",
      fontStyle: "normal",
      fontWeight: "600",
      fontSize: "14px",
      lineHeight: "14px",
      letterSpacing: "0.01em",
      color: "#000000",
    },
  },
});
const customTheme = createTheme(theme, {
  components: {
  },
});

export default customTheme;