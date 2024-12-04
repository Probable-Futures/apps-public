import { createContext, useState, useContext, PropsWithChildren, useEffect } from "react";
import { types, colors } from "@probable-futures/lib";

type State = {
  theme: types.Theme;
  color: string;
  secondaryColor: string;
  backgroundColor: string;
  secondaryBackgroundColor: string;
  setTheme(arg: any): void;
};

const initialState = {
  theme: "light" as types.Theme,
  color: "",
  secondaryColor: "",
  backgroundColor: "",
  secondaryBackgroundColor: "",
  setTheme: () => {},
};

const ThemeContext = createContext<State>(initialState);

const ThemeProvider = ({
  children,
  theme: themeColor,
}: PropsWithChildren<{ theme: types.Theme }>) => {
  const [theme, setTheme] = useState<types.Theme>(themeColor);
  const [color, setColor] = useState<string>(
    themeColor === "dark" ? colors.white : colors.dimBlack,
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    themeColor === "dark" ? colors.dimBlack : colors.white,
  );
  const [secondaryBackgroundColor, setSecondaryBackgroundColor] = useState<string>(
    themeColor === "dark" ? colors.darkPurpleBackground : colors.whiteSmoke,
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    themeColor === "dark" ? colors.whiteOriginal : colors.dimBlack,
  );

  useEffect(() => {
    setColor(theme === "dark" ? colors.white : colors.dimBlack);
    setBackgroundColor(theme === "dark" ? colors.dimBlack : colors.white);
    setSecondaryBackgroundColor(theme === "dark" ? colors.darkPurpleBackground : colors.whiteSmoke);
    setSecondaryColor(theme === "dark" ? colors.whiteOriginal : colors.dimBlack);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, color, backgroundColor, secondaryBackgroundColor, secondaryColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): State {
  return useContext(ThemeContext);
}

export default ThemeProvider;
