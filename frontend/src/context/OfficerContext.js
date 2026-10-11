import { createContext, useContext } from "react";

const OfficerContext = createContext(null);

function useOfficerContext() {
    const context = useContext(OfficerContext);

    if (context === null) {
        throw new Error(
            "useOfficerContext must be used inside OfficerProvider."
        );
    }

    return context;
}

export { OfficerContext, useOfficerContext };