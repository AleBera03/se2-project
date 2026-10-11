import { OfficerContext } from "./OfficerContext";
import { useOfficerLogic } from "../hooks/useOfficerLogic";

function OfficerProvider({ children }) {
    const officer = useOfficerLogic();

    return (
        <OfficerContext.Provider value={officer}>
            {children}
        </OfficerContext.Provider>
    );
}

export default OfficerProvider;
