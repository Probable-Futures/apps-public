import {
  createContext,
  useState,
  useMemo,
  useContext,
  PropsWithChildren,
  useCallback,
} from "react";
import { types } from "@probable-futures/lib";

type InspectPromptLocation = {
  latitude_longitude?: { lat: number; lng: number };
};

type State = {
  isTourActive: boolean;
  step: number;
  steps: types.Steps;
  closedTour: boolean;
  inspectPromptLocation: InspectPromptLocation;
  setIsTourActive(arg: any): void;
  setStep(arg: any): void;
  setSteps(arg: any): void;
  setClosedTour(arg: any): void;
  setInspectPromptLocation(arg: any): void;
  onNext(): void;
  onClose(): void;
};

const initialState = {
  isTourActive: false,
  step: 0,
  steps: {},
  closedTour: false,
  inspectPromptLocation: {},
  setIsTourActive: () => {},
  setStep: () => {},
  setSteps: () => {},
  setClosedTour: () => {},
  setInspectPromptLocation: () => {},
  onNext: () => {},
  onClose: () => {},
};

const TourContext = createContext<State>(initialState);

export function TourProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [isTourActive, setIsTourActive] = useState(false);
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState({});
  const [closedTour, setClosedTour] = useState(false);
  const [inspectPromptLocation, setInspectPromptLocation] = useState({});

  const onNext = useCallback(() => {
    setStep((step) => step + 1);
  }, []);

  const onClose = useCallback(() => {
    setIsTourActive(false);
    setStep(0);
    setClosedTour(true);
  }, []);

  const value = useMemo(
    () => ({
      isTourActive,
      setIsTourActive,
      step,
      setStep,
      steps,
      setSteps,
      closedTour,
      setClosedTour,
      inspectPromptLocation,
      setInspectPromptLocation,
      onNext,
      onClose,
    }),
    [isTourActive, step, steps, closedTour, inspectPromptLocation, onClose, onNext],
  );

  return <TourContext.Provider value={value}>{props.children}</TourContext.Provider>;
}

export function useTourData(): State {
  return useContext(TourContext);
}
