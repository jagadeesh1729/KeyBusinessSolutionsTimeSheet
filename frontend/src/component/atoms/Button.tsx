import React from "react";
import { Box, Button, Typography} from "@mui/material";
import styled from "@emotion/styled";
import theme from "../../theme/index";
import type { StandardLonghandProperties } from "csstype";
import type { ButtonProps } from "@mui/material";
export  type ButtonProp <C extends React.ElementType> = ButtonProps<C, { component?: C }> &{
  variant?: "contained" | "text" | "outlined";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  width?: StandardLonghandProperties<string | number, string>["width"];
  height?: StandardLonghandProperties<string | number, string>["height"];
  color?: string;
  text?: string| number;
  bgColor?: string;
  sx?:object;
  isDisable?:boolean;
  buttonTextVarient?:"title"| "h1"| "h2"|"h3"|"body1"|"body2"| "caption" | "button1"|"button2";
  buttonTextSx?:object;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  active?:boolean;
}
export function ButtonComp<C extends React.ElementType>(
  {width,
  height,
  endIcon,
  startIcon,
  variant,
  text,
  bgColor,
  sx,
  isDisable,
  buttonTextVarient,
  buttonTextSx,
  onClick,
  active,
}:ButtonProp<C>){
  const stylesForButton = {
    alignItems: "center",
    backgroundColor:active?'#393552':bgColor,
    color:active?"#B4A9FF":' #C9C8CC',
    borderRadius: "12px",
    "&:hover": {
      backgroundColor: `${bgColor}`,
    },
    "&:active":{
      border:"1px solid #B4A9FF",
    },
    ...sx,
  };
  const stylesForBox = {
    width: width,
    height: height,
  };
  const MuiButton= styled(Button)(({
      "&.Mui-disabled":{
        backgroundColor:theme.palette.purple?.[500],
        color:theme.palette.white?.[500],
        opacity: "0.56",
      },
      "&.MuiButton-root":{
      // width: "100%",
      //     height: "100%",
          textTransform: "none",
          backgroundColor:`${bgColor}`,
          "&:hover": {
           backgroundColor:`${bgColor}`,
          },
          
        }
  }))
  return (
    <Box sx={stylesForBox}>
      <MuiButton
        startIcon={startIcon}
        endIcon={endIcon}
        variant={variant}
        sx={stylesForButton}
        disabled={isDisable}
        onClick={onClick}
        data-testid="buttonId"
      >
        <Typography sx={buttonTextSx} variant={buttonTextVarient}>{text}</Typography>   
      </MuiButton>
    </Box>
  );
}


export default ButtonComp;