import { withStyles } from "@material-ui/core";
import Switch from "@material-ui/core/Switch";

import CheckmarkIcon from "../../../assets/icons/map/checkmark.svg";
import { colors } from "../../../consts";

const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 32,
    height: 16,
    padding: 0,
    margin: 0,
  },
  switchBase: {
    padding: 0,
    "&$checked": {
      transform: "translateX(16px)",
      color: theme.palette.common.white,
      "& + $track": {
        backgroundColor: colors.blue,
        opacity: 1,
        border: "none",
      },
    },
    "&$focusVisible $thumb": {
      color: colors.blue,
      border: `6px solid ${colors.primaryWhite}`,
    },
  },
  thumb: {
    width: 16,
    height: 16,
  },
  track: {
    borderRadius: 13,
    border: `1px solid ${theme.palette.grey[400]}`,
    backgroundColor: "transparent",
    opacity: 1,
    transition: theme.transitions.create(["background-color", "border"]),
  },
  checked: {
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
}))(({ classes, ...props }: any) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});

type Props = {
  checked: boolean;
  onChange: () => void;
};

export default function MapSwitch(props: Props): JSX.Element {
  return <StyledSwitch checked={props.checked} onChange={props.onChange} name="switch" />;
}
