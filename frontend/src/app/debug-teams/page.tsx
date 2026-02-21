"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DebugTeamsPage() {
  const [status, setStatus] = useState<string>("Loading...");
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const diagnose = async () => {
      try {
        setStatus("Checking authentication...");

        // Step 1: Check user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setError(`Auth error: ${authError.message}`);
          return;
        }

        if (!currentUser) {
          setError("No authenticated user found");
          setStatus("Not authenticated");
          return;
        }

        setUser(currentUser);
        setStatus("Found authenticated user: " + currentUser.id);

        // Step 2: Query owned teams
        setStatus("Querying owned teams...");
        const { data: ownedTeams, error: ownedError } = await supabase
          .from("teams")
          .select("*")
          .eq("owner_id", currentUser.id)
          .is("deleted_at", null);

        if (ownedError) {
          setError(`Error fetching owned teams: ${ownedError.message}`);
          return;
        }

        setStatus(`Found ${ownedTeams?.length || 0} owned teams`);

        // Step 3: Query member teams
        setStatus("Querying member teams...");
        const { data: memberLinks, error: memberError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", currentUser.id)
          .in("status", ["active", "pending"]);

        if (memberError) {
          setError(`Error fetching member links: ${memberError.message}`);
          return;
        }

        setTeamMembers(memberLinks || []);
        setStatus(`Found ${memberLinks?.length || 0} team memberships`);

        // Step 4: Combine all teams
        const allTeams = [...(ownedTeams || [])];
        if (memberLinks && memberLinks.length > 0) {
          const teamIds = memberLinks.map((m: any) => m.team_id);
          const { data: memberTeamDetails, error: detailError } = await supabase
            .from("teams")
            .select("*")
            .in("id", teamIds);

          if (detailError) {
            setError(`Error fetching member team details: ${detailError.message}`);
            return;
          }

          allTeams.push(...(memberTeamDetails || []));
        }

        setTeams(allTeams);
        setStatus(`Total: ${allTeams.length} teams`);
      } catch (e: any) {
        setError(`Exception: ${e.message}`);
      }
    };

    diagnose();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Debug: Teams Query</h1>

        <div className="space-y-4">
          {/* Status */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-foreground/60 mb-2">Status</h2>
            <p className="text-foreground">{status}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-red-400 mb-2">Error</h2>
              <p className="text-red-300 font-mono text-sm">{error}</p>
            </div>
          )}

          {/* User Info */}
          {user && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-foreground/60 mb-2">User</h2>
              <div className="space-y-1 text-sm font-mono text-foreground/80">
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Last Sign In: {new Date(user.last_sign_in_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Teams */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-foreground/60 mb-3">
              Teams ({teams.length})
            </h2>
            {teams.length === 0 ? (
              <p className="text-foreground/60 text-sm">No teams found</p>
            ) : (
              <div className="space-y-2">
                {teams.map((team: any) => (
                  <div key={team.id} className="bg-background rounded p-2 text-sm">
                    <p className="font-mono text-foreground">{team.name}</p>
                    <p className="text-foreground/60">ID: {team.id}</p>
                    <p className="text-foreground/60">Owner: {team.owner_id === user?.id ? "You" : team.owner_id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-foreground/60 mb-3">
              Team Memberships ({teamMembers.length})
            </h2>
            {teamMembers.length === 0 ? (
              <p className="text-foreground/60 text-sm">No memberships found</p>
            ) : (
              <ul className="space-y-1 text-sm font-mono text-foreground/80">
                {teamMembers.map((m: any, i: number) => (
                  <li key={i}>Team: {m.team_id}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-green-400 mb-2">What to check:</h2>
            <ul className="text-sm text-green-300 space-y-1 list-disc list-inside">
              <li>Is there an error message above?</li>
              <li>Are there any teams listed?</li>
              <li>If authenticated but no teams, you need to create one</li>
              <li>If the status is stuck on "Loading", check browser console</li>
            </ul>
          </div>

          {/* Go Back */}
          <div>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
