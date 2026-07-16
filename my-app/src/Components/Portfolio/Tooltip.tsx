import { useState } from "react";
import { FaCircleQuestion } from "react-icons/fa6";

interface TooltipProps {
    text: string
}

export default function Tooltip({ text }: TooltipProps) {
    const [show, setShow] = useState(false);

    return (
        <div className = "tooltip-container"
            onMouseEnter = {() => setShow(true)}
            onMouseLeave = {() => setShow(false)}
        >
            {FaCircleQuestion({ className: "tooltip-icon" })}
            {show && (
                <div className = "tooltip-box">{text}</div>
            )}
        </div>
    );
}