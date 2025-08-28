/**
 * Mission Selector Component
 *
 * UI component for selecting and configuring SLS missions
 * including Artemis II and other future missions.
 */

import React, { useCallback, useState } from 'react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import {
    Calendar,
    Clock,
    Globe,
    MapPin,
    Rocket,
    Target,
    Users
} from './ui/Icons'
import { Separator } from './ui/Separator'

// Mission types
export interface MissionConfig {
  id: string
  name: string
  description: string
  vehicle: 'SLS-Block1' | 'SLS-Block1B' | 'SLS-Block2'
  destination: 'LEO' | 'Moon' | 'Mars' | 'Asteroid' | 'Europa'
  crew: number
  duration: number // days
  launchSite: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  launchDate?: string
  objectives: string[]
  keyMilestones: string[]
  trajectory: {
    apogee: number // km
    perigee: number // km
    inclination: number // degrees
    deltaV: number // m/s
  }
}

const AVAILABLE_MISSIONS: MissionConfig[] = [
  {
    id: 'artemis-1',
    name: 'Artemis I',
    description: 'Uncrewed test flight of SLS and Orion around the Moon',
    vehicle: 'SLS-Block1',
    destination: 'Moon',
    crew: 0,
    duration: 25.5,
    launchSite: 'LC-39B',
    status: 'completed',
    launchDate: '2022-11-16',
    objectives: [
      'Test SLS Block 1 performance',
      'Validate Orion heat shield',
      'Demonstrate lunar orbit insertion',
      'Evaluate mission systems'
    ],
    keyMilestones: [
      'Liftoff and ascent',
      'Trans-lunar injection',
      'Lunar orbit insertion',
      'Distant retrograde orbit',
      'Trans-Earth injection',
      'Splashdown'
    ],
    trajectory: {
      apogee: 384400,
      perigee: 185,
      inclination: 28.5,
      deltaV: 3200
    }
  },
  {
    id: 'artemis-2',
    name: 'Artemis II',
    description: 'Crewed lunar flyby mission testing Orion life support systems',
    vehicle: 'SLS-Block1',
    destination: 'Moon',
    crew: 4,
    duration: 10,
    launchSite: 'LC-39B',
    status: 'planned',
    launchDate: '2025-11-01',
    objectives: [
      'First crewed SLS flight',
      'Test Orion life support systems',
      'Lunar flyby and return',
      'Crew training and procedures'
    ],
    keyMilestones: [
      'Crewed liftoff',
      'Earth parking orbit',
      'Trans-lunar injection burn',
      'Lunar flyby at 10,000 km',
      'Free return trajectory',
      'Crew recovery'
    ],
    trajectory: {
      apogee: 384400,
      perigee: 185,
      inclination: 28.5,
      deltaV: 3100
    }
  },
  {
    id: 'artemis-3',
    name: 'Artemis III',
    description: 'First crewed lunar landing since Apollo 17',
    vehicle: 'SLS-Block1',
    destination: 'Moon',
    crew: 4,
    duration: 30,
    launchSite: 'LC-39B',
    status: 'planned',
    launchDate: '2026-09-01',
    objectives: [
      'Land crew on lunar south pole',
      'Conduct surface EVAs',
      'Deploy science instruments',
      'Return lunar samples'
    ],
    keyMilestones: [
      'Launch and rendezvous',
      'Lunar orbit insertion',
      'Landing site approach',
      'Surface operations',
      'Lunar ascent',
      'Earth return'
    ],
    trajectory: {
      apogee: 384400,
      perigee: 100,
      inclination: 28.5,
      deltaV: 4200
    }
  },
  {
    id: 'europa-clipper',
    name: 'Europa Clipper Enhanced',
    description: 'SLS-launched mission to Jupiter\'s moon Europa',
    vehicle: 'SLS-Block1B',
    destination: 'Europa',
    crew: 0,
    duration: 2555, // ~7 years
    launchSite: 'LC-39B',
    status: 'planned',
    launchDate: '2028-03-15',
    objectives: [
      'Study Europa\'s ice shell',
      'Analyze subsurface ocean',
      'Search for biosignatures',
      'Map surface composition'
    ],
    keyMilestones: [
      'Launch on direct trajectory',
      'Jupiter arrival',
      'Europa orbit insertion',
      'Science observations',
      'Mission extension'
    ],
    trajectory: {
      apogee: 740000000, // Jupiter distance
      perigee: 185,
      inclination: 28.5,
      deltaV: 8900
    }
  }
]

interface MissionSelectorProps {
  onMissionSelect: (mission: MissionConfig) => void
  selectedMission?: MissionConfig
  className?: string
}

export const MissionSelector: React.FC<MissionSelectorProps> = ({
  onMissionSelect,
  selectedMission,
  className = ''
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDestination, setFilterDestination] = useState<string>('all')

  const filteredMissions = AVAILABLE_MISSIONS.filter(mission => {
    const statusMatch = filterStatus === 'all' || mission.status === filterStatus
    const destinationMatch = filterDestination === 'all' || mission.destination === filterDestination
    return statusMatch && destinationMatch
  })

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getDestinationIcon = useCallback((destination: string) => {
    switch (destination) {
      case 'Moon': return <Target className="w-4 h-4" />
      case 'Mars': return <Globe className="w-4 h-4" />
      case 'Europa': return <Target className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Rocket className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mission Selector</h2>
          <p className="text-gray-600">Choose an SLS mission to simulate</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Destination Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <select
                value={filterDestination}
                onChange={(e) => setFilterDestination(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Destinations</option>
                <option value="Moon">Moon</option>
                <option value="Mars">Mars</option>
                <option value="Europa">Europa</option>
                <option value="LEO">Low Earth Orbit</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMissions.map((mission) => (
          <Card
            key={mission.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMission?.id === mission.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onMissionSelect(mission)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getDestinationIcon(mission.destination)}
                  <div>
                    <CardTitle className="text-xl">{mission.name}</CardTitle>
                    <p className="text-gray-600 mt-1">{mission.description}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(mission.status)}>
                  {mission.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Mission Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Rocket className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{mission.vehicle}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{mission.launchSite}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {mission.crew === 0 ? 'Uncrewed' : `${mission.crew} crew`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{mission.duration} days</span>
                </div>
              </div>

              {/* Launch Date */}
              {mission.launchDate && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    Launch: {new Date(mission.launchDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <Separator />

              {/* Key Objectives */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Objectives</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {mission.objectives.slice(0, 3).map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                  {mission.objectives.length > 3 && (
                    <li className="text-gray-400 text-xs">
                      +{mission.objectives.length - 3} more objectives
                    </li>
                  )}
                </ul>
              </div>

              {/* Trajectory Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trajectory</h4>
                {mission.trajectory ? (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Apogee: {mission.trajectory.apogee.toLocaleString()} km</div>
                    <div>Perigee: {mission.trajectory.perigee} km</div>
                    <div>Inclination: {mission.trajectory.inclination}°</div>
                    <div>ΔV: {mission.trajectory.deltaV.toLocaleString()} m/s</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Target Orbit: {mission.name.includes('Artemis') ? '185 km circular' : 'N/A'}</div>
                    <div>Inclination: {mission.name.includes('Artemis') ? '28.5°' : 'N/A'}</div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Action Button */}
            <div className="p-4 bg-gray-50 rounded-b-lg">
              <Button
                className="w-full"
                variant={selectedMission?.id === mission.id ? "default" : "outline"}
              >
                {selectedMission?.id === mission.id ? 'Selected' : 'Select Mission'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredMissions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No missions found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more missions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MissionSelector;
