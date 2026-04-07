import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const TeamContext = createContext()

export function TeamProvider({ children }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [activeTeam, setActiveTeam] = useState(null) // null means Personal Workspace
  const [loadingTeams, setLoadingTeams] = useState(true)

  const fetchTeams = async () => {
    if (!user) return
    setLoadingTeams(true)
    
    // Fetch owned teams
    const { data: ownedTeams } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)

    // Fetch member teams
    const { data: memberRecords } = await supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('user_id', user.id)

    const memberTeams = memberRecords?.map(m => m.teams) || []
    
    // Combine and deduplicate
    const all = [...(ownedTeams || []), ...memberTeams]
    const uniqueTeams = Array.from(new Map(all.map(t => [t.id, t])).values())
    
    setTeams(uniqueTeams)
    
    // If activeTeam is no longer in list, reset to null
    if (activeTeam && !uniqueTeams.some(t => t.id === activeTeam.id)) {
      setActiveTeam(null)
    }
    
    setLoadingTeams(false)
  }

  useEffect(() => {
    fetchTeams()
    // Subscribe to team changes
    const teamsSub = supabase.channel('teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeams)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, fetchTeams)
      .subscribe()
      
    return () => {
      supabase.removeChannel(teamsSub)
    }
  }, [user])

  return (
    <TeamContext.Provider value={{ teams, activeTeam, setActiveTeam, fetchTeams, loadingTeams }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  return useContext(TeamContext)
}
