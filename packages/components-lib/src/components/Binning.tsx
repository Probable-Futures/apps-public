import styled, { css } from "styled-components";
import InputColor, { Color } from "react-input-color";
import { getBinLabelArray, getLabelByValue, colors, Map } from "@probable-futures/lib";

import { useTheme } from "../contexts";

type Props = {
  mapBins?: number[];
  bins?: number[];
  binHexColors?: string[];
  selectedDataset?: Map;
  isPro: boolean;
  title?: string;
  binningText?: any;
  updateColorScheme?: (currentScheme: string[], color: Color, index: number) => void;
  onCommitChange: (bins: any) => void;
  setMapbins: (mapBins: number[]) => void;
  resetColorScheme?: () => void;
};

type ContainerProps = {
  flexDirection?: "row" | "column";
  isPro: boolean;
};

const ClearColorStyles = css`
  > span {
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
  }
`;

export const Title = styled.h3`
  margin: 0 0 5px 0;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.15;
  justify-content: center;
  align-items: center;
  text-align: center;
  display: flex;
  flex-grow: 2;
  gap: 10px;
`;

const Header = styled.span`
  color: ${colors.whiteOriginal};
  font-family: LinearSans;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  line-height: 20px;
`;

const Subtitle = styled(Title)`
  margin-bottom: 0;
`;

const ListOption = styled(Subtitle)`
  font-size:${({ isPro }: { isPro: boolean }) => (isPro ? "14px;" : "12px;")}
  margin-left: 5px;
  letter-spacing: 0;
  line-height: 16px;
  justify-content: flex-start;
`;

const BinWrapper = styled.div`
  display: flex;
  margin-bottom: 5px;
  align-items: center;
  ${({ isPro }: { isPro: boolean }) => isPro && "gap: 25%;"}
  flex-direction: ${({ flexDirection }: ContainerProps) => flexDirection || "column"};
`;

const ListColorPicker = styled.div`
  height: 26px;
  width: 26px;
  aspect-ratio: 1/1;
  ${ClearColorStyles};
`;

const BinsWrapper = styled.div`
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
`;

const InputBox = styled.input`
  ${({ isPro }: { isPro: boolean }) =>
    isPro ? "height: 36px;width: 38px;" : "height: 26px;width: 26px;"}
  border: 1px solid ${colors.grey};
  background-color: ${colors.black};
  color: ${colors.white};
  text-align: center;
  aspect-ratio: 1/1;
  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const BinningTitle = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
`;

const ResetButton = styled.button`
  margin-left: auto;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: LinearSans;

  &:hover {
    opacity: 0.8;
  }
`;

const CustomInputColor = styled.div`
  width: 35px;
  height: 35px;
  aspect-ratio: 1/1;
  background-color: ${({ color }: { color: string }) => color};
`;

const Binning = ({
  updateColorScheme,
  mapBins = [],
  bins,
  binHexColors,
  selectedDataset,
  isPro,
  title,
  binningText,
  onCommitChange,
  setMapbins,
  resetColorScheme,
}: Props) => {
  const { color, secondaryBackgroundColor, secondaryColor } = useTheme();
  if (!binHexColors || !bins || !selectedDataset) {
    return null;
  }

  const unit = selectedDataset.dataset.unit;

  const getMaxBinValue = (index: number) =>
    index === bins.length
      ? selectedDataset.dataset.maxValue
      : parseFloat((mapBins[index] - selectedDataset.step).toFixed(1)) || 0;

  const getMinBinValue = (index: number) => mapBins[index - 2] + selectedDataset.step;

  const validateInput = (index: number, value: number) => {
    if (value <= getMinBinValue(index) || value >= getMaxBinValue(index) || isNaN(value)) {
      return false;
    }
    return true;
  };

  const onBinChange = (value: number, index: number) => {
    if (index === 0) {
      return;
    }
    const finalValue = parseFloat(value.toFixed(1));
    const newBins = [...mapBins];
    newBins[index - 1] = finalValue;
    setMapbins(newBins);
  };

  const commitChanges = (value: number, index: number, e: any) => {
    if (index === 0) {
      return;
    }
    if (!validateInput(index, value)) {
      e.target.value = bins[index];
      setMapbins([...bins]);
    } else {
      onCommitChange([...mapBins]);
    }
  };

  const resetBinnings = () => {
    if (selectedDataset.stops) {
      setMapbins([...selectedDataset.stops]);
      onCommitChange([...selectedDataset.stops]);
      resetColorScheme?.();
    }
  };

  const resetText = binningText ? binningText["reset"] : "Reset";

  return (
    <div style={{ color, backgroundColor: secondaryBackgroundColor }}>
      <BinningTitle>
        {title && <Header>{title}</Header>}
        <ResetButton onClick={resetBinnings} style={{ color: secondaryColor }} title={resetText}>
          {resetText}
        </ResetButton>
      </BinningTitle>
      <BinsWrapper style={{ color: secondaryColor }}>
        {binHexColors.map((color: string, index: number) => {
          const [binStartValue, binEndValue] = getBinLabelArray(
            mapBins,
            index,
            selectedDataset.dataset.minValue,
            selectedDataset.dataset.maxValue,
            selectedDataset.step,
          );
          const [_prevBinStartValue] = getBinLabelArray(
            mapBins,
            index === 0 ? 0 : index - 1,
            selectedDataset.dataset.minValue,
            selectedDataset.dataset.maxValue,
            selectedDataset.step,
          );

          return (
            <BinWrapper flexDirection="row" isPro={isPro} key={index}>
              {updateColorScheme ? (
                <ListColorPicker>
                  <InputColor
                    initialValue={color}
                    onChange={(color: Color) =>
                      updateColorScheme && updateColorScheme(binHexColors, color, index)
                    }
                  />
                </ListColorPicker>
              ) : (
                <CustomInputColor color={color} />
              )}
              <ListOption isPro={isPro}>
                <InputBox
                  value={isNaN(binStartValue) ? "" : binStartValue}
                  onChange={(e) => {
                    onBinChange(parseFloat(e.target.value), index);
                  }}
                  onBlur={(e) => commitChanges(parseFloat(e.target.value), index, e)}
                  type="number"
                  min={_prevBinStartValue + 2 * selectedDataset.step || 0}
                  max={binEndValue - selectedDataset.step || 0}
                  disabled={index === 0 || selectedDataset.dataset.unit === "class"}
                  step={selectedDataset.step}
                  isPro={isPro}
                />
                {selectedDataset.dataset.unit !== "class" ? (
                  <>
                    <div>&minus;</div>
                    {isNaN(binEndValue) ? "" : binEndValue}
                    &nbsp;
                    {unit}
                  </>
                ) : (
                  <div>
                    {getLabelByValue(
                      binStartValue,
                      selectedDataset.binningType,
                      selectedDataset.binLabels as string[],
                      selectedDataset.stops,
                    )}
                  </div>
                )}
              </ListOption>
            </BinWrapper>
          );
        })}
      </BinsWrapper>
    </div>
  );
};

export default Binning;
