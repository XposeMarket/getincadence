'use client'

import { createContext, useContext, ReactNode } from 'react'
import { getIndustryConfig, getTerminology, IndustryType, IndustryConfig } from '@/lib/industry-config'

interface IndustryContextType {
  industryType: IndustryType
  config: IndustryConfig
  terminology: ReturnType<typeof getTerminology>
}

const IndustryContext = createContext<IndustryContextType | null>(null)

interface IndustryProviderProps {
  industryType: IndustryType
  children: ReactNode
}

export function IndustryProvider({ industryType, children }: IndustryProviderProps) {
  const config = getIndustryConfig(industryType)
  const terminology = getTerminology(industryType)

  return (
    <IndustryContext.Provider value={{ industryType, config, terminology }}>
      {children}
    </IndustryContext.Provider>
  )
}

/**
 * Hook to access industry config and terminology
 * Must be used within an IndustryProvider
 */
export function useIndustry() {
  const context = useContext(IndustryContext)
  
  if (!context) {
    // Return default industry config if provider not found
    // This allows pages to work even without the provider
    const defaultConfig = getIndustryConfig('default')
    return {
      industryType: 'default' as IndustryType,
      config: defaultConfig,
      terminology: getTerminology('default'),
    }
  }
  
  return context
}
