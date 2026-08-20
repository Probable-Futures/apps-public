import styled from "styled-components";

import { colors } from "../../consts";

export type Orientation = "horizontal" | "vertical";

export type Segment<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  name: string;
  value: T;
  segments: Segment<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
  orientation?: Orientation;
};

const Group = styled.div`
  display: flex;
  flex-direction: ${({ orientation }: { orientation: Orientation }) =>
    orientation === "vertical" ? "column" : "row"};
  width: 100%;
  border: 1px solid ${colors.lightGrey};
  border-radius: 6px;
  overflow: hidden;
  background-color: ${colors.white};
  box-sizing: border-box;
`;

type SegmentButtonProps = { selected: boolean; compact?: boolean; orientation: Orientation };

const SegmentButton = styled.button`
  flex: 1;
  min-width: 0;
  border: none;
  font-family: inherit;
  letter-spacing: 0;
  line-height: 1.3;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  font-size: ${({ compact }: SegmentButtonProps) => (compact ? "12px" : "13px")};
  background-color: ${({ selected }: SegmentButtonProps) =>
    selected ? colors.purple : "transparent"};
  color: ${({ selected }: SegmentButtonProps) => (selected ? colors.white : colors.darkPurple)};

  /* A row divides on the inline edge, a column on the block edge, and neither
     draws one after the final segment — the group's own border closes it. */
  ${({ orientation, compact }: SegmentButtonProps) =>
    orientation === "vertical"
      ? `
    text-align: left;
    padding: ${compact ? "6px 12px" : "9px 12px"};
    border-bottom: 1px solid ${colors.lightGrey};

    &:last-child {
      border-bottom: none;
    }
  `
      : `
    text-align: center;
    white-space: nowrap;
    padding: ${compact ? "5px 10px" : "9px 8px"};
    border-right: 1px solid ${colors.lightGrey};

    &:last-child {
      border-right: none;
    }
  `}

  &:hover:not(:disabled) {
    color: ${({ selected }: SegmentButtonProps) => (selected ? colors.white : colors.purple)};
  }

  &:disabled {
    color: ${colors.lightGrey};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${colors.purple};
    outline-offset: -2px;
  }
`;

export default function SegmentedControl<T extends string>({
  name,
  value,
  segments,
  onChange,
  compact,
  orientation = "horizontal",
}: Props<T>): JSX.Element {
  return (
    <Group role="radiogroup" aria-label={name} orientation={orientation}>
      {segments.map((segment) => (
        <SegmentButton
          key={segment.value}
          type="button"
          role="radio"
          aria-checked={segment.value === value}
          disabled={segment.disabled}
          title={segment.hint}
          compact={compact}
          orientation={orientation}
          selected={segment.value === value}
          onClick={() => onChange(segment.value)}
        >
          {segment.label}
        </SegmentButton>
      ))}
    </Group>
  );
}
