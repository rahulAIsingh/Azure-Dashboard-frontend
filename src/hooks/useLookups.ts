import { useState, useEffect } from "react";
import { dashboardApi } from "@/services/api";
import type { LookupData } from "@/types/dashboardTypes";

export function useLookups(subscription?: string) {
    const [data, setData] = useState<LookupData>({
        subscriptions: [],
        resourceGroups: [],
        services: [],
        locations: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isCurrent = true;

        async function fetchLookups() {
            try {
                setIsLoading(true);
                const lookups = await dashboardApi.getLookups(subscription);
                if (!isCurrent) return;
                setData(lookups);
                setError(null);
            } catch (err) {
                if (!isCurrent) return;
                console.error("Failed to fetch lookups:", err);
                setError(err instanceof Error ? err : new Error("Unknown error fetching lookups"));
            } finally {
                if (isCurrent) {
                    setIsLoading(false);
                }
            }
        }

        fetchLookups();

        return () => {
            isCurrent = false;
        };
    }, [subscription]);

    return { data, isLoading, error };
}
