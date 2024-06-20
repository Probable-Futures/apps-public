import { Switch, styled } from "@mui/material";

import CheckmarkIcon from "../../../assets/icons/map/checkmark.svg";
import { colors } from "../../../consts";

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 32,
  height: 16,
  padding: 0,
  margin: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: theme.palette.common.white,
      "& + .MuiSwitch-track": {
        backgroundColor: colors.blue,
        opacity: 1,
        border: "none",
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: colors.blue,
      border: `6px solid ${colors.primaryWhite}`,
    },
  },
  "& .MuiSwitch-thumb": {
    width: 16,
    height: 16,
  },
  "& .MuiSwitch-track": {
    borderRadius: 13,
    border: `1px solid ${theme.palette.grey[400]}`,
    backgroundColor: "transparent",
    opacity: 1,
    transition: theme.transitions.create(["background-color", "border"]),
  },
  "& .Mui-checked": {
    "&:after": {
      content: '""',
      position: "absolute",
      backgroundImage: `url(${CheckmarkIcon})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "100% auto",
      backgroundPosition: "center",
      width: "12px",
      height: "6px",
      PointerEvent: "none",
    },
  },
  focusVisible: {},
}));

type Props = {
  checked: boolean;
  onChange: () => void;
};

export default function MapSwitch(props: Props): JSX.Element {
  return <StyledSwitch checked={props.checked} onChange={props.onChange} name="switch" />;
}
