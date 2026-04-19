const SERVER_BASE_URL = 'http://localhost:4000';
export const fetchInitialUnits = async () => {
    const res = await fetch(`${SERVER_BASE_URL}/api/units`);
    if (!res.ok) {
        throw new Error(`Failed to fetch units: ${res.status}`);
    }
    const json = (await res.json());
    return json.units;
};
