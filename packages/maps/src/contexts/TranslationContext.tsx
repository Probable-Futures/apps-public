import { createContext, useState, useContext, PropsWithChildren, useEffect, useMemo } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

type State = {
  locale: string;
  translate(arg: any, fallbackString?: string): any;
  loadTranslations(arg: any): void;
};

const initialState = {
  locale: "en",
  translate: () => "",
  loadTranslations: () => {},
};

const TranslationContext = createContext<State>(initialState);

const languages = ["en", "fr", "es", "zh"];

const defaultLang = "en";

export const useTranslation = () => {
  return useContext(TranslationContext);
};

export const TranslationProvider = ({ children }: PropsWithChildren<{}>) => {
  const { language } = useParams<{ language: string }>();
  const [translations, setTranslations] = useState<any>({});

  const locale = useMemo(() => {
    const lang = language || window.location.pathname.split("/")[1];
    if (lang && languages.includes(lang)) {
      return lang;
    } else {
      return defaultLang;
    }
  }, [language]);

  const loadTranslations = async (locale: string) => {
    if (languages.includes(locale)) {
      const data = await import(`../locales/${locale}.json`);
      setTranslations(data.default);
    }
  };

  const translate = (key: string, fallbackString: string = "") => {
    const keys = key.split(".");
    let translation = translations;

    // iterate through each level of nesting to get the translation
    for (let i = 0; i < keys.length; i++) {
      const subkey = keys[i];
      translation = translation[subkey];

      if (!translation) {
        return fallbackString; // return fallbackString if the translation is not found
      }
    }
    return translation;
  };

  return (
    <TranslationContext.Provider value={{ translate, loadTranslations, locale }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const TranslationLoader = () => {
  const { loadTranslations } = useTranslation();
  const { language } = useParams<{ language: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // When embedded in WP language from useParams is undefined, so we use window.location.pathname
    if (window.pfInteractiveMap) {
      const locale = window.location.pathname.split("/")[1];
      if (locale && languages.includes(locale)) {
        loadTranslations(locale);
      } else {
        loadTranslations(defaultLang);
      }
    } else if (language && !languages.includes(language)) {
      if (language === "maps") {
        navigate("/en/maps");
      } else if (language === "mapBuilder") {
        navigate("/en/mapBuilder");
      } else if (language === "compare") {
        navigate("/en/compare");
      } else {
        navigate("/");
      }
    } else {
      loadTranslations(language || defaultLang);
    }
  }, [language, navigate, loadTranslations]);

  // render the child route's element
  return <Outlet />;
};
