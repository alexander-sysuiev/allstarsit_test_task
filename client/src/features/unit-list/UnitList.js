import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
export const UnitList = ({ units }) => {
    const parentRef = useRef(null);
    const rowVirtualizer = useVirtualizer({
        count: units.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 32,
        overscan: 8
    });
    return (_jsx("div", { ref: parentRef, className: "unit-list-scroll", children: _jsx("div", { style: { height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }, children: rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const unit = units[virtualRow.index];
                if (!unit) {
                    return null;
                }
                return (_jsxs("div", { className: "unit-row", style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`
                    }, children: [_jsx("span", { children: unit.id }), _jsx("span", { children: unit.team }), _jsxs("span", { children: ["HP: ", unit.hp] }), _jsx("span", { children: unit.status })] }, unit.id));
            }) }) }));
};
