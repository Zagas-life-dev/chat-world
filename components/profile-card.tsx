"use client";

import { Url } from "next/dist/shared/lib/router/router";
import { useEffect, useState } from "react";

type Profile = {id: string, created_at: Date, name: string, image_url?: Url}

export function ProfileCard(){
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setloading] = useState(true)

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try{
                const res = await fetch("api/profile");
                if (!res.ok){
                    const body = await res.json();
                    throw new Error(body.error ?? "Request TimedOut");
                }
                const data = await res.json();
                if (!cancelled) setProfile(data);
            } catch (e){
                if (!cancelled) setError(e instanceof Error ? e.message : "unknown Error");
                
            } finally{
                if (!cancelled) {setloading(false)};
            }
            
        }
        load();
        return () => {cancelled = true;};

    }, []);

    if (loading) return <p>Loading...</p>;
    if  (error) return <p className="text-red-500">{error}</p>;
    return <h1>{profile?.name}</h1>
}