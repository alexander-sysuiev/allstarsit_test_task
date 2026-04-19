import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { unitsSelectors } from '../../entities/units/store';
import { MapCanvas } from '../map/MapCanvas';
import { UnitList } from '../unit-list/UnitList';
import { useAppSelector } from '../../store/hooks';
export const Dashboard = () => {
    // TODO: split selectors by feature to reduce recomputation under heavy update rates.
    const units = useAppSelector(unitsSelectors.selectAll);
    const metrics = useMemo(() => {
        let red = 0;
        let blue = 0;
        let destroyed = 0;
        for (const unit of units) {
            if (unit.team === 'red') {
                red += 1;
            }
            else {
                blue += 1;
            }
            if (unit.status === 'destroyed') {
                destroyed += 1;
            }
        }
        return {
            total: units.length,
            red,
            blue,
            destroyed
        };
    }, [units]);
    return (_jsxs("main", { className: "layout", children: [_jsxs("section", { className: "panel metrics", children: [_jsx("h1", { children: "Battlefield Dashboard" }), _jsxs("p", { children: ["Total units: ", metrics.total] }), _jsxs("p", { children: ["Red: ", metrics.red] }), _jsxs("p", { children: ["Blue: ", metrics.blue] }), _jsxs("p", { children: ["Destroyed: ", metrics.destroyed] })] }), _jsxs("section", { className: "panel map", children: [_jsx("h2", { children: "Map" }), _jsx(MapCanvas, { units: units, width: 900, height: 450 })] }), _jsxs("section", { className: "panel list", children: [_jsx("h2", { children: "Units" }), _jsx(UnitList, { units: units })] })] }));
};
