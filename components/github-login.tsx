"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { use, useState } from "react";

export function OAuthButton({ next = "/protected"}: {next? :string}){
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        const supabase = createClient();
        setLoading(true);
        setError(null);
    

        const {error} = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: { 
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },

        });

        // on a successfull responce
        if (error){
            setError(error.message);
            setLoading(false);
        }
    };

    return(
        <>
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSignIn}
                disabled={loading}
            >
                {loading ? "Redirecting..." : "Continue with GitHub"}
            </Button>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </>
    );


};
